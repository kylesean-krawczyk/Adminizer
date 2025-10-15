import React from 'react'
import { Lock, Clock } from 'lucide-react'
import { useVertical } from '../../contexts/VerticalContext'

interface FeatureLockedCardProps {
  featureName: string
  description: string
  icon?: React.ReactNode
  reason?: 'coming_soon' | 'vertical_restriction' | 'role_restriction'
  comingSoon?: boolean
}

const FeatureLockedCard: React.FC<FeatureLockedCardProps> = ({
  featureName,
  description,
  icon,
  reason = 'vertical_restriction',
  comingSoon = false
}) => {
  const { vertical } = useVertical()
  const isComingSoon = reason === 'coming_soon' || comingSoon

  return (
    <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-6 relative overflow-hidden">
      <div className="absolute top-2 right-2">
        {isComingSoon ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Coming Soon
          </span>
        ) : (
          <Lock className="h-5 w-5 text-gray-400" />
        )}
      </div>

      <div className="opacity-60">
        <div className="flex items-center space-x-3 mb-3">
          {icon && <div className="text-gray-400">{icon}</div>}
          <h3 className="text-lg font-semibold text-gray-900">{featureName}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">{description}</p>

        {isComingSoon ? (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-blue-800 font-medium">
              This feature is currently in development and will be available soon for your {vertical.terminology.organization || 'organization'}.
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600 font-medium">
              This feature is not available for your {vertical.terminology.organization || 'organization'} at this time.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default FeatureLockedCard
