import React from 'react'
import { ExternalLink, CheckCircle, XCircle, Plug } from 'lucide-react'
import { DepartmentIntegration } from '../../types/departmentLandingPage'
import { getIconComponent } from '../../utils/iconMapper'

interface IntegrationCardProps {
  integration: DepartmentIntegration
  onConnect?: (integrationId: string) => void
  onViewDetails?: (integrationId: string) => void
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onConnect,
  onViewDetails
}) => {
  console.log('[IntegrationCard] 🔌 Rendering integration:', integration.name)

  const IconComponent = getIconComponent(integration.icon as any)
  const isConnected = integration.oauth_enabled && integration.status === 'active'

  const getBadgeColor = (badge: string): string => {
    const lowerBadge = badge.toLowerCase()
    if (lowerBadge.includes('popular')) return 'bg-blue-100 text-blue-700'
    if (lowerBadge.includes('oauth')) return 'bg-purple-100 text-purple-700'
    if (lowerBadge.includes('premium')) return 'bg-yellow-100 text-yellow-700'
    if (lowerBadge.includes('beta')) return 'bg-orange-100 text-orange-700'
    if (lowerBadge.includes('new')) return 'bg-green-100 text-green-700'
    if (lowerBadge.includes('recommended')) return 'bg-indigo-100 text-indigo-700'
    if (lowerBadge.includes('enterprise')) return 'bg-gray-700 text-white'
    return 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {integration.logo_url ? (
            <img
              src={integration.logo_url}
              alt={integration.name}
              className="h-10 w-10 object-contain"
            />
          ) : (
            <div className="bg-gray-100 p-2 rounded-lg">
              <IconComponent className="h-6 w-6 text-gray-600" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
            {integration.oauth_enabled && (
              <div className="flex items-center space-x-1 mt-1">
                {isConnected ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">Connected</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Not Connected</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Badges */}
      {integration.badges && integration.badges.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {integration.badges.map((badge, index) => (
            <span
              key={index}
              className={`px-2 py-1 text-xs font-medium rounded ${getBadgeColor(badge)}`}
            >
              {badge}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      {integration.description && (
        <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
      )}

      {/* Features */}
      {integration.features && integration.features.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Key Features
          </h4>
          <ul className="space-y-1">
            {integration.features.slice(0, 4).map((feature, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                <span className="text-blue-600 mt-1">•</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          {integration.features.length > 4 && (
            <p className="text-xs text-gray-500 mt-2">
              +{integration.features.length - 4} more features
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
        {integration.oauth_enabled && !isConnected && (
          <button
            onClick={() => onConnect?.(integration.id)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plug className="h-4 w-4" />
            <span>Connect OAuth</span>
          </button>
        )}
        {integration.external_link && (
          <a
            href={integration.external_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Open</span>
          </a>
        )}
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(integration.id)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <span>View Details</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default IntegrationCard
