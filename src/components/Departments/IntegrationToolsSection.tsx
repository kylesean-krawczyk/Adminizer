import React from 'react'
import { DepartmentIntegration } from '../../types/departmentLandingPage'
import IntegrationCard from './IntegrationCard'

interface IntegrationToolsSectionProps {
  integrations: DepartmentIntegration[]
  loading?: boolean
  onConnect?: (integrationId: string) => void
  onViewDetails?: (integrationId: string) => void
}

export const IntegrationToolsSection: React.FC<IntegrationToolsSectionProps> = ({
  integrations,
  loading = false,
  onConnect,
  onViewDetails
}) => {
  console.log('[IntegrationToolsSection] 🔌 Rendering', integrations.length, 'integrations')

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-6 bg-gray-300 rounded w-56 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="border-2 border-gray-200 rounded-lg p-6 animate-pulse"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 bg-gray-300 rounded-lg" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-300 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-300 rounded w-24" />
                </div>
              </div>
              <div className="h-4 bg-gray-300 rounded w-full mb-2" />
              <div className="h-4 bg-gray-300 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (integrations.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Integration Platforms</h2>
        <p className="text-sm text-gray-600 mt-1">
          Connect with third-party platforms to streamline your workflow
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onConnect={onConnect}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  )
}

export default IntegrationToolsSection
