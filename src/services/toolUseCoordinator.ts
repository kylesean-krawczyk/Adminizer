import { ToolRegistryService } from './toolRegistryService';
import { ToolDefinitionTransformer, ClaudeToolDefinition } from './toolDefinitionTransformer';

export interface ClaudeResponse {
  id: string;
  model: string;
  role: string;
  content: ClaudeContentBlock[];
  stop_reason: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ClaudeContentBlock {
  type: 'text' | 'tool_use';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, any>;
}

export interface ToolExecutionResult {
  toolUseId: string;
  toolName: string;
  success: boolean;
  result: any;
  error?: string;
  requiresConfirmation?: boolean;
}

export interface ProcessedToolResponse {
  hasToolUse: boolean;
  textContent: string;
  toolUseBlocks: ClaudeContentBlock[];
  toolExecutionResults: ToolExecutionResult[];
  requiresConfirmation: boolean;
  pendingConfirmations: Array<{
    toolUseId: string;
    toolId: string;
    toolName: string;
    toolDescription: string;
    parameters: Record<string, any>;
    reasoning?: string;
    confidence?: number;
  }>;
  reasoning?: string;
  confidence?: number;
}

export class ToolUseCoordinator {
  private static readonly API_ENDPOINT = '/.netlify/functions/anthropic-proxy';

  static async fetchAvailableTools(userId: string): Promise<ClaudeToolDefinition[]> {
    try {
      const tools = await ToolRegistryService.fetchAllTools({
        isEnabled: true
      }, userId);

      const toolsWithParams = await Promise.all(
        tools.map(async (tool) => {
          const parameters = await ToolRegistryService.fetchToolParameters(tool.id);
          return { tool, parameters };
        })
      );

      return ToolDefinitionTransformer.transformAllToolsForClaude(toolsWithParams);
    } catch (error) {
      console.error('Error fetching available tools:', error);
      return [];
    }
  }

  static async sendToolEnabledMessage(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string | any[] }>,
    systemPrompt: string,
    tools: ClaudeToolDefinition[]
  ): Promise<ClaudeResponse | null> {
    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'tool_enabled_chat',
          userMessage,
          conversationHistory,
          systemPrompt,
          tools
        })
      });

      if (!response.ok) {
        throw new Error(`Tool-enabled chat failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending tool-enabled message:', error);
      return null;
    }
  }

  static async sendToolContinuation(
    conversationHistory: Array<{ role: string; content: string | any[] }>,
    toolResults: any[],
    systemPrompt: string,
    tools: ClaudeToolDefinition[]
  ): Promise<ClaudeResponse | null> {
    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'tool_continuation',
          conversationHistory,
          toolResults,
          systemPrompt,
          tools
        })
      });

      if (!response.ok) {
        throw new Error(`Tool continuation failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending tool continuation:', error);
      return null;
    }
  }

  static parseClaudeResponse(response: ClaudeResponse): {
    hasToolUse: boolean;
    textContent: string;
    toolUseBlocks: ClaudeContentBlock[];
  } {
    const toolUseBlocks: ClaudeContentBlock[] = [];
    const textParts: string[] = [];

    for (const block of response.content) {
      if (block.type === 'text' && block.text) {
        textParts.push(block.text);
      } else if (block.type === 'tool_use') {
        toolUseBlocks.push(block);
      }
    }

    return {
      hasToolUse: toolUseBlocks.length > 0,
      textContent: textParts.join('\n'),
      toolUseBlocks
    };
  }

  static async executeToolsFromClaudeResponse(
    toolUseBlocks: ClaudeContentBlock[],
    _userId: string,
    _sessionId?: string,
    reasoning?: string,
    confidence?: number
  ): Promise<ProcessedToolResponse> {
    const toolExecutionResults: ToolExecutionResult[] = [];
    const pendingConfirmations: Array<{
      toolUseId: string;
      toolId: string;
      toolName: string;
      toolDescription: string;
      parameters: Record<string, any>;
      reasoning?: string;
      confidence?: number;
    }> = [];

    let requiresConfirmation = false;

    for (const block of toolUseBlocks) {
      if (block.type !== 'tool_use' || !block.name || !block.id) {
        continue;
      }

      const toolSlug = block.name;
      const parameters = block.input || {};
      const toolUseId = block.id;

      try {
        const tool = await ToolRegistryService.fetchToolBySlug(toolSlug);

        if (!tool) {
          toolExecutionResults.push({
            toolUseId,
            toolName: toolSlug,
            success: false,
            result: null,
            error: `Tool not found: ${toolSlug}`
          });
          continue;
        }

        requiresConfirmation = true;
        pendingConfirmations.push({
          toolUseId,
          toolId: tool.id,
          toolName: tool.name,
          toolDescription: tool.description,
          parameters,
          reasoning,
          confidence
        });

        toolExecutionResults.push({
          toolUseId,
          toolName: toolSlug,
          success: false,
          result: null,
          requiresConfirmation: true
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toolExecutionResults.push({
          toolUseId,
          toolName: toolSlug,
          success: false,
          result: null,
          error: errorMessage
        });
      }
    }

    return {
      hasToolUse: toolUseBlocks.length > 0,
      textContent: '',
      toolUseBlocks,
      toolExecutionResults,
      requiresConfirmation,
      pendingConfirmations,
      reasoning,
      confidence
    };
  }

  static formatToolResultsForClaude(
    toolExecutionResults: ToolExecutionResult[]
  ): any[] {
    return toolExecutionResults.map(result => {
      if (result.requiresConfirmation) {
        return ToolDefinitionTransformer.formatToolResultForClaude(
          result.toolUseId,
          'Tool execution requires user confirmation. Awaiting user approval.',
          false
        );
      }

      if (!result.success) {
        return ToolDefinitionTransformer.formatToolResultForClaude(
          result.toolUseId,
          result.error || 'Tool execution failed',
          true
        );
      }

      return ToolDefinitionTransformer.formatToolResultForClaude(
        result.toolUseId,
        result.result,
        false
      );
    });
  }

  static async processToolEnabledConversation(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string | any[] }>,
    systemPrompt: string,
    userId: string,
    sessionId?: string
  ): Promise<{
    response: string;
    toolsUsed: string[];
    requiresConfirmation: boolean;
    pendingConfirmations: any[];
    fullResponse?: ClaudeResponse;
  }> {
    try {
      const tools = await this.fetchAvailableTools(userId);

      if (tools.length === 0) {
        return {
          response: 'No tools are currently available. I can only provide text-based assistance.',
          toolsUsed: [],
          requiresConfirmation: false,
          pendingConfirmations: []
        };
      }

      const claudeResponse = await this.sendToolEnabledMessage(
        userMessage,
        conversationHistory,
        systemPrompt,
        tools
      );

      if (!claudeResponse) {
        throw new Error('Failed to get response from Claude');
      }

      const parsed = this.parseClaudeResponse(claudeResponse);

      if (!parsed.hasToolUse) {
        return {
          response: parsed.textContent || 'I apologize, but I did not understand your request.',
          toolsUsed: [],
          requiresConfirmation: false,
          pendingConfirmations: [],
          fullResponse: claudeResponse
        };
      }

      const reasoning = parsed.textContent || 'Tool usage initiated based on your request.';
      const confidence = 0.85;

      const executionResult = await this.executeToolsFromClaudeResponse(
        parsed.toolUseBlocks,
        userId,
        sessionId,
        reasoning,
        confidence
      );

      if (executionResult.requiresConfirmation) {
        return {
          response: parsed.textContent || 'I need your confirmation to proceed with the following actions.',
          toolsUsed: executionResult.pendingConfirmations.map(c => c.toolName),
          requiresConfirmation: true,
          pendingConfirmations: executionResult.pendingConfirmations,
          fullResponse: claudeResponse
        };
      }

      const toolResults = this.formatToolResultsForClaude(executionResult.toolExecutionResults);

      const continuationHistory = [
        ...conversationHistory,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: claudeResponse.content }
      ];

      const finalResponse = await this.sendToolContinuation(
        continuationHistory,
        toolResults,
        systemPrompt,
        tools
      );

      if (!finalResponse) {
        throw new Error('Failed to get final response from Claude');
      }

      const finalParsed = this.parseClaudeResponse(finalResponse);

      return {
        response: finalParsed.textContent || 'Here are the results from the requested actions.',
        toolsUsed: executionResult.toolExecutionResults
          .filter(r => r.success)
          .map(r => r.toolName),
        requiresConfirmation: false,
        pendingConfirmations: [],
        fullResponse: finalResponse
      };

    } catch (error) {
      console.error('Error processing tool-enabled conversation:', error);
      return {
        response: 'I apologize, but I encountered an error while processing your request. Please try again.',
        toolsUsed: [],
        requiresConfirmation: false,
        pendingConfirmations: []
      };
    }
  }
}
