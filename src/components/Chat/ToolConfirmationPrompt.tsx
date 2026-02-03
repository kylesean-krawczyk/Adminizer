import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { UserConfirmationRequest } from '../../types/toolRegistry';

interface ToolConfirmationPromptProps {
  confirmationRequest: UserConfirmationRequest;
  onApprove: () => void;
  onDeny: () => void;
  loading?: boolean;
}

export default function ToolConfirmationPrompt({
  confirmationRequest,
  onApprove,
  onDeny,
  loading = false
}: ToolConfirmationPromptProps) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-3">
      <div className="flex items-start gap-3 mb-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-yellow-900 mb-1">Tool Execution Approval Required</h4>
          <p className="text-sm text-yellow-800 mb-2">
            The AI assistant wants to execute the following tool:
          </p>
        </div>
      </div>

      <div className="bg-white rounded border border-yellow-200 p-3 mb-3">
        <div className="mb-2">
          <span className="text-xs font-medium text-gray-600">Tool:</span>
          <div className="font-semibold text-gray-900">{confirmationRequest.toolName}</div>
        </div>
        <div className="mb-2">
          <span className="text-xs font-medium text-gray-600">Description:</span>
          <div className="text-sm text-gray-700">{confirmationRequest.toolDescription}</div>
        </div>
        {Object.keys(confirmationRequest.parameters).length > 0 && (
          <div>
            <span className="text-xs font-medium text-gray-600">Parameters:</span>
            <div className="mt-1 bg-gray-50 rounded p-2">
              <pre className="text-xs text-gray-700 overflow-x-auto">
                {JSON.stringify(confirmationRequest.parameters, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onApprove}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <CheckCircle className="w-4 h-4" />
          {loading ? 'Executing...' : 'Approve & Execute'}
        </button>
        <button
          onClick={onDeny}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <XCircle className="w-4 h-4" />
          Deny
        </button>
      </div>

      <p className="text-xs text-yellow-700 mt-2 text-center">
        Review the parameters carefully before approving this action.
      </p>
    </div>
  );
}
