import React from 'react'
import { StatCard, CalculatedMetrics } from '../../types/departmentLandingPage'
import { getIconComponent } from '../../utils/iconMapper'

interface DynamicStatCardsProps {
  statCards: StatCard[]
  metrics: CalculatedMetrics
  colorTheme?: string
  loading?: boolean
}

export const DynamicStatCards: React.FC<DynamicStatCardsProps> = ({
  statCards,
  metrics,
  colorTheme = 'blue',
  loading = false
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="flex items-center">
              <div className={`bg-gray-300 p-3 rounded-lg w-14 h-14`} />
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-300 rounded w-24 mb-2" />
                <div className="h-8 bg-gray-300 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (statCards.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-600">No statistics configured for this department.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card) => {
        const IconComponent = getIconComponent(card.icon_name)
        const metricValue = metrics[card.metric_type] ?? 0

        return (
          <div key={card.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`bg-${colorTheme}-500 p-3 rounded-lg`}>
                <IconComponent className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{metricValue}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default DynamicStatCards
