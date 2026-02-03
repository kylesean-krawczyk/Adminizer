import { supabase } from '../lib/supabase';
import { WorkflowDefinitionService } from './workflowDefinitionService';
import { WorkflowStepProcessor } from './workflowStepProcessor';
import type {
  WorkflowInstance,
  WorkflowStepExecution,
  WorkflowExecutionRequest,
  WorkflowExecutionResult,
  StepExecutionRequest,
  StepExecutionResult,
  WorkflowStatus,
  StepExecutionStatus
} from '../types/workflow';

export class WorkflowExecutionEngine {
  static async createInstance(request: WorkflowExecutionRequest, userId: string, organizationId: string): Promise<WorkflowExecutionResult> {
    try {
      const workflow = await WorkflowDefinitionService.fetchWorkflowWithSteps(request.workflowId);

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      if (!workflow.is_active) {
        throw new Error('Workflow is not active');
      }

      if (workflow.steps.length === 0) {
        throw new Error('Workflow has no steps');
      }

      const firstStep = workflow.steps[0];

      const { data: instance, error } = await supabase
        .from('workflow_instances')
        .insert({
          workflow_id: workflow.id,
          workflow_version: workflow.version,
          current_step_id: firstStep.id,
          status: 'in_progress',
          initiator_id: userId,
          context_data: request.initialData || {},
          started_at: new Date().toISOString(),
          organization_id: organizationId,
          metadata: request.metadata || {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating workflow instance:', error);
        throw new Error(`Failed to create workflow instance: ${error.message}`);
      }

      await this.createStepExecution(instance.id, firstStep.id, 1, request.initialData || {});

      return {
        instanceId: instance.id,
        status: 'in_progress',
        currentStep: firstStep,
        message: `Workflow "${workflow.name}" started successfully`
      };
    } catch (error) {
      console.error('Error in createInstance:', error);
      throw error;
    }
  }

  static async executeStep(request: StepExecutionRequest): Promise<StepExecutionResult> {
    try {
      const instance = await this.fetchInstance(request.instanceId);
      if (!instance) {
        throw new Error('Workflow instance not found');
      }

      const workflow = await WorkflowDefinitionService.fetchWorkflowWithSteps(instance.workflow_id);
      if (!workflow) {
        throw new Error('Workflow definition not found');
      }

      const step = workflow.steps.find(s => s.id === request.stepId);
      if (!step) {
        throw new Error('Step not found');
      }

      const execution = await this.getStepExecution(request.instanceId, request.stepId);
      if (!execution) {
        throw new Error('Step execution not found');
      }

      await this.updateStepExecutionStatus(execution.id, 'executing', request.userId);

      const startTime = Date.now();

      try {
        const result = await WorkflowStepProcessor.processStep(
          step,
          request.inputData,
          instance.context_data,
          request.userId
        );

        const executionTime = Date.now() - startTime;

        const updatedContext = {
          ...instance.context_data,
          ...result.contextUpdates
        };

        await this.updateStepExecutionResult(
          execution.id,
          'completed',
          result.output,
          executionTime
        );

        await this.updateInstanceContext(request.instanceId, updatedContext);

        const nextStep = this.determineNextStep(workflow.steps, step.step_order);

        if (nextStep) {
          await this.updateInstanceCurrentStep(request.instanceId, nextStep.id, 'in_progress');
          await this.createStepExecution(
            request.instanceId,
            nextStep.id,
            execution.execution_order + 1,
            updatedContext
          );
        } else {
          await this.completeWorkflow(request.instanceId);
        }

        return {
          success: true,
          executionId: execution.id,
          outputData: result.output,
          nextStep: nextStep || undefined
        };
      } catch (stepError) {
        const executionTime = Date.now() - startTime;
        const errorMessage = stepError instanceof Error ? stepError.message : 'Unknown error';

        await this.updateStepExecutionError(
          execution.id,
          'failed',
          errorMessage,
          executionTime
        );

        if (execution.retry_count < step.retry_config.maxRetries) {
          await this.retryStepExecution(execution.id, step.retry_config.retryDelaySeconds);
          throw new Error(`Step execution failed, retry ${execution.retry_count + 1}/${step.retry_config.maxRetries}`);
        } else {
          await this.failWorkflow(request.instanceId, errorMessage);
          throw new Error(`Step execution failed after ${step.retry_config.maxRetries} retries: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Error in executeStep:', error);
      return {
        success: false,
        executionId: '',
        outputData: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async fetchInstance(instanceId: string): Promise<WorkflowInstance | null> {
    const { data, error } = await supabase
      .from('workflow_instances')
      .select('*')
      .eq('id', instanceId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching workflow instance:', error);
      throw new Error(`Failed to fetch workflow instance: ${error.message}`);
    }

    return data;
  }

  static async fetchUserInstances(userId: string, filters?: {
    status?: WorkflowStatus;
    workflowId?: string;
    limit?: number;
  }): Promise<WorkflowInstance[]> {
    let query = supabase
      .from('workflow_instances')
      .select('*')
      .eq('initiator_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.workflowId) {
      query = query.eq('workflow_id', filters.workflowId);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user instances:', error);
      throw new Error(`Failed to fetch instances: ${error.message}`);
    }

    return data || [];
  }

  private static async createStepExecution(
    instanceId: string,
    stepId: string,
    executionOrder: number,
    inputData: Record<string, any>
  ): Promise<WorkflowStepExecution> {
    const { data, error } = await supabase
      .from('workflow_step_executions')
      .insert({
        workflow_instance_id: instanceId,
        workflow_step_id: stepId,
        execution_order: executionOrder,
        status: 'pending',
        input_data: inputData,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating step execution:', error);
      throw new Error(`Failed to create step execution: ${error.message}`);
    }

    return data;
  }

  private static async getStepExecution(
    instanceId: string,
    stepId: string
  ): Promise<WorkflowStepExecution | null> {
    const { data, error } = await supabase
      .from('workflow_step_executions')
      .select('*')
      .eq('workflow_instance_id', instanceId)
      .eq('workflow_step_id', stepId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching step execution:', error);
      throw new Error(`Failed to fetch step execution: ${error.message}`);
    }

    return data;
  }

  private static async updateStepExecutionStatus(
    executionId: string,
    status: StepExecutionStatus,
    executedBy?: string
  ): Promise<void> {
    const updates: any = { status };
    if (executedBy) {
      updates.executed_by = executedBy;
    }

    const { error } = await supabase
      .from('workflow_step_executions')
      .update(updates)
      .eq('id', executionId);

    if (error) {
      console.error('Error updating step execution status:', error);
      throw new Error(`Failed to update step execution: ${error.message}`);
    }
  }

  private static async updateStepExecutionResult(
    executionId: string,
    status: StepExecutionStatus,
    outputData: Record<string, any>,
    executionTimeMs: number
  ): Promise<void> {
    const { error } = await supabase
      .from('workflow_step_executions')
      .update({
        status,
        output_data: outputData,
        execution_time_ms: executionTimeMs,
        completed_at: new Date().toISOString()
      })
      .eq('id', executionId);

    if (error) {
      console.error('Error updating step execution result:', error);
      throw new Error(`Failed to update step execution: ${error.message}`);
    }
  }

  private static async updateStepExecutionError(
    executionId: string,
    status: StepExecutionStatus,
    errorMessage: string,
    executionTimeMs: number
  ): Promise<void> {
    const { error } = await supabase
      .from('workflow_step_executions')
      .update({
        status,
        error_message: errorMessage,
        execution_time_ms: executionTimeMs,
        completed_at: new Date().toISOString()
      })
      .eq('id', executionId);

    if (error) {
      console.error('Error updating step execution error:', error);
      throw new Error(`Failed to update step execution: ${error.message}`);
    }
  }

  private static async retryStepExecution(
    executionId: string,
    _delaySeconds: number
  ): Promise<void> {
    const { data: execution } = await supabase
      .from('workflow_step_executions')
      .select('retry_count')
      .eq('id', executionId)
      .single();

    if (execution) {
      await supabase
        .from('workflow_step_executions')
        .update({
          retry_count: execution.retry_count + 1,
          status: 'pending'
        })
        .eq('id', executionId);
    }
  }

  private static async updateInstanceContext(
    instanceId: string,
    contextData: Record<string, any>
  ): Promise<void> {
    const { error } = await supabase
      .from('workflow_instances')
      .update({
        context_data: contextData,
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId);

    if (error) {
      console.error('Error updating instance context:', error);
      throw new Error(`Failed to update instance context: ${error.message}`);
    }
  }

  private static async updateInstanceCurrentStep(
    instanceId: string,
    stepId: string,
    status: WorkflowStatus
  ): Promise<void> {
    const { error } = await supabase
      .from('workflow_instances')
      .update({
        current_step_id: stepId,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId);

    if (error) {
      console.error('Error updating instance current step:', error);
      throw new Error(`Failed to update instance: ${error.message}`);
    }
  }

  private static async completeWorkflow(instanceId: string): Promise<void> {
    const { error } = await supabase
      .from('workflow_instances')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId);

    if (error) {
      console.error('Error completing workflow:', error);
      throw new Error(`Failed to complete workflow: ${error.message}`);
    }
  }

  private static async failWorkflow(instanceId: string, errorMessage: string): Promise<void> {
    const { error } = await supabase
      .from('workflow_instances')
      .update({
        status: 'failed',
        metadata: { errorMessage },
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId);

    if (error) {
      console.error('Error failing workflow:', error);
      throw new Error(`Failed to mark workflow as failed: ${error.message}`);
    }
  }

  private static determineNextStep(
    steps: any[],
    currentOrder: number
  ): any | null {
    const sortedSteps = [...steps].sort((a, b) => a.step_order - b.step_order);
    const nextStep = sortedSteps.find(s => s.step_order === currentOrder + 1);
    return nextStep || null;
  }

  static async cancelWorkflow(instanceId: string, userId: string): Promise<void> {
    const instance = await this.fetchInstance(instanceId);

    if (!instance) {
      throw new Error('Workflow instance not found');
    }

    if (instance.initiator_id !== userId) {
      throw new Error('Only the workflow initiator can cancel it');
    }

    if (instance.status === 'completed' || instance.status === 'cancelled') {
      throw new Error('Workflow is already completed or cancelled');
    }

    const { error } = await supabase
      .from('workflow_instances')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId);

    if (error) {
      console.error('Error cancelling workflow:', error);
      throw new Error(`Failed to cancel workflow: ${error.message}`);
    }
  }
}
