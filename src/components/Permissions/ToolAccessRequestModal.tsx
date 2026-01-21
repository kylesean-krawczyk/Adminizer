import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Clock, Info } from 'lucide-react';
import { ToolAccessRequestService } from '../../services/toolAccessRequestService';
import { ToolRegistryService } from '../../services/toolRegistryService';
import { useAuth } from '../../contexts/AuthContext';
import type { ToolDefinition } from '../../types/toolRegistry';
import type { AccessRequestPriority } from '../../types/permissions';

interface ToolAccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolId?: string;
  onSuccess?: () => void;
}

export default function ToolAccessRequestModal({
  isOpen,
  onClose,
  toolId,
  onSuccess
}: ToolAccessRequestModalProps) {
  const { user } = useAuth();
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [selectedToolId, setSelectedToolId] = useState(toolId || '');
  const [requestReason, setRequestReason] = useState('');
  const [businessJustification, setBusinessJustification] = useState('');
  const [isTemporary, setIsTemporary] = useState(false);
  const [requestedDurationDays, setRequestedDurationDays] = useState<number>(30);
  const [priority, setPriority] = useState<AccessRequestPriority>('normal');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadTools();
      setSelectedToolId(toolId || '');
      setRequestReason('');
      setBusinessJustification('');
      setIsTemporary(false);
      setRequestedDurationDays(30);
      setPriority('normal');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, toolId]);

  const loadTools = async () => {
    try {
      setLoading(true);
      const allTools = await ToolRegistryService.fetchAllTools({ isEnabled: true });
      setTools(allTools);
    } catch (err) {
      console.error('Error loading tools:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setError('You must be logged in to submit a request');
      return;
    }

    if (!selectedToolId) {
      setError('Please select a tool');
      return;
    }

    if (requestReason.length < 10) {
      setError('Please provide a reason of at least 10 characters');
      return;
    }

    if (businessJustification.length < 20) {
      setError('Please provide a detailed business justification (at least 20 characters)');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await ToolAccessRequestService.createAccessRequest(user.id, {
        tool_id: selectedToolId,
        request_reason: requestReason,
        business_justification: businessJustification,
        is_temporary: isTemporary,
        requested_duration_days: isTemporary ? requestedDurationDays : undefined,
        priority
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Failed to submit request');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedTool = tools.find(t => t.id === selectedToolId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Request Tool Access</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={submitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="p-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">Request Submitted!</h3>
              <p className="text-green-700">
                Your access request has been submitted successfully. You'll be notified when an administrator reviews your request.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">About Tool Access Requests</p>
                <p>Submit a request to access tools that require elevated permissions. An administrator will review your request and may approve or deny it based on your business justification.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tool <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedToolId}
                onChange={(e) => setSelectedToolId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading || submitting || !!toolId}
              >
                <option value="">Select a tool...</option>
                {tools.map((tool) => (
                  <option key={tool.id} value={tool.id}>
                    {tool.name} - {tool.category}
                  </option>
                ))}
              </select>
              {selectedTool && (
                <p className="mt-2 text-sm text-gray-600">{selectedTool.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Request <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="e.g., Need to generate monthly reports"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={submitting}
                minLength={10}
              />
              <p className="mt-1 text-xs text-gray-500">{requestReason.length}/10 characters minimum</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Justification <span className="text-red-500">*</span>
              </label>
              <textarea
                value={businessJustification}
                onChange={(e) => setBusinessJustification(e.target.value)}
                placeholder="Explain in detail why you need access to this tool and how it will help your work..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={submitting}
                minLength={20}
              />
              <p className="mt-1 text-xs text-gray-500">{businessJustification.length}/20 characters minimum</p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isTemporary"
                checked={isTemporary}
                onChange={(e) => setIsTemporary(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={submitting}
              />
              <label htmlFor="isTemporary" className="text-sm font-medium text-gray-700 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Request temporary access
              </label>
            </div>

            {isTemporary && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (days)
                </label>
                <input
                  type="number"
                  value={requestedDurationDays}
                  onChange={(e) => setRequestedDurationDays(parseInt(e.target.value) || 30)}
                  min={1}
                  max={365}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={submitting}
                />
                <p className="mt-1 text-xs text-gray-500">Access will automatically expire after this period</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as AccessRequestPriority)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              >
                <option value="low">Low - Can wait</option>
                <option value="normal">Normal - Standard processing</option>
                <option value="high">High - Need soon</option>
                <option value="urgent">Urgent - Immediate need</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting || !selectedToolId || requestReason.length < 10 || businessJustification.length < 20}
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
