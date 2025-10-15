import { ToolRegistryService } from './toolRegistryService';
import { ToolImplementations } from './toolImplementations';
import { PermissionService } from './permissionService';
import type {
  ToolExecutionRequest,
  ToolExecutionResponse,
  UserConfirmationRequest
} from '../types/toolRegistry';

export class ToolExecutionEngine {
  static async executeToolWithConfirmation(
    request: ToolExecutionRequest,
    userId: string
  ): Promise<ToolExecutionResponse> {
    try {
      const tool = await ToolRegistryService.fetchToolWithDetails(request.toolSlug);

      if (!tool) {
        return {
          success: false,
          error: `Tool not found: ${request.toolSlug}`
        };
      }

      if (!tool.is_enabled) {
        return {
          success: false,
          error: `Tool is currently disabled: ${tool.name}`
        };
      }

      const permissionCheck = await PermissionService.checkToolAccess(userId, tool.id);

      if (!permissionCheck.allowed) {
        await ToolRegistryService.logToolExecution({
          tool_id: tool.id,
          user_id: userId,
          session_id: request.sessionId,
          parameters: request.parameters,
          status: 'failed',
          error_message: permissionCheck.reason,
          user_confirmed: false
        });

        return {
          success: false,
          error: `Access denied: ${permissionCheck.reason}. Contact your administrator to request access to ${tool.name}.`
        };
      }

      const validation = ToolRegistryService.validateToolParameters(
        request.parameters,
        tool.parameters
      );

      if (!validation.isValid) {
        return {
          success: false,
          error: 'Invalid parameters',
          data: { validationErrors: validation.errors }
        };
      }

      if (!request.skipConfirmation) {
        return {
          success: false,
          requiresConfirmation: true,
          toolName: tool.name,
          toolDescription: tool.description,
          parameters: request.parameters,
          error: 'User confirmation required before execution'
        };
      }

      return await this.executeTool(tool.slug, request.parameters, userId, tool.id, request.sessionId);

    } catch (error) {
      console.error('Tool execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async executeTool(
    toolSlug: string,
    parameters: Record<string, any>,
    userId: string,
    toolId: string,
    sessionId?: string
  ): Promise<ToolExecutionResponse> {
    const startTime = Date.now();

    const log = await ToolRegistryService.logToolExecution({
      tool_id: toolId,
      user_id: userId,
      session_id: sessionId,
      parameters,
      status: 'executing',
      user_confirmed: true
    });

    try {
      let result: any;

      switch (toolSlug) {
        case 'searchDocuments':
          result = await ToolImplementations.searchDocuments(parameters as any);
          break;

        case 'analyzeData':
          result = await ToolImplementations.analyzeData(parameters as any);
          break;

        case 'createEmployeeRecord':
          result = await ToolImplementations.createEmployeeRecord(parameters as any);
          break;

        case 'getEmployeeList':
          result = await ToolImplementations.getEmployeeList(parameters as any);
          break;

        case 'generateReport':
          result = await ToolImplementations.generateReport(parameters as any);
          break;

        case 'getSystemStatus':
          result = await ToolImplementations.getSystemStatus();
          break;

        default:
          throw new Error(`Tool implementation not found: ${toolSlug}`);
      }

      const executionTime = Date.now() - startTime;

      if (log) {
        await ToolRegistryService.updateExecutionLog(log.id, {
          response: result,
          execution_time_ms: executionTime,
          status: 'success'
        });
      }

      return {
        success: true,
        data: result,
        executionTimeMs: executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (log) {
        await ToolRegistryService.updateExecutionLog(log.id, {
          execution_time_ms: executionTime,
          status: 'failed',
          error_message: errorMessage
        });
      }

      return {
        success: false,
        error: errorMessage,
        executionTimeMs: executionTime
      };
    }
  }

  static async prepareConfirmationRequest(
    toolSlug: string,
    parameters: Record<string, any>
  ): Promise<UserConfirmationRequest | null> {
    try {
      const tool = await ToolRegistryService.fetchToolWithDetails(toolSlug);

      if (!tool) {
        return null;
      }

      return {
        toolId: tool.id,
        toolName: tool.name,
        toolDescription: tool.description,
        parameters,
        requiresConfirmation: tool.requires_confirmation
      };

    } catch (error) {
      console.error('Error preparing confirmation request:', error);
      return null;
    }
  }

  static async cancelExecution(logId: string): Promise<void> {
    await ToolRegistryService.updateExecutionLog(logId, {
      status: 'cancelled',
      error_message: 'Execution cancelled by user'
    });
  }

  static formatToolResponseForChat(response: ToolExecutionResponse): string {
    if (!response.success) {
      return `Tool execution failed: ${response.error}`;
    }

    const data = response.data;

    if (data.success === false) {
      return `Tool returned an error: ${data.message || 'Unknown error'}`;
    }

    let formattedResponse = '';

    if (data.summary && data.query) {
      formattedResponse = `Analytics Result:\n\n`;

      if (data.summary.insights && data.summary.insights.length > 0) {
        data.summary.insights.forEach((insight: string) => {
          formattedResponse += `• ${insight}\n`;
        });
        formattedResponse += '\n';
      }

      if (data.summary.aggregations) {
        formattedResponse += 'Key Metrics:\n';
        for (const [key, value] of Object.entries(data.summary.aggregations)) {
          const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          formattedResponse += `• ${label}: ${typeof value === 'number' ? value.toLocaleString() : value}\n`;
        }
        formattedResponse += '\n';
      }

      if (data.visualizationRecommendation) {
        formattedResponse += `Recommended visualization: ${data.visualizationRecommendation.chartType} chart\n`;
      }
    } else if (data.results) {
      formattedResponse = `Found ${data.total || data.results.length} result(s)`;
      if (data.results.length > 0) {
        formattedResponse += ':\n\n';
        data.results.slice(0, 5).forEach((item: any, index: number) => {
          formattedResponse += `${index + 1}. ${item.title || item.name || JSON.stringify(item)}\n`;
        });
        if (data.results.length > 5) {
          formattedResponse += `\n... and ${data.results.length - 5} more`;
        }
      }
    } else if (data.employees) {
      formattedResponse = `Found ${data.total} employee(s)`;
      if (data.employees.length > 0) {
        formattedResponse += ':\n\n';
        data.employees.slice(0, 5).forEach((emp: any, index: number) => {
          formattedResponse += `${index + 1}. ${emp.name} - ${emp.role} (${emp.department})\n`;
        });
        if (data.employees.length > 5) {
          formattedResponse += `\n... and ${data.employees.length - 5} more`;
        }
      }
    } else if (data.employee) {
      formattedResponse = `Employee record created:\n`;
      formattedResponse += `Name: ${data.employee.name}\n`;
      formattedResponse += `Email: ${data.employee.email}\n`;
      formattedResponse += `Role: ${data.employee.role}\n`;
      formattedResponse += `Start Date: ${data.employee.startDate}`;
    } else if (data.reportId) {
      formattedResponse = `Report generated successfully:\n`;
      formattedResponse += `Type: ${data.reportType}\n`;
      formattedResponse += `Report ID: ${data.reportId}\n`;
      formattedResponse += `Generated: ${new Date(data.generatedAt).toLocaleString()}`;
    } else if (data.status) {
      formattedResponse = `System Status: ${data.status.toUpperCase()}\n\n`;
      formattedResponse += `Active Users: ${data.metrics?.activeUsers || 'N/A'}\n`;
      formattedResponse += `Uptime: ${data.metrics?.uptime || 'N/A'}\n`;
      formattedResponse += `Storage: ${data.metrics?.storageUsed || 'N/A'} / ${data.metrics?.storageLimit || 'N/A'}`;
    } else {
      formattedResponse = JSON.stringify(data, null, 2);
    }

    if (response.executionTimeMs) {
      formattedResponse += `\n\n(Executed in ${response.executionTimeMs}ms)`;
    }

    return formattedResponse;
  }

  static extractToolCallFromMessage(message: string): {
    toolSlug: string;
    parameters: Record<string, any>;
  } | null {
    const toolCallPattern = /TOOL_CALL:\s*(\w+)\s*\((.*)\)/s;
    const match = message.match(toolCallPattern);

    if (!match) {
      return null;
    }

    const toolSlug = match[1];
    const paramsStr = match[2];

    try {
      const parameters = JSON.parse(`{${paramsStr}}`);
      return { toolSlug, parameters };
    } catch {
      return null;
    }
  }

  static shouldExecuteTool(_intent: string, message: string): boolean {
    const toolTriggerKeywords: Record<string, string[]> = {
      searchDocuments: ['search document', 'find document', 'look for document', 'document search'],
      analyzeData: ['how many', 'show me', 'what is', 'average', 'total', 'count', 'list', 'employee', 'donation', 'grant', 'hired', 'gave', 'application'],
      createEmployeeRecord: ['create employee', 'add employee', 'new employee', 'register employee'],
      getEmployeeList: ['list employees', 'show employees', 'get employees', 'employee list'],
      generateReport: ['generate report', 'create report', 'run report', 'report on'],
      getSystemStatus: ['system status', 'system health', 'check system', 'server status']
    };

    const messageLower = message.toLowerCase();

    for (const [_toolSlug, keywords] of Object.entries(toolTriggerKeywords)) {
      if (keywords.some(keyword => messageLower.includes(keyword))) {
        return true;
      }
    }

    return false;
  }

  static inferToolFromMessage(message: string): string | null {
    const toolTriggerKeywords: Record<string, string[]> = {
      searchDocuments: ['search document', 'find document', 'look for document', 'document search'],
      analyzeData: ['how many', 'show me', 'what is', 'average', 'total', 'count', 'list', 'employee', 'donation', 'grant', 'hired', 'gave', 'application'],
      createEmployeeRecord: ['create employee', 'add employee', 'new employee', 'register employee'],
      getEmployeeList: ['list employees', 'show employees', 'get employees', 'employee list'],
      generateReport: ['generate report', 'create report', 'run report', 'report on'],
      getSystemStatus: ['system status', 'system health', 'check system', 'server status']
    };

    const messageLower = message.toLowerCase();

    for (const [toolSlug, keywords] of Object.entries(toolTriggerKeywords)) {
      if (keywords.some(keyword => messageLower.includes(keyword))) {
        return toolSlug;
      }
    }

    return null;
  }

  static async executeToolBySlug(
    toolSlug: string,
    parameters: Record<string, any>,
    userId: string,
    sessionId?: string
  ): Promise<ToolExecutionResponse> {
    const tool = await ToolRegistryService.fetchToolBySlug(toolSlug);

    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${toolSlug}`
      };
    }

    return await this.executeTool(toolSlug, parameters, userId, tool.id, sessionId);
  }
}
