import { useState } from 'react';
import { X, AlertCircle, CheckCircle, User, Briefcase, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import type { ToolAccessRequestWithDetails } from '../../types/permissions';

interface RequestReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ToolAccessRequestWithDetails;
  onApprove: (requestId: string, reviewComment: string, grantDurationDays?: number) => Promise<{ success: boolean; error?: string }>;
  onDeny: (requestId: string, reviewComment: string) => Promise<{ success: boolean; error?: string }>;
}

export default function RequestReviewModal({
  isOpen,
  onClose,
  request,
  onApprove,
  onDeny
}: RequestReviewModalProps) {
  const [action, setAction] = useState<'approve' | 'deny'>('approve');
  const [reviewComment, setReviewComment] = useState('');
  const [grantDurationDays, setGrantDurationDays] = useState<number>(
    request.requested_duration_days || 0
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (reviewComment.length < 10) {
      setError('Please provide a review comment of at least 10 characters');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let result;

      if (action === 'approve') {
        result = await onApprove(
          request.id,
          reviewComment,
          request.is_temporary ? grantDurationDays : undefined
        );
      } else {
        result = await onDeny(request.id, reviewComment);
      }

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.error || 'Failed to process request');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process request');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">Review Access Request</h2>
            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(request.priority)}`}>
              {request.priority.toUpperCase()}
            </span>
          </div>
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
            <div className={`border rounded-lg p-6 text-center ${
              action === 'approve'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <CheckCircle className={`h-12 w-12 mx-auto mb-4 ${
                action === 'approve' ? 'text-green-600' : 'text-red-600'
              }`} />
              <h3 className={`text-lg font-semibold mb-2 ${
                action === 'approve' ? 'text-green-900' : 'text-red-900'
              }`}>
                Request {action === 'approve' ? 'Approved' : 'Denied'}!
              </h3>
              <p className={action === 'approve' ? 'text-green-700' : 'text-red-700'}>
                The access request has been {action === 'approve' ? 'approved' : 'denied'} successfully.
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

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-2">Requester Information</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span className="font-medium">Name:</span>
                      <span>{request.user_profile?.full_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Email:</span>
                      <span>{request.user_profile?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Role:</span>
                      <span className="capitalize">{request.user_profile?.role}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Briefcase className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-2">Tool Information</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span className="font-medium">Tool Name:</span>
                      <span>{request.tool?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Category:</span>
                      <span className="capitalize">{request.tool?.category}</span>
                    </div>
                    {request.tool?.description && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600">{request.tool.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-2">Request Details</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span className="font-medium">Submitted:</span>
                      <span>{format(new Date(request.created_at), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Access Type:</span>
                      <span>{request.is_temporary ? 'Temporary' : 'Permanent'}</span>
                    </div>
                    {request.is_temporary && request.requested_duration_days && (
                      <div className="flex justify-between">
                        <span className="font-medium">Requested Duration:</span>
                        <span>{request.requested_duration_days} days</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Reason
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-800">
                {request.request_reason}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Justification
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-800">
                {request.business_justification}
              </div>
            </div>

            {request.priority === 'urgent' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Urgent Priority</p>
                  <p>This request has been marked as urgent and requires immediate attention.</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Decision <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="approve"
                    checked={action === 'approve'}
                    onChange={(e) => setAction(e.target.value as 'approve')}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    disabled={submitting}
                  />
                  <span className="text-sm font-medium text-gray-700">Approve Request</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="deny"
                    checked={action === 'deny'}
                    onChange={(e) => setAction(e.target.value as 'deny')}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                    disabled={submitting}
                  />
                  <span className="text-sm font-medium text-gray-700">Deny Request</span>
                </label>
              </div>
            </div>

            {action === 'approve' && request.is_temporary && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grant Duration (days)
                </label>
                <input
                  type="number"
                  value={grantDurationDays}
                  onChange={(e) => setGrantDurationDays(parseInt(e.target.value) || 0)}
                  min={1}
                  max={365}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={submitting}
                />
                <p className="mt-1 text-xs text-gray-500">
                  User requested {request.requested_duration_days} days. You can adjust this value.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Comment <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={
                  action === 'approve'
                    ? 'Explain why this request is being approved...'
                    : 'Explain why this request is being denied...'
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={submitting}
                minLength={10}
              />
              <p className="mt-1 text-xs text-gray-500">{reviewComment.length}/10 characters minimum</p>
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
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={submitting || reviewComment.length < 10}
              >
                {submitting ? 'Processing...' : action === 'approve' ? 'Approve Request' : 'Deny Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
