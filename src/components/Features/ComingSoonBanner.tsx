import React from 'react'
import { Clock, Sparkles } from 'lucide-react'
import { useVertical } from '../../contexts/VerticalContext'
import { getVerticalFeatureMetadata, getVerticalComingSoonMessage } from '../../utils/verticalFeatures'

interface ComingSoonBannerProps {
  message?: string
  featureName?: string
  description?: string
  estimatedDate?: string
  featureId?: string
  useVerticalContext?: boolean
}

const ComingSoonBanner: React.FC<ComingSoonBannerProps> = ({
  message,
  featureName,
  description,
  estimatedDate,
  useVerticalContext = false
}) => {
  const { verticalId } = useVertical()
  const metadata = getVerticalFeatureMetadata(verticalId)

  const displayFeatureName = useVerticalContext && !featureName
    ? metadata.name
    : featureName || 'Coming Soon'

  const displayMessage = useVerticalContext && !message && !description
    ? getVerticalComingSoonMessage(displayFeatureName, verticalId)
    : (description || message || 'This feature is coming soon to your organization. Stay tuned for updates!')

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-lg p-8">
      <div className="flex items-start space-x-4">
        <div className="bg-blue-100 rounded-full p-3">
          <Sparkles className="h-8 w-8 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">
              {displayFeatureName}
            </h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <Clock className="h-4 w-4 mr-1" />
              In Development
            </span>
          </div>
          <p className="text-gray-700 mb-4">
            {displayMessage}
          </p>
          {estimatedDate && (
            <p className="text-sm text-gray-600">
              <strong>Estimated availability:</strong> {estimatedDate}
            </p>
          )}
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '35%' }}></div>
            </div>
            <span className="text-sm text-gray-600 font-medium">35% Complete</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComingSoonBanner
