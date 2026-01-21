import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { QuickAction, DepartmentIntegration, IconName } from '../../../types/departmentLandingPage'
import { IconPicker } from './IconPicker'
import * as Icons from 'lucide-react'

interface QuickActionEditorModalProps {
  quickAction: QuickAction | null
  integrations: DepartmentIntegration[]
  onSave: (data: {
    id?: string
    label: string
    icon: string
    actionUrl: string
    actionType: 'route' | 'external' | 'modal'
    requiresOauth: boolean
    relatedIntegrationId?: string
    buttonStyle: 'primary' | 'secondary' | 'outline' | 'ghost'
    displayOrder: number
  }) => Promise<void>
  onCancel: () => void
  existingOrders: number[]
}

export const QuickActionEditorModal: React.FC<QuickActionEditorModalProps> = ({
  quickAction,
  integrations,
  onSave,
  onCancel,
  existingOrders
}) => {
  const [label, setLabel] = useState('')
  const [icon, setIcon] = useState<string>('Zap')
  const [actionUrl, setActionUrl] = useState('')
  const [actionType, setActionType] = useState<'route' | 'external' | 'modal'>('route')
  const [requiresOauth, setRequiresOauth] = useState(false)
  const [relatedIntegrationId, setRelatedIntegrationId] = useState<string>('')
  const [buttonStyle, setButtonStyle] = useState<'primary' | 'secondary' | 'outline' | 'ghost'>('primary')
  const [displayOrder, setDisplayOrder] = useState(0)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (quickAction) {
      console.log('[QuickActionEditorModal] 📝 Editing quick action:', quickAction.label)
      setLabel(quickAction.label)
      setIcon(quickAction.icon)
      setActionUrl(quickAction.action_url)
      setActionType(quickAction.action_type)
      setRequiresOauth(quickAction.requires_oauth)
      setRelatedIntegrationId(quickAction.related_integration_id || '')
      setButtonStyle(quickAction.button_style)
      setDisplayOrder(quickAction.display_order)
    } else {
      const nextOrder = Math.max(-1, ...existingOrders) + 1
      setDisplayOrder(nextOrder)
    }
  }, [quickAction, existingOrders])

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName]
    return IconComponent ? <IconComponent className="h-5 w-5" /> : null
  }

  const getButtonStyleClasses = (style: string) => {
    switch (style) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700'
      case 'secondary':
        return 'bg-gray-600 text-white hover:bg-gray-700'
      case 'outline':
        return 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
      case 'ghost':
        return 'text-blue-600 hover:bg-blue-50'
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700'
    }
  }

  const validateUrl = () => {
    if (!actionUrl.trim()) return false

    if (actionType === 'route') {
      return actionUrl.startsWith('/')
    } else if (actionType === 'external') {
      try {
        new URL(actionUrl)
        return true
      } catch {
        return false
      }
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!label.trim()) {
      alert('Action label is required')
      return
    }

    if (!actionUrl.trim()) {
      alert('Action URL is required')
      return
    }

    if (!validateUrl()) {
      if (actionType === 'route') {
        alert('Route URLs must start with /')
      } else if (actionType === 'external') {
        alert('External URLs must be valid (e.g., https://example.com)')
      }
      return
    }

    console.log('[QuickActionEditorModal] 💾 Saving quick action:', label)
    setSaving(true)

    try {
      await onSave({
        id: quickAction?.id,
        label: label.trim(),
        icon,
        actionUrl: actionUrl.trim(),
        actionType,
        requiresOauth,
        relatedIntegrationId: relatedIntegrationId || undefined,
        buttonStyle,
        displayOrder
      })
    } finally {
      setSaving(false)
    }
  }

  const urlPlaceholder = () => {
    switch (actionType) {
      case 'route':
        return '/dashboard/sales'
      case 'external':
        return 'https://example.com'
      case 'modal':
        return 'modal-name'
      default:
        return ''
    }
  }

  const urlHelpText = () => {
    switch (actionType) {
      case 'route':
        return 'Internal route path (must start with /)'
      case 'external':
        return 'Full URL to external resource'
      case 'modal':
        return 'Modal identifier or configuration'
      default:
        return ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {quickAction ? 'Edit Quick Action' : 'Add Quick Action'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action Label *
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., View Analytics, Export Data"
              maxLength={100}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{label.length}/100 characters</p>
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon
            </label>
            <button
              type="button"
              onClick={() => setShowIconPicker(!showIconPicker)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <div className="p-1.5 bg-blue-100 rounded">
                {getIconComponent(icon)}
              </div>
              <span className="text-sm text-gray-700">{icon}</span>
            </button>
            {showIconPicker && (
              <div className="mt-2">
                <IconPicker
                  selectedIcon={icon as IconName}
                  onSelect={(iconName) => {
                    setIcon(iconName as string)
                    setShowIconPicker(false)
                  }}
                />
              </div>
            )}
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action Type *
            </label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="route">Internal Route</option>
              <option value="external">External Link</option>
              <option value="modal">Modal</option>
            </select>
          </div>

          {/* Action URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action URL *
            </label>
            <input
              type="text"
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={urlPlaceholder()}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{urlHelpText()}</p>
          </div>

          {/* OAuth Configuration */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requiresOauth"
                checked={requiresOauth}
                onChange={(e) => setRequiresOauth(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="requiresOauth" className="text-sm font-medium text-gray-700">
                Requires OAuth Authentication
              </label>
            </div>
            {requiresOauth && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Integration
                </label>
                <select
                  value={relatedIntegrationId}
                  onChange={(e) => setRelatedIntegrationId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">None</option>
                  {integrations
                    .filter(int => int.oauth_enabled)
                    .map(int => (
                      <option key={int.id} value={int.id}>
                        {int.name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Only OAuth-enabled integrations are shown
                </p>
              </div>
            )}
          </div>

          {/* Button Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Button Style
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['primary', 'secondary', 'outline', 'ghost'] as const).map(style => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setButtonStyle(style)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all
                    ${buttonStyle === style ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                    ${getButtonStyleClasses(style)}
                  `}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Button Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <button
                type="button"
                className={`px-4 py-2 rounded-lg inline-flex items-center space-x-2 ${getButtonStyleClasses(buttonStyle)}`}
              >
                {getIconComponent(icon)}
                <span>{label || 'Quick Action'}</span>
              </button>
            </div>
          </div>

          {/* Display Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Order
            </label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Quick Action'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuickActionEditorModal
