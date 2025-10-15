import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, FileText, Users, BarChart3, Activity } from 'lucide-react';

interface ToolResult {
  toolName: string;
  success: boolean;
  data?: any;
  error?: string;
  executionTimeMs?: number;
}

interface BatchResultsViewProps {
  results: ToolResult[];
  totalExecutionTime?: number;
}

export default function BatchResultsView({ results, totalExecutionTime }: BatchResultsViewProps) {
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set([0]));

  const toggleResult = (index: number) => {
    setExpandedResults(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;

  const getToolIcon = (toolName: string) => {
    if (toolName.toLowerCase().includes('document')) return FileText;
    if (toolName.toLowerCase().includes('employee')) return Users;
    if (toolName.toLowerCase().includes('report')) return BarChart3;
    if (toolName.toLowerCase().includes('system')) return Activity;
    return CheckCircle;
  };

  const renderResultData = (data: any) => {
    if (!data) return null;

    if (data.results && Array.isArray(data.results)) {
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Found {data.total || data.results.length} results
          </p>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {data.results.slice(0, 10).map((item: any, idx: number) => (
              <div key={idx} className="bg-gray-50 rounded p-2 text-sm">
                <p className="font-medium text-gray-900">
                  {item.title || item.name || `Item ${idx + 1}`}
                </p>
                {item.category && (
                  <p className="text-xs text-gray-600 mt-1">Category: {item.category}</p>
                )}
                {item.lastModified && (
                  <p className="text-xs text-gray-600">
                    Modified: {new Date(item.lastModified).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
            {data.results.length > 10 && (
              <p className="text-xs text-gray-500 italic">
                ... and {data.results.length - 10} more results
              </p>
            )}
          </div>
        </div>
      );
    }

    if (data.employees && Array.isArray(data.employees)) {
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Found {data.total || data.employees.length} employees
          </p>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {data.employees.slice(0, 10).map((emp: any, idx: number) => (
              <div key={idx} className="bg-gray-50 rounded p-2 text-sm">
                <p className="font-medium text-gray-900">{emp.name}</p>
                <p className="text-xs text-gray-600">
                  {emp.role} • {emp.department} • {emp.status}
                </p>
              </div>
            ))}
            {data.employees.length > 10 && (
              <p className="text-xs text-gray-500 italic">
                ... and {data.employees.length - 10} more employees
              </p>
            )}
          </div>
        </div>
      );
    }

    if (data.employee) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm font-medium text-green-900 mb-2">Employee Created</p>
          <div className="space-y-1 text-sm text-gray-700">
            <p><span className="font-medium">Name:</span> {data.employee.name}</p>
            <p><span className="font-medium">Email:</span> {data.employee.email}</p>
            <p><span className="font-medium">Role:</span> {data.employee.role}</p>
            <p><span className="font-medium">Start Date:</span> {data.employee.startDate}</p>
          </div>
        </div>
      );
    }

    if (data.reportId) {
      return (
        <div className="space-y-2">
          <div className="bg-gray-50 rounded p-3">
            <p className="text-xs text-gray-600">Report ID</p>
            <p className="text-sm font-mono text-gray-900">{data.reportId}</p>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <p className="text-xs text-gray-600">Type</p>
            <p className="text-sm font-medium text-gray-900">{data.reportType}</p>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <p className="text-xs text-gray-600">Generated</p>
            <p className="text-sm text-gray-900">
              {new Date(data.generatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      );
    }

    if (data.status) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              data.status === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {data.status.toUpperCase()}
            </span>
          </div>
          {data.metrics && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {Object.entries(data.metrics).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-600">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-sm font-medium text-gray-900">{String(value)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <pre className="text-xs bg-gray-50 rounded p-3 overflow-x-auto max-h-60">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">{successCount} succeeded</span>
          </div>
          {failureCount > 0 && (
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-gray-700">{failureCount} failed</span>
            </div>
          )}
        </div>
        {totalExecutionTime !== undefined && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">{totalExecutionTime}ms total</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {results.map((result, index) => {
          const Icon = getToolIcon(result.toolName);
          const isExpanded = expandedResults.has(index);

          return (
            <div
              key={index}
              className={`border rounded-lg overflow-hidden transition-colors ${
                result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <button
                onClick={() => toggleResult(index)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-opacity-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${result.success ? 'text-green-600' : 'text-red-600'}`} />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{result.toolName}</p>
                    {result.executionTimeMs !== undefined && (
                      <p className="text-xs text-gray-600">{result.executionTimeMs}ms</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 bg-white">
                  {result.success ? (
                    renderResultData(result.data)
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-800 mb-1">Error</p>
                      <p className="text-sm text-red-700">{result.error || 'Unknown error occurred'}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
