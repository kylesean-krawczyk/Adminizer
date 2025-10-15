import React, { ReactNode } from 'react'
import { useFeatureAvailability } from '../../contexts/FeatureFlagContext'
import ComingSoonBanner from './ComingSoonBanner'
import { Lock } from 'lucide-react'

interface FeatureGateProps {
  featureId: string
  children: ReactNode
  fallback?: ReactNode
  showComingSoon?: boolean
  showRestrictionMessage?: boolean
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  featureId,
  children,
  fallback,
  showComingSoon = true,
  showRestrictionMessage = true
}) => {
  const availability = useFeatureAvailability(featureId)

  if (availability.available) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (showComingSoon && availability.reason === 'coming_soon') {
    return <ComingSoonBanner message={availability.message} featureId={featureId} useVerticalContext={!availability.message} />
  }

  if (showRestrictionMessage) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-gray-100 rounded-full p-6 mx-auto w-24 h-24 flex items-center justify-center mb-6">
            <Lock className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Feature Unavailable
          </h3>
          <p className="text-gray-600 mb-6">
            {availability.message || 'This feature is not available in your current configuration.'}
          </p>
        </div>
      </div>
    )
  }

  return null
}

export default FeatureGate
