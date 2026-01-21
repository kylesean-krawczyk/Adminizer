export type WorkflowCategory = 'onboarding' | 'approval' | 'operations' | 'compliance' | 'analytics' | 'custom';

export type TriggerType = 'manual' | 'scheduled' | 'event_based' | 'api';

export type WorkflowStatus = 'pending' | 'in_progress' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled';

export type StepType = 'form_input' | 'ai_processing' | 'tool_execution' | 'approval_gate' | 'data_transform' | 'conditional';

export type StepExecutionStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'skipped' | 'waiting_input';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'timeout';

export interface WorkflowDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: WorkflowCategory;
  is_active: boolean;
  trigger_type: TriggerType;
  trigger_config: Record<string, any>;
  metadata: Record<string, any>;
  version: number;
  organization_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  name: string;
  step_order: number;
  step_type: StepType;
  configuration: Record<string, any>;
  is_required: boolean;
  timeout_minutes: number;
  retry_config: {
    maxRetries: number;
    retryDelaySeconds: number;
  };
  depends_on_steps: string[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowInstance {
  id: string;
  workflow_id: string;
  workflow_version: number;
  current_step_id: string | null;
  status: WorkflowStatus;
  initiator_id: string;
  context_data: Record<string, any>;
  started_at: string | null;
  completed_at: string | null;
  organization_id: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStepExecution {
  id: string;
  workflow_instance_id: string;
  workflow_step_id: string;
  execution_order: number;
  status: StepExecutionStatus;
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  error_message: string | null;
  execution_time_ms: number | null;
  retry_count: number;
  executed_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface WorkflowApproval {
  id: string;
  workflow_instance_id: string;
  step_execution_id: string;
  approver_id: string | null;
  approver_role: string | null;
  status: ApprovalStatus;
  decision_comment: string | null;
  requested_at: string;
  responded_at: string | null;
  timeout_at: string | null;
  created_at: string;
}

export interface WorkflowDefinitionWithSteps extends WorkflowDefinition {
  steps: WorkflowStep[];
}

export interface WorkflowInstanceWithDetails extends WorkflowInstance {
  definition: WorkflowDefinition;
  steps: WorkflowStep[];
  executions: WorkflowStepExecution[];
  approvals: WorkflowApproval[];
}

export interface FormFieldConfig {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'array';
  required: boolean;
  label: string;
  placeholder?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface FormStepConfig {
  fields: FormFieldConfig[];
  submitLabel?: string;
  description?: string;
}

export interface ToolExecutionStepConfig {
  toolSlug: string;
  parameterMapping: Record<string, string>;
  outputMapping?: Record<string, string>;
}

export interface AIProcessingStepConfig {
  prompt: string;
  outputKey: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ApprovalGateStepConfig {
  approverRole?: string;
  approverUserId?: string;
  approvalMessage: string;
  allowComments: boolean;
  timeoutHours?: number;
}

export interface DataTransformStepConfig {
  actions: Array<{
    type: 'set' | 'append' | 'transform' | 'notification' | 'log';
    target?: string;
    value?: any;
    transform?: string;
    recipient?: string;
    subject?: string;
    body?: string;
    message?: string;
  }>;
}

export interface ConditionalStepConfig {
  condition: string;
  trueBranch: string[];
  falseBranch?: string[];
}

export interface WorkflowExecutionRequest {
  workflowId: string;
  initialData?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface WorkflowExecutionResult {
  instanceId: string;
  status: WorkflowStatus;
  currentStep?: WorkflowStep;
  message: string;
}

export interface StepExecutionRequest {
  instanceId: string;
  stepId: string;
  inputData: Record<string, any>;
  userId: string;
}

export interface StepExecutionResult {
  success: boolean;
  executionId: string;
  outputData: Record<string, any>;
  nextStep?: WorkflowStep;
  error?: string;
}

export interface ApprovalDecisionRequest {
  approvalId: string;
  decision: 'approved' | 'rejected';
  comment?: string;
}

export interface WorkflowProgress {
  totalSteps: number;
  completedSteps: number;
  currentStep: number;
  percentComplete: number;
  estimatedTimeRemaining?: string;
}

export interface WorkflowStatistics {
  totalInstances: number;
  completedInstances: number;
  failedInstances: number;
  averageCompletionTime: number;
  successRate: number;
}
