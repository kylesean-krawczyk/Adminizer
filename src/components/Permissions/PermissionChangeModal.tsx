import { useState } from 'react';
import { X, AlertCircle, Clock, Shield, CheckCircle } from 'lucide-react';
import { PermissionService } from '../../services/permissionService';
import type { ToolDefinition } from '../../types/toolRegistry';

interface PermissionChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
  tool: ToolDefinition;
  currentAccess: boolean;
  performedBy: string;
  onSuccess: () => void;
}

export default function PermissionChangeModal({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
  tool,
  currentAccess,
  performedBy,
  onSuccess
}: PermissionChangeModalProps) {
  const [action, setAction] = useState<'grant' | 'revoke'>(currentAccess ? 'revoke' : 'grant');
  const [reason, setReason] = useState('');
  const [isTemporary, setIsTemporary] = useState(false);
  const [durationDays, setDurationDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (reason.length < 10) {
      setError('Please provide a reason of at least 10 characters');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let result;

      if (action === 'grant') {
        result = await PermissionService.grantToolAccess(
          userId,
          tool.id,
          performedBy,
          reason,
          isTemporary ? durationDays : undefined
        );
      } else {
        result = await PermissionService.revokeToolAccess(
          userId,
          tool.id,
          performedBy,
          reason
        );
      }

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(result.error || 'Failed to update permission');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update permission');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {currentAccess ? 'Modify' : 'Grant'} Tool Permission
          </h2>
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
              <h3 className="text-lg font-semibold text-green-900 mb-2">Permission Updated!</h3>
              <p className="text-green-700">
                The permission change has been applied successfully.
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900 mb-2">Permission Change Details</h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex justify-between">
                      <span className="font-medium">User:</span>
                      <span>{userName || userEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Email:</span>
                      <span>{userEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Tool:</span>
                      <span>{tool.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Current Access:</span>
                      <span className={currentAccess ? 'text-green-700' : 'text-red-700'}>
                        {currentAccess ? 'Granted' : 'Not Granted'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="grant"
                    checked={action === 'grant'}
                    onChange={(e) => setAction(e.target.value as 'grant')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={submitting}
                  />
                  <span className="text-sm font-medium text-gray-700">Grant Access</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="revoke"
                    checked={action === 'revoke'}
                    onChange={(e) => setAction(e.target.value as 'revoke')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={submitting}
                  />
                  <span className="text-sm font-medium text-gray-700">Revoke Access</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this permission change is being made..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={submitting}
                minLength={10}
              />
              <p className="mt-1 text-xs text-gray-500">{reason.length}/10 characters minimum</p>
            </div>

            {action === 'grant' && (
              <>
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
                    Grant temporary access
                  </label>
                </div>

                {isTemporary && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      value={durationDays}
                      onChange={(e) => setDurationDays(parseInt(e.target.value) || 30)}
                      min={1}
                      max={365}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={submitting}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Access will automatically expire after {durationDays} days
                    </p>
                  </div>
                )}
              </>
            )}

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
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  action === 'grant' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={submitting || reason.length < 10}
              >
                {submitting ? 'Processing...' : action === 'grant' ? 'Grant Permission' : 'Revoke Permission'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
