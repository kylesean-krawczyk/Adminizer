import React from 'react'
import { DepartmentFeature } from '../../types/departmentLandingPage'

interface DynamicFeaturesListProps {
  features: DepartmentFeature[]
  colorTheme?: string
  loading?: boolean
}

export const DynamicFeaturesList: React.FC<DynamicFeaturesListProps> = ({
  features,
  colorTheme = 'blue',
  loading = false
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-6 bg-gray-300 rounded w-48 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg animate-pulse">
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
              <div className="h-4 bg-gray-300 rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (features.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Features & Capabilities
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => (
          <div
            key={feature.id}
            className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className={`w-2 h-2 bg-${colorTheme}-500 rounded-full mt-2 flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-gray-700 font-medium block">
                {feature.title}
              </span>
              {feature.description && (
                <span className="text-xs text-gray-500 block mt-1">
                  {feature.description}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DynamicFeaturesList
