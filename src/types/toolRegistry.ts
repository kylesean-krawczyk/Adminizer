export type PermissionLevel = 'master_admin' | 'admin' | 'user' | 'public';

export type ToolCategory = 'documents' | 'employees' | 'reports' | 'system' | 'analytics';

export type ParameterType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'enum';

export type ToolExecutionStatus = 'pending' | 'executing' | 'success' | 'failed' | 'cancelled';

export interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  format?: string;
  pattern?: string;
  itemType?: string;
  properties?: Record<string, any>;
  [key: string]: any;
}

export interface ToolParameter {
  id: string;
  tool_id: string;
  name: string;
  type: ParameterType;
  is_required: boolean;
  default_value?: string | null;
  description: string;
  validation_rules?: ValidationRules;
  enum_values?: string[] | null;
  display_order: number;
  created_at: string;
}

export interface ToolReturnSchema {
  id: string;
  tool_id: string;
  schema_definition: Record<string, any>;
  example_response: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ToolCategory;
  permission_level: PermissionLevel;
  is_enabled: boolean;
  requires_confirmation: boolean;
  created_at: string;
  updated_at: string;
  parameters?: ToolParameter[];
  return_schema?: ToolReturnSchema;
}

export interface ToolExecutionLog {
  id: string;
  tool_id: string;
  user_id: string;
  session_id?: string | null;
  parameters: Record<string, any>;
  response?: Record<string, any> | null;
  execution_time_ms?: number | null;
  status: ToolExecutionStatus;
  error_message?: string | null;
  user_confirmed: boolean;
  reasoning_text?: string | null;
  confidence_score?: number | null;
  parameters_edited?: boolean;
  user_edit_details?: Record<string, any> | null;
  original_parameters?: Record<string, any> | null;
  created_at: string;
}

export interface ToolExecutionRequest {
  toolSlug: string;
  parameters: Record<string, any>;
  sessionId?: string;
  skipConfirmation?: boolean;
}

export interface ToolExecutionResponse {
  success: boolean;
  data?: any;
  error?: string;
  executionTimeMs?: number;
  requiresConfirmation?: boolean;
  toolName?: string;
  toolDescription?: string;
  parameters?: Record<string, any>;
}

export interface UserConfirmationRequest {
  toolId: string;
  toolName: string;
  toolDescription: string;
  parameters: Record<string, any>;
  requiresConfirmation: boolean;
}

export interface ToolWithDetails extends ToolDefinition {
  parameters: ToolParameter[];
  return_schema: ToolReturnSchema;
}

export interface ToolExecutionStats {
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  averageExecutionTime: number;
  successRate: number;
  lastExecuted?: string;
}

export interface ToolRegistryFilters {
  category?: ToolCategory;
  permissionLevel?: PermissionLevel;
  isEnabled?: boolean;
  requiresConfirmation?: boolean;
  searchQuery?: string;
}

export interface ParameterValue {
  name: string;
  value: any;
  type: ParameterType;
  isValid: boolean;
  error?: string;
}

export type ConfirmationStatus = 'approved' | 'rejected' | 'timeout' | 'rephrased';

export interface ConfirmationDecision {
  id: string;
  user_id: string;
  tool_id: string;
  session_id?: string | null;
  execution_log_id?: string | null;
  original_parameters: Record<string, any>;
  modified_parameters: Record<string, any>;
  parameters_changed: boolean;
  approval_status: ConfirmationStatus;
  modification_count: number;
  decision_time_ms?: number | null;
  created_at: string;
}

export interface PendingConfirmation {
  toolUseId: string;
  toolId: string;
  toolName: string;
  toolDescription: string;
  parameters: Record<string, any>;
  reasoning?: string;
  confidence?: number;
}

export interface ParameterEdit {
  field: string;
  original: any;
  modified: any;
  timestamp: string;
}
