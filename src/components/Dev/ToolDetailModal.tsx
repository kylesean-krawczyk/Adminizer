import { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Clock, TrendingUp, Code } from 'lucide-react';
import { ToolRegistryService } from '../../services/toolRegistryService';
import type { ToolDefinition, ToolParameter, ToolReturnSchema, ToolExecutionStats } from '../../types/toolRegistry';

interface ToolDetailModalProps {
  tool: ToolDefinition;
  onClose: () => void;
}

export default function ToolDetailModal({ tool, onClose }: ToolDetailModalProps) {
  const [parameters, setParameters] = useState<ToolParameter[]>([]);
  const [returnSchema, setReturnSchema] = useState<ToolReturnSchema | null>(null);
  const [stats, setStats] = useState<ToolExecutionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'parameters' | 'response' | 'stats'>('overview');

  useEffect(() => {
    loadToolDetails();
  }, [tool.id]);

  const loadToolDetails = async () => {
    try {
      setLoading(true);
      const [params, schema, executionStats] = await Promise.all([
        ToolRegistryService.fetchToolParameters(tool.id),
        ToolRegistryService.fetchToolReturnSchema(tool.id),
        ToolRegistryService.fetchToolExecutionStats(tool.id)
      ]);
      setParameters(params);
      setReturnSchema(schema);
      setStats(executionStats);
    } catch (error) {
      console.error('Failed to load tool details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      string: 'text-green-600',
      number: 'text-blue-600',
      boolean: 'text-cyan-600',
      date: 'text-orange-600',
      array: 'text-red-600',
      object: 'text-gray-600',
      enum: 'text-yellow-600'
    };
    return colors[type] || 'text-gray-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{tool.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="border-b border-gray-200">
          <div className="flex">
            {(['overview', 'parameters', 'response', 'stats'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading tool details...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Tool Information</h3>
                    <dl className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-600">Slug</dt>
                        <dd className="mt-1">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">{tool.slug}</code>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-600">Category</dt>
                        <dd className="mt-1 text-sm text-gray-900 capitalize">{tool.category}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-600">Permission Level</dt>
                        <dd className="mt-1 text-sm text-gray-900 capitalize">{tool.permission_level.replace('_', ' ')}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-600">Status</dt>
                        <dd className="mt-1 flex items-center gap-2">
                          {tool.is_enabled ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-600">Enabled</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-red-500" />
                              <span className="text-sm text-red-600">Disabled</span>
                            </>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-600">Requires Confirmation</dt>
                        <dd className="mt-1 text-sm text-gray-900">{tool.requires_confirmation ? 'Yes' : 'No'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-600">Parameters</dt>
                        <dd className="mt-1 text-sm text-gray-900">{parameters.length} parameter(s)</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                    <p className="text-gray-700">{tool.description}</p>
                  </div>
                </div>
              )}

              {activeTab === 'parameters' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Parameters</h3>
                  {parameters.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">This tool has no parameters.</p>
                  ) : (
                    <div className="space-y-4">
                      {parameters.map((param) => (
                        <div key={param.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono font-semibold text-gray-900">{param.name}</code>
                              <span className={`text-xs font-mono ${getTypeColor(param.type)}`}>
                                {param.type}
                              </span>
                              {param.is_required && (
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                  Required
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{param.description}</p>
                          {param.default_value && (
                            <div className="text-xs text-gray-600 mb-1">
                              Default: <code className="bg-gray-100 px-1 py-0.5 rounded">{param.default_value}</code>
                            </div>
                          )}
                          {param.enum_values && param.enum_values.length > 0 && (
                            <div className="text-xs text-gray-600">
                              Allowed values: <code className="bg-gray-100 px-1 py-0.5 rounded">{param.enum_values.join(', ')}</code>
                            </div>
                          )}
                          {param.validation_rules && Object.keys(param.validation_rules).length > 0 && (
                            <div className="mt-2 text-xs text-gray-600">
                              Validation: <pre className="bg-gray-50 p-2 rounded mt-1 overflow-x-auto">{JSON.stringify(param.validation_rules, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'response' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Return Value Structure</h3>
                  {returnSchema ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Schema Definition</h4>
                        <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                          {JSON.stringify(returnSchema.schema_definition, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Example Response</h4>
                        <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                          {JSON.stringify(returnSchema.example_response, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-8">No return schema defined for this tool.</p>
                  )}
                </div>
              )}

              {activeTab === 'stats' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution Statistics</h3>
                  {stats ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Total Executions</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{stats.totalExecutions}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-gray-700">Success Rate</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{stats.successRate}%</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-5 h-5 text-orange-600" />
                          <span className="text-sm font-medium text-gray-700">Avg Execution Time</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{stats.averageExecutionTime}ms</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Code className="w-5 h-5 text-cyan-600" />
                          <span className="text-sm font-medium text-gray-700">Success Count</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{stats.successCount}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="w-5 h-5 text-red-600" />
                          <span className="text-sm font-medium text-gray-700">Failure Count</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{stats.failureCount}</div>
                      </div>
                      {stats.lastExecuted && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-2">Last Executed</div>
                          <div className="text-sm text-gray-900">
                            {new Date(stats.lastExecuted).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-8">No execution statistics available yet.</p>
                  )}
                </div>
              )}
            </>
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
