import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Edit2, RotateCcw, MessageSquare } from 'lucide-react';
import type { PendingConfirmation, ToolParameter, ParameterEdit } from '../../types/toolRegistry';

interface ParameterReviewModalProps {
  confirmation: PendingConfirmation;
  toolParameters: ToolParameter[];
  onApprove: (modifiedParameters: Record<string, any>, edits: ParameterEdit[]) => void;
  onReject: () => void;
  onRephrase: () => void;
}

export default function ParameterReviewModal({
  confirmation,
  toolParameters,
  onApprove,
  onReject,
  onRephrase
}: ParameterReviewModalProps) {
  const [parameters, setParameters] = useState<Record<string, any>>(confirmation.parameters);
  const [edits, setEdits] = useState<ParameterEdit[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    validateParameters();
  }, [parameters]);

  const validateParameters = () => {
    const errors: Record<string, string> = {};

    for (const param of toolParameters) {
      const value = parameters[param.name];

      if (param.is_required && (value === undefined || value === null || value === '')) {
        errors[param.name] = `${param.name} is required`;
        continue;
      }

      if (value === undefined || value === null) continue;

      if (param.type === 'string' && typeof value !== 'string') {
        errors[param.name] = `${param.name} must be a string`;
      }

      if (param.type === 'number' && typeof value !== 'number') {
        errors[param.name] = `${param.name} must be a number`;
      }

      if (param.type === 'boolean' && typeof value !== 'boolean') {
        errors[param.name] = `${param.name} must be a boolean`;
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

      if (param.enum_values && !param.enum_values.includes(value)) {
        errors[param.name] = `${param.name} must be one of: ${param.enum_values.join(', ')}`;
      }
    }

    setValidationErrors(errors);
  };

  const handleParameterChange = (paramName: string, newValue: any, param: ToolParameter) => {
    const originalValue = confirmation.parameters[paramName];

    let parsedValue = newValue;
    if (param.type === 'number') {
      parsedValue = newValue === '' ? null : Number(newValue);
    } else if (param.type === 'boolean') {
      parsedValue = newValue === 'true' || newValue === true;
    }

    setParameters(prev => ({
      ...prev,
      [paramName]: parsedValue
    }));

    if (JSON.stringify(originalValue) !== JSON.stringify(parsedValue)) {
      setEdits(prev => {
        const existing = prev.findIndex(e => e.field === paramName);
        const newEdit: ParameterEdit = {
          field: paramName,
          original: originalValue,
          modified: parsedValue,
          timestamp: new Date().toISOString()
        };

        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newEdit;
          return updated;
        }

        return [...prev, newEdit];
      });
    } else {
      setEdits(prev => prev.filter(e => e.field !== paramName));
    }
  };

  const handleReset = () => {
    setParameters(confirmation.parameters);
    setEdits([]);
  };

  const handleApprove = () => {
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    onApprove(parameters, edits);
  };

  const hasChanges = edits.length > 0;
  const isValid = Object.keys(validationErrors).length === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Confirm Tool Execution</h3>
            <p className="text-sm text-gray-600 mt-1">{confirmation.toolName}</p>
          </div>
          <button
            onClick={onReject}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">{confirmation.toolDescription}</p>
            {confirmation.reasoning && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Claude's Reasoning:</p>
                <p className="text-sm text-gray-700 italic">{confirmation.reasoning}</p>
              </div>
            )}
            {confirmation.confidence !== undefined && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-600">Confidence:</span>
                <div className="flex-1 bg-white rounded-full h-2 max-w-xs">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${confirmation.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700">
                  {Math.round(confirmation.confidence * 100)}%
                </span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Parameters</h4>
              {hasChanges && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Changes
                </button>
              )}
            </div>

            <div className="space-y-4">
              {toolParameters.map(param => {
                const value = parameters[param.name];
                const error = validationErrors[param.name];
                const isModified = edits.some(e => e.field === param.name);

                return (
                  <div
                    key={param.name}
                    className={`border rounded-lg p-4 transition-colors ${
                      isModified ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">
                          {param.name}
                          {param.is_required && <span className="text-red-500 ml-1">*</span>}
                          {isModified && (
                            <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                              Modified
                            </span>
                          )}
                        </label>
                        <p className="text-xs text-gray-500 mt-0.5">{param.description}</p>
                      </div>
                      <Edit2 className="w-4 h-4 text-gray-400 mt-0.5" />
                    </div>

                    {param.type === 'enum' && param.enum_values ? (
                      <select
                        value={value || ''}
                        onChange={(e) => handleParameterChange(param.name, e.target.value, param)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select {param.name}</option>
                        {param.enum_values.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : param.type === 'boolean' ? (
                      <select
                        value={value?.toString() || 'false'}
                        onChange={(e) => handleParameterChange(param.name, e.target.value === 'true', param)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    ) : param.type === 'number' ? (
                      <input
                        type="number"
                        value={value ?? ''}
                        onChange={(e) => handleParameterChange(param.name, e.target.value, param)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder={`Enter ${param.name}`}
                      />
                    ) : param.type === 'object' ? (
                      <textarea
                        value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || ''}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            handleParameterChange(param.name, parsed, param);
                          } catch {
                            handleParameterChange(param.name, e.target.value, param);
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                          error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        rows={4}
                        placeholder={`Enter ${param.name} as JSON`}
                      />
                    ) : (
                      <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => handleParameterChange(param.name, e.target.value, param)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder={`Enter ${param.name}`}
                      />
                    )}

                    {error && (
                      <div className="mt-2 flex items-center gap-1 text-red-600 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {hasChanges && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm font-medium text-orange-800 mb-2">
                You've modified {edits.length} parameter{edits.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-1">
                {edits.map(edit => (
                  <div key={edit.field} className="text-xs text-gray-700">
                    <span className="font-medium">{edit.field}:</span>{' '}
                    <span className="line-through text-gray-500">
                      {JSON.stringify(edit.original)}
                    </span>{' '}
                    → <span className="text-orange-700 font-medium">{JSON.stringify(edit.modified)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-wrap gap-3">
          <button
            onClick={onRephrase}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Rephrase Request
          </button>
          <div className="flex-1" />
          <button
            onClick={onReject}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={!isValid}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
              isValid
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            {hasChanges ? 'Approve Changes' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}
