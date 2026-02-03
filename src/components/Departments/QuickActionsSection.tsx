import React from 'react'
import { Link } from 'react-router-dom'
import { QuickAction } from '../../types/departmentLandingPage'
import { getIconComponent } from '../../utils/iconMapper'

interface QuickActionsSectionProps {
  quickActions: QuickAction[]
  loading?: boolean
}

export const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
  quickActions,
  loading = false
}) => {
  console.log('[QuickActionsSection] ⚡ Rendering', quickActions.length, 'actions')

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="h-5 bg-gray-300 rounded w-32 mb-4 animate-pulse" />
        <div className="flex flex-wrap gap-3">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="h-10 w-40 bg-gray-300 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (quickActions.length === 0) {
    return null
  }

  const getButtonClassName = (style: string): string => {
    switch (style) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700 border-transparent'
      case 'secondary':
        return 'bg-gray-600 text-white hover:bg-gray-700 border-transparent'
      case 'outline':
        return 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
      case 'ghost':
        return 'bg-transparent text-gray-700 hover:bg-gray-100 border-transparent'
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700 border-transparent'
    }
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="flex flex-wrap gap-3">
        {quickActions.map((action) => {
          const IconComponent = getIconComponent(action.icon as any)
          const buttonClass = `flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm border ${getButtonClassName(
            action.button_style
          )}`

          if (action.action_type === 'route') {
            return (
              <Link
                key={action.id}
                to={action.action_url}
                className={buttonClass}
              >
                <IconComponent className="h-4 w-4" />
                <span>{action.label}</span>
              </Link>
            )
          }

          if (action.action_type === 'external') {
            return (
              <a
                key={action.id}
                href={action.action_url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass}
              >
                <IconComponent className="h-4 w-4" />
                <span>{action.label}</span>
              </a>
            )
          }

          // For 'modal' type, just render a button (handler would be passed from parent)
          return (
            <button
              key={action.id}
              className={buttonClass}
              onClick={() => console.log('[QuickActionsSection] Modal action:', action.label)}
            >
              <IconComponent className="h-4 w-4" />
              <span>{action.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default QuickActionsSection
