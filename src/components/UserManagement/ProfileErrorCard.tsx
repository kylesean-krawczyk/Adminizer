import React, { useState } from 'react'
import { AlertTriangle, RefreshCw, Wrench, Copy, HelpCircle, CheckCircle } from 'lucide-react'
import type { ProfileError } from '../../types/profileErrors'
import { ERROR_TROUBLESHOOTING, getSupportInfo } from '../../types/profileErrors'

interface ProfileErrorCardProps {
  error: ProfileError
  onRetry?: () => void
  onManualSetup?: () => void
  isRetrying?: boolean
  showTechnicalDetails?: boolean
}

const ProfileErrorCard: React.FC<ProfileErrorCardProps> = ({
  error,
  onRetry,
  onManualSetup,
  isRetrying = false,
  showTechnicalDetails = false
}) => {
  const [copied, setCopied] = useState(false)
  const [showDetails, setShowDetails] = useState(showTechnicalDetails)

  const supportInfo = getSupportInfo(error)

  const copyErrorDetails = () => {
    const details = `
Error Code: ${error.code}
Message: ${error.message}
Time: ${error.timestamp.toISOString()}
Technical Details: ${error.technicalDetails || 'N/A'}
Retry Count: ${error.retryCount || 0}
    `.trim()

    navigator.clipboard.writeText(details)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-4">
        {/* Main Error Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex flex-col items-center space-y-6">
            {/* Error Icon */}
            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>

            {/* Error Message */}
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">
                Setup Incomplete
              </h3>
              <p className="text-base text-gray-700">
                {error.userMessage}
              </p>
              <p className="text-sm text-gray-500">
                Error Code: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{error.code}</code>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-3">
              {/* Retry Button (if retryable and callback provided) */}
              {error.retryable && onRetry && (
                <button
                  onClick={onRetry}
                  disabled={isRetrying}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2" />
                      Try Again
                    </>
                  )}
                </button>
              )}

              {/* Manual Setup Button (if callback provided) */}
              {onManualSetup && (
                <button
                  onClick={onManualSetup}
                  disabled={isRetrying}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <Wrench className="h-5 w-5 mr-2" />
                  Complete Setup Manually
                </button>
              )}
            </div>

            {/* Copy Error Details */}
            <button
              onClick={copyErrorDetails}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Error Details
                </>
              )}
            </button>
          </div>
        </div>

        {/* Technical Details (expandable) */}
        {error.technicalDetails && (
          <div className="bg-white rounded-lg shadow p-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <span>Technical Details</span>
              <span className="text-xs text-gray-500">
                {showDetails ? 'Hide' : 'Show'}
              </span>
            </button>

            {showDetails && (
              <div className="mt-3 space-y-2">
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-xs font-mono text-gray-700 break-all">
                    {error.technicalDetails}
                  </p>
                </div>

                {ERROR_TROUBLESHOOTING[error.code] && (
                  <div className="bg-blue-50 rounded p-3">
                    <p className="text-xs text-blue-800">
                      <strong>Troubleshooting:</strong> {ERROR_TROUBLESHOOTING[error.code]}
                    </p>
                  </div>
                )}

                {error.retryCount && error.retryCount > 0 && (
                  <p className="text-xs text-gray-500">
                    Attempted {error.retryCount} {error.retryCount === 1 ? 'time' : 'times'}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Support Information */}
        {supportInfo.shouldShowSupport && (
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-start space-x-3">
              <HelpCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-yellow-900 mb-1">
                  Need Help?
                </h4>
                <p className="text-sm text-yellow-800">
                  {supportInfo.supportMessage}
                </p>
                <p className="text-xs text-yellow-700 mt-2">
                  Please include the error code and details when contacting support.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* What to do next */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">What to do next:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            {error.retryable && (
              <li>• Click "Try Again" to retry the setup process</li>
            )}
            {onManualSetup && (
              <li>• Use "Complete Setup Manually" as an alternative</li>
            )}
            <li>• Copy error details to share with support if needed</li>
            <li>• Check your internet connection and try again</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-400">
            Error occurred at {error.timestamp.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ProfileErrorCard
