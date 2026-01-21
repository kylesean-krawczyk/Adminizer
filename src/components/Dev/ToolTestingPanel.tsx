import { useState, useEffect } from 'react';
import { X, Play, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ToolRegistryService } from '../../services/toolRegistryService';
import { ToolExecutionEngine } from '../../services/toolExecutionEngine';
import type { ToolDefinition, ToolParameter } from '../../types/toolRegistry';

interface ToolTestingPanelProps {
  tool: ToolDefinition;
  onClose: () => void;
}

export default function ToolTestingPanel({ tool, onClose }: ToolTestingPanelProps) {
  const { user } = useAuth();
  const [parameters, setParameters] = useState<ToolParameter[]>([]);
  const [parameterValues, setParameterValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  useEffect(() => {
    loadParameters();
  }, [tool.id]);

  const loadParameters = async () => {
    try {
      setLoading(true);
      const params = await ToolRegistryService.fetchToolParameters(tool.id);
      setParameters(params);

      const defaultValues: Record<string, any> = {};
      params.forEach((param: ToolParameter) => {
        if (param.default_value) {
          defaultValues[param.name] = param.default_value;
        } else if (param.type === 'boolean') {
          defaultValues[param.name] = false;
        } else if (param.type === 'array') {
          defaultValues[param.name] = [];
        } else if (param.type === 'object') {
          defaultValues[param.name] = {};
        }
      });
      setParameterValues(defaultValues);
    } catch (err) {
      console.error('Failed to load parameters:', err);
      setError('Failed to load tool parameters');
    } finally {
      setLoading(false);
    }
  };

  const handleParameterChange = (paramName: string, value: any) => {
    setParameterValues(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const handleExecute = async () => {
    if (!user) return;

    setExecuting(true);
    setError(null);
    setResult(null);
    setExecutionTime(null);

    try {
      const response = await ToolExecutionEngine.executeToolWithConfirmation(
        {
          toolSlug: tool.slug,
          parameters: parameterValues,
          skipConfirmation: true
        },
        user.id
      );

      if (response.success) {
        setResult(response.data);
        setExecutionTime(response.executionTimeMs || null);
      } else {
        setError(response.error || 'Execution failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setExecuting(false);
    }
  };

  const renderParameterInput = (param: ToolParameter) => {
    const value = parameterValues[param.name];

    if (param.type === 'boolean') {
      return (
        <select
          value={value ? 'true' : 'false'}
          onChange={(e) => handleParameterChange(param.name, e.target.value === 'true')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    }

    if (param.type === 'enum' && param.enum_values) {
      return (
        <select
          value={value || ''}
          onChange={(e) => handleParameterChange(param.name, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- Select --</option>
          {param.enum_values.map(enumValue => (
            <option key={enumValue} value={enumValue}>{enumValue}</option>
          ))}
        </select>
      );
    }

    if (param.type === 'number') {
      return (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => handleParameterChange(param.name, parseFloat(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      );
    }

    if (param.type === 'date') {
      return (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => handleParameterChange(param.name, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      );
    }

    if (param.type === 'array') {
      return (
        <textarea
          value={Array.isArray(value) ? value.join(', ') : ''}
          onChange={(e) => handleParameterChange(param.name, e.target.value.split(',').map(v => v.trim()).filter(v => v))}
          placeholder="Enter values separated by commas"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      );
    }

    if (param.type === 'object') {
      return (
        <textarea
          value={typeof value === 'object' ? JSON.stringify(value, null, 2) : '{}'}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              handleParameterChange(param.name, parsed);
            } catch {
            }
          }}
          placeholder='{"key": "value"}'
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
        />
      );
    }

    return (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => handleParameterChange(param.name, e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Test Tool: {tool.name}</h2>
            <p className="text-sm text-gray-600 mt-1">Execute the tool with custom parameters</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading parameters...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Parameters</h3>
                {parameters.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">This tool has no parameters.</p>
                ) : (
                  <div className="space-y-4">
                    {parameters.map(param => (
                      <div key={param.id} className="border border-gray-200 rounded-lg p-4">
                        <label className="block mb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{param.name}</span>
                            <span className="text-xs text-gray-500">({param.type})</span>
                            {param.is_required && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{param.description}</p>
                        </label>
                        {renderParameterInput(param)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleExecute}
                  disabled={executing}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {executing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Execute Tool
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-900 mb-1">Execution Failed</h4>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {result && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Execution Successful</h4>
                      {executionTime && (
                        <p className="text-sm text-green-700">Completed in {executionTime}ms</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Response:</h5>
                    <pre className="bg-white p-3 rounded border border-green-200 overflow-x-auto text-xs">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
