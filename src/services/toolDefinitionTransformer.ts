import type { ToolDefinition, ToolParameter } from '../types/toolRegistry';

export interface ClaudeToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export class ToolDefinitionTransformer {
  static transformToolForClaude(
    tool: ToolDefinition,
    parameters: ToolParameter[]
  ): ClaudeToolDefinition {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const param of parameters) {
      properties[param.name] = this.transformParameter(param);

      if (param.is_required) {
        required.push(param.name);
      }
    }

    return {
      name: tool.slug,
      description: tool.description,
      input_schema: {
        type: 'object',
        properties,
        required
      }
    };
  }

  static transformAllToolsForClaude(
    toolsWithParams: Array<{ tool: ToolDefinition; parameters: ToolParameter[] }>
  ): ClaudeToolDefinition[] {
    return toolsWithParams.map(({ tool, parameters }) =>
      this.transformToolForClaude(tool, parameters)
    );
  }

  private static transformParameter(param: ToolParameter): any {
    const schema: any = {
      description: param.description
    };

    switch (param.type) {
      case 'string':
        schema.type = 'string';
        if (param.enum_values && param.enum_values.length > 0) {
          schema.enum = param.enum_values;
        }
        if (param.validation_rules?.minLength) {
          schema.minLength = param.validation_rules.minLength;
        }
        if (param.validation_rules?.maxLength) {
          schema.maxLength = param.validation_rules.maxLength;
        }
        if (param.validation_rules?.format) {
          schema.format = param.validation_rules.format;
        }
        if (param.validation_rules?.pattern) {
          schema.pattern = param.validation_rules.pattern;
        }
        break;

      case 'number':
        schema.type = 'number';
        if (param.validation_rules?.min !== undefined) {
          schema.minimum = param.validation_rules.min;
        }
        if (param.validation_rules?.max !== undefined) {
          schema.maximum = param.validation_rules.max;
        }
        break;

      case 'boolean':
        schema.type = 'boolean';
        break;

      case 'date':
        schema.type = 'string';
        schema.format = 'date';
        break;

      case 'array':
        schema.type = 'array';
        if (param.validation_rules?.itemType) {
          schema.items = {
            type: param.validation_rules.itemType
          };
        }
        break;

      case 'object':
        schema.type = 'object';
        if (param.validation_rules?.properties) {
          schema.properties = param.validation_rules.properties;
        }
        break;

      case 'enum':
        schema.type = 'string';
        if (param.enum_values && param.enum_values.length > 0) {
          schema.enum = param.enum_values;
        }
        break;

      default:
        schema.type = 'string';
    }

    if (param.default_value !== null && param.default_value !== undefined) {
      try {
        schema.default = JSON.parse(param.default_value);
      } catch {
        schema.default = param.default_value;
      }
    }

    return schema;
  }

  static validateClaudeToolUseInput(
    _toolName: string,
    input: Record<string, any>,
    toolDefinition: ClaudeToolDefinition
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const { properties, required } = toolDefinition.input_schema;

    for (const requiredField of required) {
      if (!(requiredField in input)) {
        errors.push(`Missing required field: ${requiredField}`);
      }
    }

    for (const [key, value] of Object.entries(input)) {
      if (!(key in properties)) {
        errors.push(`Unknown field: ${key}`);
        continue;
      }

      const schema = properties[key];
      const valueType = Array.isArray(value) ? 'array' : typeof value;

      if (schema.type && schema.type !== valueType) {
        errors.push(`Field ${key} should be ${schema.type} but got ${valueType}`);
      }

      if (schema.enum && !schema.enum.includes(value)) {
        errors.push(`Field ${key} must be one of: ${schema.enum.join(', ')}`);
      }

      if (schema.type === 'string') {
        if (schema.minLength && value.length < schema.minLength) {
          errors.push(`Field ${key} must be at least ${schema.minLength} characters`);
        }
        if (schema.maxLength && value.length > schema.maxLength) {
          errors.push(`Field ${key} must be at most ${schema.maxLength} characters`);
        }
      }

      if (schema.type === 'number') {
        if (schema.minimum !== undefined && value < schema.minimum) {
          errors.push(`Field ${key} must be at least ${schema.minimum}`);
        }
        if (schema.maximum !== undefined && value > schema.maximum) {
          errors.push(`Field ${key} must be at most ${schema.maximum}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static formatToolResultForClaude(
    toolUseId: string,
    result: any,
    isError: boolean = false
  ): any {
    if (isError) {
      return {
        type: 'tool_result',
        tool_use_id: toolUseId,
        is_error: true,
        content: typeof result === 'string' ? result : JSON.stringify(result)
      };
    }

    return {
      type: 'tool_result',
      tool_use_id: toolUseId,
      content: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
    };
  }
}
