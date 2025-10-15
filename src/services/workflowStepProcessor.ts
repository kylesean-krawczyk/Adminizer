import { ClaudeService } from './claudeService';
import { ToolExecutionEngine } from './toolExecutionEngine';
import type {
  WorkflowStep,
  FormStepConfig,
  ToolExecutionStepConfig,
  AIProcessingStepConfig,
  DataTransformStepConfig
} from '../types/workflow';

export interface StepProcessingResult {
  output: Record<string, any>;
  contextUpdates: Record<string, any>;
  requiresUserInput?: boolean;
  nextAction?: string;
}

export class WorkflowStepProcessor {
  static async processStep(
    step: WorkflowStep,
    inputData: Record<string, any>,
    contextData: Record<string, any>,
    userId: string
  ): Promise<StepProcessingResult> {
    switch (step.step_type) {
      case 'form_input':
        return this.processFormInput(step, inputData);

      case 'ai_processing':
        return this.processAIStep(step, contextData);

      case 'tool_execution':
        return this.processToolExecution(step, contextData, userId);

      case 'approval_gate':
        return this.processApprovalGate(step, inputData);

      case 'data_transform':
        return this.processDataTransform(step, contextData);

      case 'conditional':
        return this.processConditional(step, contextData);

      default:
        throw new Error(`Unsupported step type: ${step.step_type}`);
    }
  }

  private static processFormInput(
    step: WorkflowStep,
    inputData: Record<string, any>
  ): StepProcessingResult {
    const config = step.configuration as FormStepConfig;

    const validatedData: Record<string, any> = {};
    const errors: Record<string, string> = {};

    for (const field of config.fields) {
      const value = inputData[field.name];

      if (field.required && (value === undefined || value === null || value === '')) {
        errors[field.name] = `${field.label} is required`;
        continue;
      }

      if (value !== undefined && value !== null) {
        if (field.type === 'number' && typeof value !== 'number') {
          errors[field.name] = `${field.label} must be a number`;
          continue;
        }

        if (field.validation) {
          if (field.validation.minLength && typeof value === 'string' && value.length < field.validation.minLength) {
            errors[field.name] = `${field.label} must be at least ${field.validation.minLength} characters`;
            continue;
          }

          if (field.validation.maxLength && typeof value === 'string' && value.length > field.validation.maxLength) {
            errors[field.name] = `${field.label} must be at most ${field.validation.maxLength} characters`;
            continue;
          }

          if (field.validation.min !== undefined && typeof value === 'number' && value < field.validation.min) {
            errors[field.name] = `${field.label} must be at least ${field.validation.min}`;
            continue;
          }

          if (field.validation.max !== undefined && typeof value === 'number' && value > field.validation.max) {
            errors[field.name] = `${field.label} must be at most ${field.validation.max}`;
            continue;
          }
        }

        validatedData[field.name] = value;
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
    }

    return {
      output: validatedData,
      contextUpdates: validatedData
    };
  }

  private static async processAIStep(
    step: WorkflowStep,
    contextData: Record<string, any>
  ): Promise<StepProcessingResult> {
    const config = step.configuration as AIProcessingStepConfig;

    let prompt = config.prompt;

    for (const [key, value] of Object.entries(contextData)) {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    const response = await ClaudeService.generateResponse(prompt, []);

    return {
      output: {
        [config.outputKey]: response
      },
      contextUpdates: {
        [config.outputKey]: response
      }
    };
  }

  private static async processToolExecution(
    step: WorkflowStep,
    contextData: Record<string, any>,
    userId: string
  ): Promise<StepProcessingResult> {
    const config = step.configuration as ToolExecutionStepConfig;

    const parameters: Record<string, any> = {};

    for (const [paramName, mappingExpression] of Object.entries(config.parameterMapping)) {
      let value = mappingExpression;

      const matches = mappingExpression.match(/{{([^}]+)}}/g);
      if (matches) {
        for (const match of matches) {
          const key = match.replace(/{{|}}/g, '').trim();
          if (contextData[key] !== undefined) {
            value = value.replace(match, String(contextData[key]));
          }
        }
      }

      parameters[paramName] = value;
    }

    const result = await ToolExecutionEngine.executeToolBySlug(
      config.toolSlug,
      parameters,
      userId
    );

    if (!result.success) {
      throw new Error(result.error || 'Tool execution failed');
    }

    const outputMapping = config.outputMapping || {};
    const mappedOutput: Record<string, any> = {};

    for (const [outputKey, resultPath] of Object.entries(outputMapping)) {
      mappedOutput[outputKey] = this.getNestedValue(result.data, resultPath);
    }

    return {
      output: result.data || {},
      contextUpdates: {
        [`${config.toolSlug}_result`]: result.data,
        ...mappedOutput
      }
    };
  }

  private static processApprovalGate(
    _step: WorkflowStep,
    inputData: Record<string, any>
  ): StepProcessingResult {
    if (!inputData.approved) {
      throw new Error('Approval was not granted');
    }

    return {
      output: {
        approved: true,
        approvalComment: inputData.comment || '',
        approvedAt: new Date().toISOString()
      },
      contextUpdates: {
        lastApproval: {
          approved: true,
          comment: inputData.comment || '',
          timestamp: new Date().toISOString()
        }
      }
    };
  }

  private static processDataTransform(
    step: WorkflowStep,
    contextData: Record<string, any>
  ): StepProcessingResult {
    const config = step.configuration as DataTransformStepConfig;

    const output: Record<string, any> = {};
    const contextUpdates: Record<string, any> = {};

    for (const action of config.actions) {
      switch (action.type) {
        case 'set':
          if (action.target && action.value !== undefined) {
            const value = this.interpolateValue(action.value, contextData);
            contextUpdates[action.target] = value;
            output[action.target] = value;
          }
          break;

        case 'append':
          if (action.target && action.value !== undefined) {
            const currentValue = contextData[action.target] || [];
            const newValue = this.interpolateValue(action.value, contextData);
            contextUpdates[action.target] = [...currentValue, newValue];
          }
          break;

        case 'transform':
          break;

        case 'notification':
          output.notification = {
            recipient: this.interpolateValue(action.recipient || '', contextData),
            subject: this.interpolateValue(action.subject || '', contextData),
            body: this.interpolateValue(action.body || '', contextData)
          };
          break;

        case 'log':
          console.log('Workflow Log:', this.interpolateValue(action.message || '', contextData));
          output.logMessage = this.interpolateValue(action.message || '', contextData);
          break;
      }
    }

    return {
      output,
      contextUpdates
    };
  }

  private static processConditional(
    _step: WorkflowStep,
    _contextData: Record<string, any>
  ): StepProcessingResult {
    return {
      output: {},
      contextUpdates: {},
      nextAction: 'conditional_evaluation_required'
    };
  }

  private static interpolateValue(value: any, contextData: Record<string, any>): any {
    if (typeof value !== 'string') {
      return value;
    }

    let result = value;
    const matches = value.match(/{{([^}]+)}}/g);

    if (matches) {
      for (const match of matches) {
        const key = match.replace(/{{|}}/g, '').trim();
        if (contextData[key] !== undefined) {
          result = result.replace(match, String(contextData[key]));
        }
      }
    }

    return result;
  }

  private static getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return current;
  }

  static validateStepInput(
    step: WorkflowStep,
    inputData: Record<string, any>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (step.step_type === 'form_input') {
      const config = step.configuration as FormStepConfig;

      for (const field of config.fields) {
        const value = inputData[field.name];

        if (field.required && (value === undefined || value === null || value === '')) {
          errors.push(`${field.label} is required`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
