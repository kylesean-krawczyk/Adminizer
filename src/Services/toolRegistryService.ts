import { supabase } from '../lib/supabase';
import { PermissionService } from './permissionService';
import type {
  ToolDefinition,
  ToolParameter,
  ToolReturnSchema,
  ToolExecutionLog,
  ToolWithDetails,
  ToolExecutionStats,
  ToolRegistryFilters,
  ToolExecutionStatus
} from '../types/toolRegistry';

export class ToolRegistryService {
  static async fetchAllTools(filters?: ToolRegistryFilters, userId?: string): Promise<ToolDefinition[]> {
    let query = supabase
      .from('ai_tool_registry')
      .select('*')
      .order('name');

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.permissionLevel) {
      query = query.eq('permission_level', filters.permissionLevel);
    }

    if (filters?.isEnabled !== undefined) {
      query = query.eq('is_enabled', filters.isEnabled);
    }

    if (filters?.requiresConfirmation !== undefined) {
      query = query.eq('requires_confirmation', filters.requiresConfirmation);
    }

    if (filters?.searchQuery) {
      query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tools:', error);
      throw new Error(`Failed to fetch tools: ${error.message}`);
    }

    if (!data) return [];

    if (userId) {
      const availableTools: ToolDefinition[] = [];
      for (const tool of data) {
        const accessCheck = await PermissionService.checkToolAccess(userId, tool.id);
        if (accessCheck.allowed) {
          availableTools.push(tool);
        }
      }
      return availableTools;
    }

    return data;
  }

  static async fetchToolBySlug(slug: string): Promise<ToolDefinition | null> {
    const { data, error } = await supabase
      .from('ai_tool_registry')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('Error fetching tool by slug:', error);
      throw new Error(`Failed to fetch tool: ${error.message}`);
    }

    return data;
  }

  static async fetchToolById(id: string): Promise<ToolDefinition | null> {
    const { data, error } = await supabase
      .from('ai_tool_registry')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching tool by id:', error);
      throw new Error(`Failed to fetch tool: ${error.message}`);
    }

    return data;
  }

  static async fetchToolWithDetails(slug: string): Promise<ToolWithDetails | null> {
    const tool = await this.fetchToolBySlug(slug);
    if (!tool) return null;

    const [parameters, returnSchema] = await Promise.all([
      this.fetchToolParameters(tool.id),
      this.fetchToolReturnSchema(tool.id)
    ]);

    return {
      ...tool,
      parameters: parameters || [],
      return_schema: returnSchema!
    };
  }

  static async fetchToolParameters(toolId: string): Promise<ToolParameter[]> {
    const { data, error } = await supabase
      .from('ai_tool_parameters')
      .select('*')
      .eq('tool_id', toolId)
      .order('display_order');

    if (error) {
      console.error('Error fetching tool parameters:', error);
      throw new Error(`Failed to fetch parameters: ${error.message}`);
    }

    return data || [];
  }

  static async fetchToolReturnSchema(toolId: string): Promise<ToolReturnSchema | null> {
    const { data, error } = await supabase
      .from('ai_tool_return_schema')
      .select('*')
      .eq('tool_id', toolId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching tool return schema:', error);
      throw new Error(`Failed to fetch return schema: ${error.message}`);
    }

    return data;
  }

  static async logToolExecution(log: {
    tool_id: string;
    user_id: string;
    session_id?: string;
    parameters: Record<string, any>;
    response?: Record<string, any>;
    execution_time_ms?: number;
    status: ToolExecutionStatus;
    error_message?: string;
    user_confirmed?: boolean;
  }): Promise<ToolExecutionLog | null> {
    const { data, error } = await supabase
      .from('ai_tool_execution_logs')
      .insert({
        tool_id: log.tool_id,
        user_id: log.user_id,
        session_id: log.session_id,
        parameters: log.parameters,
        response: log.response,
        execution_time_ms: log.execution_time_ms,
        status: log.status,
        error_message: log.error_message,
        user_confirmed: log.user_confirmed || false
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging tool execution:', error);
      throw new Error(`Failed to log execution: ${error.message}`);
    }

    return data;
  }

  static async updateExecutionLog(
    logId: string,
    updates: {
      response?: Record<string, any>;
      execution_time_ms?: number;
      status?: ToolExecutionStatus;
      error_message?: string;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('ai_tool_execution_logs')
      .update(updates)
      .eq('id', logId);

    if (error) {
      console.error('Error updating execution log:', error);
      throw new Error(`Failed to update log: ${error.message}`);
    }
  }

  static async fetchExecutionLogs(filters?: {
    toolId?: string;
    userId?: string;
    status?: ToolExecutionStatus;
    limit?: number;
    offset?: number;
  }): Promise<ToolExecutionLog[]> {
    let query = supabase
      .from('ai_tool_execution_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.toolId) {
      query = query.eq('tool_id', filters.toolId);
    }

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching execution logs:', error);
      throw new Error(`Failed to fetch logs: ${error.message}`);
    }

    return data || [];
  }

  static async fetchToolExecutionStats(toolId: string): Promise<ToolExecutionStats> {
    const { data, error } = await supabase
      .from('ai_tool_execution_logs')
      .select('status, execution_time_ms, created_at')
      .eq('tool_id', toolId);

    if (error) {
      console.error('Error fetching execution stats:', error);
      return {
        totalExecutions: 0,
        successCount: 0,
        failureCount: 0,
        averageExecutionTime: 0,
        successRate: 0
      };
    }

    const logs = data || [];
    const totalExecutions = logs.length;
    const successCount = logs.filter(log => log.status === 'success').length;
    const failureCount = logs.filter(log => log.status === 'failed').length;

    const executionTimes = logs
      .filter(log => log.execution_time_ms !== null)
      .map(log => log.execution_time_ms!);

    const averageExecutionTime = executionTimes.length > 0
      ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
      : 0;

    const successRate = totalExecutions > 0 ? (successCount / totalExecutions) * 100 : 0;

    const lastExecuted = logs.length > 0 ? logs[0].created_at : undefined;

    return {
      totalExecutions,
      successCount,
      failureCount,
      averageExecutionTime: Math.round(averageExecutionTime),
      successRate: Math.round(successRate * 10) / 10,
      lastExecuted
    };
  }

  static async updateTool(
    toolId: string,
    updates: Partial<Pick<ToolDefinition, 'name' | 'description' | 'is_enabled' | 'requires_confirmation'>>
  ): Promise<void> {
    const { error } = await supabase
      .from('ai_tool_registry')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', toolId);

    if (error) {
      console.error('Error updating tool:', error);
      throw new Error(`Failed to update tool: ${error.message}`);
    }
  }

  static validateToolParameters(
    parameters: Record<string, any>,
    toolParameters: ToolParameter[]
  ): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    for (const param of toolParameters) {
      const value = parameters[param.name];

      if (param.is_required && (value === undefined || value === null || value === '')) {
        errors[param.name] = `${param.name} is required`;
        continue;
      }

      if (value === undefined || value === null) {
        continue;
      }

      if (param.type === 'string' && typeof value !== 'string') {
        errors[param.name] = `${param.name} must be a string`;
      }

      if (param.type === 'number' && typeof value !== 'number') {
        errors[param.name] = `${param.name} must be a number`;
      }

      if (param.type === 'boolean' && typeof value !== 'boolean') {
        errors[param.name] = `${param.name} must be a boolean`;
      }

      if (param.type === 'array' && !Array.isArray(value)) {
        errors[param.name] = `${param.name} must be an array`;
      }

      if (param.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
        errors[param.name] = `${param.name} must be an object`;
      }

      if (param.type === 'enum' && param.enum_values) {
        if (!param.enum_values.includes(value)) {
          errors[param.name] = `${param.name} must be one of: ${param.enum_values.join(', ')}`;
        }
      }

      if (param.validation_rules) {
        const rules = param.validation_rules;

        if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
          errors[param.name] = `${param.name} must be at least ${rules.minLength} characters`;
        }

        if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
          errors[param.name] = `${param.name} must be at most ${rules.maxLength} characters`;
        }

        if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
          errors[param.name] = `${param.name} must be at least ${rules.min}`;
        }

        if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
          errors[param.name] = `${param.name} must be at most ${rules.max}`;
        }

        if (rules.format === 'email' && typeof value === 'string') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors[param.name] = `${param.name} must be a valid email address`;
          }
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  static async checkUserPermission(userId: string, permissionLevel: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    const userRole = data.role;

    const permissionHierarchy: Record<string, number> = {
      'public': 0,
      'user': 1,
      'admin': 2,
      'master_admin': 3
    };

    const userLevel = permissionHierarchy[userRole] || 0;
    const requiredLevel = permissionHierarchy[permissionLevel] || 0;

    return userLevel >= requiredLevel;
  }
}
