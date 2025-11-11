import React from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { getRetryMessage } from '../../types/profileErrors'

interface ProfileLoadingCardProps {
  currentAttempt: number
  maxAttempts: number
  message?: string
  showRetryIndicator?: boolean
}

const ProfileLoadingCard: React.FC<ProfileLoadingCardProps> = ({
  currentAttempt,
  maxAttempts,
  message,
  showRetryIndicator = false
}) => {
  const displayMessage = message || getRetryMessage(currentAttempt, maxAttempts)
  const isRetrying = currentAttempt > 1

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex flex-col items-center space-y-6">
            {/* Loading Icon */}
            <div className="relative">
              <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
                {isRetrying && showRetryIndicator ? (
                  <RefreshCw className="h-10 w-10 text-blue-600 animate-spin" />
                ) : (
                  <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                )}
              </div>

              {/* Pulse animation ring */}
              <div className="absolute inset-0 h-20 w-20 bg-blue-200 rounded-full animate-ping opacity-20"></div>
            </div>

            {/* Loading Message */}
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">
                {displayMessage}
              </h3>
              <p className="text-sm text-gray-600">
                {isRetrying
                  ? 'We\'re working to set up your profile...'
                  : 'Please wait while we set up your profile'}
              </p>
            </div>

            {/* Progress Indicator */}
            {currentAttempt > 0 && (
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Attempt {currentAttempt} of {maxAttempts}</span>
                  <span>{Math.round((currentAttempt / maxAttempts) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(currentAttempt / maxAttempts) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Reassuring Message */}
            {isRetrying && (
              <div className="bg-blue-50 rounded-lg p-4 w-full">
                <p className="text-sm text-blue-800 text-center">
                  {currentAttempt === 2 && 'Retrying connection to database...'}
                  {currentAttempt === 3 && 'Final attempt to complete setup...'}
                  {currentAttempt > 3 && 'Still working on it...'}
                </p>
              </div>
            )}

            {/* Time estimate (shown after first attempt) */}
            {currentAttempt > 1 && currentAttempt < maxAttempts && (
              <p className="text-xs text-gray-400 text-center">
                This usually takes just a few seconds
              </p>
            )}
          </div>
        </div>

        {/* Help text */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Setting up your profile for the first time
          </p>
        </div>
      </div>
    </div>
  )
}

export default ProfileLoadingCard
