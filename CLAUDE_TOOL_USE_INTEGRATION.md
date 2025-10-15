# Claude Tool Use Integration

This document describes the integration of Claude's native tool use (function calling) API with the chat assistant.

## Overview

The application now uses Claude's native tool use capabilities to enable the AI assistant to intelligently select and execute tools based on user requests. This replaces the previous keyword-based approach with a more robust, context-aware system.

## Architecture

### Core Components

1. **ToolDefinitionTransformer** (`src/services/toolDefinitionTransformer.ts`)
   - Converts database tool schemas into Claude's tool definition format
   - Transforms tool parameters into JSON Schema format
   - Validates tool inputs against schemas
   - Formats tool results for Claude's continuation API

2. **ToolUseCoordinator** (`src/services/toolUseCoordinator.ts`)
   - Orchestrates the full tool use conversation flow
   - Fetches available tools based on user permissions
   - Manages communication with Claude API for tool-enabled chats
   - Executes tools and collects results
   - Handles tool continuations with results

3. **Anthropic Proxy Function** (`netlify functions/anthropic-proxy.ts`)
   - Updated to use the official Anthropic SDK
   - Supports `tool_enabled_chat` and `tool_continuation` modes
   - Handles tool definitions in requests to Claude
   - Returns structured responses with tool use blocks

4. **Enhanced Chat Service** (`src/services/chatService.ts`)
   - New `processToolEnabledMessage()` method
   - Integrates with ToolUseCoordinator
   - Stores tool usage metadata in chat messages
   - Falls back to non-tool mode when needed

## How It Works

### Conversation Flow

1. **User sends a message** in the chat interface
2. **ChatService** fetches available tools for the user from the database
3. **ToolDefinitionTransformer** converts tools to Claude's format
4. **Message sent to Claude** via the Netlify proxy with tool definitions
5. **Claude analyzes** the request and decides whether to use tools
6. **If tools are needed:**
   - Claude returns `tool_use` blocks with tool names and parameters
   - **ToolUseCoordinator** parses these blocks
   - **Tools are executed** through the existing ToolExecutionEngine
   - **Results are collected** from all tool executions
   - **Results sent back to Claude** via continuation request
   - **Claude generates final response** incorporating tool results
7. **Final response displayed** to user with tool usage indicators

### Tool Selection

Claude automatically determines when to use tools based on:
- The system prompt describing available tools
- Tool descriptions and parameter schemas
- User's natural language request
- Conversation context and history

### Tool Execution

All tool executions go through the existing security layer:
- Permission checks (user role vs tool permission level)
- Parameter validation (type checking, required fields, constraints)
- Confirmation requirements (if tool requires user approval)
- Execution logging (stored in database for audit trail)

## Features

### Intelligent Tool Selection

Claude uses natural language understanding to determine:
- Which tool(s) to call
- What parameters to extract from user messages
- When to call multiple tools in sequence
- When to answer without tools

### Multi-Tool Conversations

Claude can:
- Call multiple tools in a single response
- Chain tool calls together logically
- Combine results from different tools
- Provide unified, coherent explanations

### User-Friendly Responses

After executing tools, Claude:
- Interprets raw data into insights
- Explains what was found or done
- Provides context and recommendations
- Suggests follow-up actions

### Security & Permissions

The integration maintains all existing security:
- Users only see tools they have permission to use
- Tool execution requires proper authorization
- Confirmation prompts for sensitive operations
- All executions logged with user context

### Visual Indicators

The UI shows:
- Tool badges on assistant messages (production mode)
- Tool names that were executed
- Intent detection (development mode)
- Execution status and timing

## Configuration

### Tool Availability

By default, all enabled tools in the registry are available to Claude. Tools are filtered by:
- User's permission level
- Tool's `is_enabled` flag
- Organization configuration (if applicable)

### System Prompt

The tool-enabled system prompt is defined in:
```typescript
ClaudeService.buildToolEnabledSystemPrompt()
```

It provides Claude with:
- Platform capabilities overview
- Tool usage guidelines
- Best practices for tool selection
- Instructions for result interpretation

### Token Usage

The integration uses Claude Haiku (`claude-3-haiku-20240307`) for cost efficiency:
- Tool-enabled messages: ~2000 max tokens
- Good balance of capability and cost
- Fast response times
- Effective tool use performance

## Database Schema

### Tool Configuration Tables

New tables support tool configuration:

- **ai_tool_user_config**: Per-user tool preferences
- **ai_tool_organization_config**: Organization-wide tool settings

These allow:
- Disabling specific tools for users
- Organization-level tool management
- Fine-grained access control

### Message Metadata

Chat messages now store:
```typescript
{
  tool_enabled: boolean,
  tools_used: string[],
  requires_confirmation: boolean,
  pending_confirmations: Array<{
    toolUseId: string,
    toolName: string,
    parameters: Record<string, any>
  }>
}
```

## API Modes

The Anthropic proxy supports these modes:

1. **tool_enabled_chat**: Initial request with tools
   - Sends user message + tool definitions
   - Returns response (text and/or tool use blocks)

2. **tool_continuation**: Follow-up with tool results
   - Sends conversation history + tool results
   - Returns final response incorporating results

3. **intent_detection**: Legacy intent detection (still supported)

4. **generate_response**: Legacy response generation (still supported)

5. **analytics**: Sales analytics mode (still supported)

## Usage Examples

### Example 1: Document Search

```
User: "Find all financial documents from Q4"

Claude: [Uses searchDocuments tool]
  - Tool: searchDocuments
  - Parameters: { query: "financial Q4", category: "Financial" }

Response: "I found 3 financial documents from Q4 2024:
1. Q4 Financial Report 2024 (2.4 MB)
2. Q3 Sales Report (1.5 MB)
3. ... [user-friendly explanation]"
```

### Example 2: Employee Management

```
User: "Show me all the managers in operations"

Claude: [Uses getEmployeeList tool]
  - Tool: getEmployeeList
  - Parameters: { role: "manager", department: "operations" }

Response: "I found 2 managers in the Operations department:
1. John Doe - Operations Manager since Aug 2021
2. ... [contextual information]"
```

### Example 3: Multi-Tool Request

```
User: "Check the system status and show me recent employees"

Claude: [Uses getSystemStatus and getEmployeeList tools]
  - Tool 1: getSystemStatus
  - Tool 2: getEmployeeList (with recent filters)

Response: "The system is healthy with 42 active users.
Here are the 3 most recent employees:
1. ... [combined insights from both tools]"
```

## Development

### Adding New Tools

To add a new tool that works with Claude:

1. Add tool definition to database via `ai_tool_registry`
2. Define parameters in `ai_tool_parameters`
3. Implement tool logic in `ToolImplementations`
4. Add tool case to `ToolExecutionEngine.executeTool()`
5. Claude will automatically discover and use it

### Testing Tool Use

In development mode:
- Tool badges show which tools were executed
- Console logs show tool use requests and responses
- Use the Tool Registry Panel to test individual tools
- Check execution logs in the database

### Debugging

Common debugging steps:

1. Check tool is enabled in database
2. Verify user has proper permissions
3. Review tool parameters and validation rules
4. Check Claude's response for tool use blocks
5. Examine tool execution logs for errors
6. Review console logs for API errors

## Performance Considerations

### Token Optimization

To minimize token usage:
- Tool descriptions are concise but clear
- Only enabled tools are sent to Claude
- Conversation history limited to 10 messages
- Parameters use efficient JSON Schema

### Execution Efficiency

Tool executions are:
- Run in parallel when possible (future enhancement)
- Cached where appropriate
- Timed and logged for monitoring
- Optimized for fast response

### Cost Management

Using Haiku model provides:
- ~20x cheaper than Claude Opus
- ~5x cheaper than Claude Sonnet
- Excellent tool use capabilities
- Fast processing (~1-2 seconds per request)

## Security Considerations

### Permission Checks

All tool executions verify:
- User is authenticated
- User has required permission level
- Tool is enabled globally and for user
- Parameters are valid and safe

### Confirmation Flow

Tools requiring confirmation:
- Pause execution automatically
- Show user what will be done
- Wait for explicit approval
- Log confirmation status

### Audit Trail

Every tool execution is logged with:
- User ID and session ID
- Tool name and parameters
- Execution time and status
- Success/failure and errors
- Confirmation status

## Limitations

Current limitations:

1. **No streaming**: Tool use requires full responses
2. **Sequential execution**: Tools run one after another
3. **No nested tools**: Claude can't call tools that call other tools
4. **Text-only results**: Tool results must be JSON/text
5. **Max 2000 tokens**: Response length is limited

## Future Enhancements

Potential improvements:

1. **Streaming support**: Show tool execution in real-time
2. **Parallel execution**: Run multiple tools simultaneously
3. **Result caching**: Cache tool results for repeated queries
4. **Tool chaining**: Allow tools to call other tools
5. **Rich results**: Support images, charts in tool responses
6. **Usage analytics**: Dashboard for tool usage statistics
7. **A/B testing**: Compare tool-enabled vs non-tool responses
8. **Custom tools**: Allow users to define custom tools

## Troubleshooting

### Tool Not Being Used

If Claude doesn't use a tool when expected:
- Check tool description is clear
- Verify tool is enabled
- Review user permissions
- Check system prompt guides tool use
- Try more explicit user request

### Tool Execution Fails

If tool execution errors:
- Check parameter validation
- Verify database connectivity
- Review permission levels
- Check tool implementation
- Examine execution logs

### No Response from Claude

If no response is received:
- Verify API key is configured
- Check network connectivity
- Review proxy function logs
- Check token limits
- Verify request format

## Migration from Old System

The old keyword-based system is still available:

```typescript
// Use tool-enabled (new, default)
ChatService.processUserMessage(message, sessionId, history, true)

// Use keyword-based (legacy)
ChatService.processUserMessage(message, sessionId, history, false)
```

The tool-enabled system is now the default for all new conversations.

## References

- [Claude Tool Use Documentation](https://docs.anthropic.com/claude/docs/tool-use)
- [Anthropic SDK Documentation](https://github.com/anthropics/anthropic-sdk-typescript)
- Tool Registry Service: `src/services/toolRegistryService.ts`
- Tool Implementations: `src/services/toolImplementations.ts`
