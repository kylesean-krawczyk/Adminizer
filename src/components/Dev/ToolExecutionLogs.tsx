import { useState, useEffect } from 'react';
import { useUserManagement } from '../../hooks';
import { ToolRegistryService } from '../../services/toolRegistryService';
import { Calendar, CheckCircle, XCircle, Clock, Filter, RefreshCw, Eye, AlertCircle } from 'lucide-react';
import type { ToolExecutionLog, ToolDefinition, ToolExecutionStatus } from '../../types/toolRegistry';

export default function ToolExecutionLogs() {
  const { userProfile } = useUserManagement();
  const [logs, setLogs] = useState<ToolExecutionLog[]>([]);
  const [tools, setTools] = useState<Record<string, ToolDefinition>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ToolExecutionStatus | 'all'>('all');
  const [selectedLog, setSelectedLog] = useState<ToolExecutionLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (userProfile?.role !== 'master_admin') {
      return;
    }
    loadLogs();
    loadTools();
  }, [userProfile?.role]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const allLogs = await ToolRegistryService.fetchExecutionLogs({ limit: 100 });
      setLogs(allLogs);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTools = async () => {
    try {
      const allTools = await ToolRegistryService.fetchAllTools();
      const toolsMap: Record<string, ToolDefinition> = {};
      allTools.forEach(tool => {
        toolsMap[tool.id] = tool;
      });
      setTools(toolsMap);
    } catch (error) {
      console.error('Failed to load tools:', error);
    }
  };

  const getStatusColor = (status: ToolExecutionStatus): string => {
    const colors: Record<ToolExecutionStatus, string> = {
      pending: 'bg-gray-100 text-gray-800',
      executing: 'bg-blue-100 text-blue-800',
      success: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: ToolExecutionStatus) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'executing':
        return <Clock className="w-4 h-4 animate-spin" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleViewDetails = (log: ToolExecutionLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const filteredLogs = statusFilter === 'all'
    ? logs
    : logs.filter(log => log.status === statusFilter);

  if (userProfile?.role !== 'master_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only Master Administrators can access execution logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-gray-700" />
              <h1 className="text-3xl font-bold text-gray-900">Tool Execution Logs</h1>
            </div>
            <button
              onClick={loadLogs}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
          <p className="text-gray-600">
            View and monitor all AI tool executions
          </p>
        </div>

        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Status:</span>
            </div>
            <div className="flex gap-2">
              {(['all', 'success', 'failed', 'executing', 'pending', 'cancelled'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No logs found</h3>
            <p className="text-gray-600">No tool executions match your current filters.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tool
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Execution Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map(log => {
                  const tool = tools[log.tool_id];
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {tool?.name || 'Unknown Tool'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {tool?.slug || log.tool_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                          {getStatusIcon(log.status)}
                          {log.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.execution_time_ms ? `${log.execution_time_ms}ms` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleViewDetails(log)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4" />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Execution Log Details</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedLog(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Tool</h3>
                <p className="text-gray-900">{tools[selectedLog.tool_id]?.name || 'Unknown'}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Status</h3>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedLog.status)}`}>
                  {getStatusIcon(selectedLog.status)}
                  {selectedLog.status}
                </div>
              </div>

              {selectedLog.execution_time_ms && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Execution Time</h3>
                  <p className="text-gray-900">{selectedLog.execution_time_ms}ms</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Parameters</h3>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selectedLog.parameters, null, 2)}
                </pre>
              </div>

              {selectedLog.response && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Response</h3>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.response, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.error_message && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Error Message</h3>
                  <p className="text-red-700 bg-red-50 p-3 rounded">{selectedLog.error_message}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Timestamp</h3>
                <p className="text-gray-900">{new Date(selectedLog.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedLog(null);
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
