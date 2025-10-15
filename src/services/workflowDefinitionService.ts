import { supabase } from '../lib/supabase';
import type {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowDefinitionWithSteps,
  WorkflowCategory
} from '../types/workflow';

export class WorkflowDefinitionService {
  static async fetchAllWorkflows(filters?: {
    category?: WorkflowCategory;
    isActive?: boolean;
    organizationId?: string;
  }): Promise<WorkflowDefinition[]> {
    let query = supabase
      .from('workflow_definitions')
      .select('*')
      .order('name');

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters?.organizationId) {
      query = query.eq('organization_id', filters.organizationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching workflows:', error);
      throw new Error(`Failed to fetch workflows: ${error.message}`);
    }

    return data || [];
  }

  static async fetchWorkflowBySlug(slug: string): Promise<WorkflowDefinition | null> {
    const { data, error } = await supabase
      .from('workflow_definitions')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('Error fetching workflow by slug:', error);
      throw new Error(`Failed to fetch workflow: ${error.message}`);
    }

    return data;
  }

  static async fetchWorkflowById(id: string): Promise<WorkflowDefinition | null> {
    const { data, error } = await supabase
      .from('workflow_definitions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching workflow by id:', error);
      throw new Error(`Failed to fetch workflow: ${error.message}`);
    }

    return data;
  }

  static async fetchWorkflowWithSteps(id: string): Promise<WorkflowDefinitionWithSteps | null> {
    const workflow = await this.fetchWorkflowById(id);
    if (!workflow) return null;

    const steps = await this.fetchWorkflowSteps(id);

    return {
      ...workflow,
      steps
    };
  }

  static async fetchWorkflowSteps(workflowId: string): Promise<WorkflowStep[]> {
    const { data, error } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('step_order');

    if (error) {
      console.error('Error fetching workflow steps:', error);
      throw new Error(`Failed to fetch workflow steps: ${error.message}`);
    }

    return data || [];
  }

  static async createWorkflow(
    workflow: Omit<WorkflowDefinition, 'id' | 'created_at' | 'updated_at' | 'version'>
  ): Promise<WorkflowDefinition> {
    const { data, error } = await supabase
      .from('workflow_definitions')
      .insert({
        ...workflow,
        version: 1
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating workflow:', error);
      throw new Error(`Failed to create workflow: ${error.message}`);
    }

    return data;
  }

  static async createWorkflowStep(
    step: Omit<WorkflowStep, 'id' | 'created_at' | 'updated_at'>
  ): Promise<WorkflowStep> {
    const { data, error } = await supabase
      .from('workflow_steps')
      .insert(step)
      .select()
      .single();

    if (error) {
      console.error('Error creating workflow step:', error);
      throw new Error(`Failed to create workflow step: ${error.message}`);
    }

    return data;
  }

  static async updateWorkflow(
    id: string,
    updates: Partial<Omit<WorkflowDefinition, 'id' | 'created_at' | 'created_by'>>
  ): Promise<void> {
    const { error } = await supabase
      .from('workflow_definitions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating workflow:', error);
      throw new Error(`Failed to update workflow: ${error.message}`);
    }
  }

  static async updateWorkflowStep(
    id: string,
    updates: Partial<Omit<WorkflowStep, 'id' | 'workflow_id' | 'created_at'>>
  ): Promise<void> {
    const { error } = await supabase
      .from('workflow_steps')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating workflow step:', error);
      throw new Error(`Failed to update workflow step: ${error.message}`);
    }
  }

  static async deleteWorkflow(id: string): Promise<void> {
    const { error } = await supabase
      .from('workflow_definitions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting workflow:', error);
      throw new Error(`Failed to delete workflow: ${error.message}`);
    }
  }

  static async deleteWorkflowStep(id: string): Promise<void> {
    const { error } = await supabase
      .from('workflow_steps')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting workflow step:', error);
      throw new Error(`Failed to delete workflow step: ${error.message}`);
    }
  }

  static async validateWorkflowSteps(steps: WorkflowStep[]): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (steps.length === 0) {
      errors.push('Workflow must have at least one step');
      return { isValid: false, errors };
    }

    const stepOrders = steps.map(s => s.step_order);
    const uniqueOrders = new Set(stepOrders);
    if (stepOrders.length !== uniqueOrders.size) {
      errors.push('Step orders must be unique');
    }

    const sortedOrders = [...stepOrders].sort((a, b) => a - b);
    for (let i = 0; i < sortedOrders.length; i++) {
      if (sortedOrders[i] !== i + 1) {
        errors.push('Step orders must be sequential starting from 1');
        break;
      }
    }

    for (const step of steps) {
      if (!step.name || step.name.trim() === '') {
        errors.push(`Step ${step.step_order} must have a name`);
      }

      if (!step.step_type) {
        errors.push(`Step ${step.step_order} must have a type`);
      }

      if (step.depends_on_steps && step.depends_on_steps.length > 0) {
        const stepIds = new Set(steps.map(s => s.id));
        for (const depId of step.depends_on_steps) {
          if (!stepIds.has(depId)) {
            errors.push(`Step ${step.step_order} depends on non-existent step ${depId}`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static async incrementWorkflowVersion(id: string): Promise<number> {
    const workflow = await this.fetchWorkflowById(id);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const newVersion = workflow.version + 1;

    await this.updateWorkflow(id, { version: newVersion });

    return newVersion;
  }
}
