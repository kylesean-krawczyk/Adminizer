import { useState, FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import type { WorkflowStep, FormStepConfig, FormFieldConfig } from '../../types/workflow';

interface DynamicFormRendererProps {
  step: WorkflowStep;
  context: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  disabled?: boolean;
}

export default function DynamicFormRenderer({ step, context, onSubmit, disabled }: DynamicFormRendererProps) {
  const config = step.configuration as FormStepConfig;
  const [formData, setFormData] = useState<Record<string, any>>(
    config.fields.reduce((acc, field) => {
      acc[field.name] = context[field.name] || (field.type === 'boolean' ? false : '');
      return acc;
    }, {} as Record<string, any>)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (field: FormFieldConfig, value: any): string | null => {
    if (field.required && (value === undefined || value === null || value === '')) {
      return `${field.label} is required`;
    }

    if (value && field.validation) {
      if (field.type === 'string') {
        const strValue = String(value);
        if (field.validation.minLength && strValue.length < field.validation.minLength) {
          return `${field.label} must be at least ${field.validation.minLength} characters`;
        }
        if (field.validation.maxLength && strValue.length > field.validation.maxLength) {
          return `${field.label} must be at most ${field.validation.maxLength} characters`;
        }
        if (field.validation.pattern) {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(strValue)) {
            return `${field.label} format is invalid`;
          }
        }
      }

      if (field.type === 'number') {
        const numValue = Number(value);
        if (field.validation.min !== undefined && numValue < field.validation.min) {
          return `${field.label} must be at least ${field.validation.min}`;
        }
        if (field.validation.max !== undefined && numValue > field.validation.max) {
          return `${field.label} must be at most ${field.validation.max}`;
        }
      }
    }

    return null;
  };

  const handleFieldChange = (field: FormFieldConfig, value: any) => {
    setFormData(prev => ({ ...prev, [field.name]: value }));

    const error = validateField(field, value);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[field.name] = error;
      } else {
        delete newErrors[field.name];
      }
      return newErrors;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    for (const field of config.fields) {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    }
  };

  const renderField = (field: FormFieldConfig) => {
    const value = formData[field.name];
    const error = errors[field.name];

    switch (field.type) {
      case 'string':
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={value || ''}
              onChange={e => handleFieldChange(field, e.target.value)}
              placeholder={field.placeholder}
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-300'
              } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {error}
              </p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              value={value || ''}
              onChange={e => handleFieldChange(field, Number(e.target.value))}
              placeholder={field.placeholder}
              disabled={disabled}
              min={field.validation?.min}
              max={field.validation?.max}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-300'
              } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {error}
              </p>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div key={field.name} className="mb-4 flex items-center">
            <input
              type="checkbox"
              checked={value || false}
              onChange={e => handleFieldChange(field, e.target.checked)}
              disabled={disabled}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        );

      case 'date':
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="date"
              value={value || ''}
              onChange={e => handleFieldChange(field, e.target.value)}
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-300'
              } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {error}
              </p>
            )}
          </div>
        );

      case 'enum':
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={value || ''}
              onChange={e => handleFieldChange(field, e.target.value)}
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-300'
              } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {error && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {error}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {config.description && (
        <p className="text-gray-600 mb-4">{config.description}</p>
      )}

      {config.fields.map(field => renderField(field))}

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="submit"
          disabled={disabled || Object.keys(errors).length > 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {disabled ? 'Processing...' : config.submitLabel || 'Continue'}
        </button>
      </div>
    </form>
  );
}
