import React, { useState } from 'react'
import { IconName, MetricType, StatCard } from '../../../types/departmentLandingPage'
import { IconPicker } from './IconPicker'
import { X } from 'lucide-react'
import * as Icons from 'lucide-react'

interface StatCardEditorProps {
  card?: StatCard
  onSave: (data: {
    label: string
    iconName: IconName
    metricType: MetricType
    displayOrder: number
  }) => Promise<void>
  onCancel: () => void
  existingOrders: number[]
}

const METRIC_TYPES: { value: MetricType; label: string; description: string }[] = [
  { value: 'documents', label: 'Documents', description: 'Total number of documents' },
  { value: 'team_members', label: 'Team Members', description: 'Number of team members' },
  { value: 'active_projects', label: 'Active Projects', description: 'Number of active projects' },
  { value: 'resources', label: 'Resources', description: 'Available resources count' },
  { value: 'custom', label: 'Custom', description: 'Custom metric value' }
]

export const StatCardEditor: React.FC<StatCardEditorProps> = ({
  card,
  onSave,
  onCancel,
  existingOrders
}) => {
  const [label, setLabel] = useState(card?.label || '')
  const [iconName, setIconName] = useState<IconName>(card?.icon_name || 'BarChart')
  const [metricType, setMetricType] = useState<MetricType>(card?.metric_type || 'custom')
  const [displayOrder, setDisplayOrder] = useState(
    card?.display_order ?? Math.max(0, ...existingOrders, 0) + 1
  )
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getIconComponent = (name: IconName) => {
    const IconComponent = (Icons as any)[name]
    return IconComponent ? <IconComponent className="h-5 w-5" /> : null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!label.trim()) {
      setError('Label is required')
      return
    }

    if (label.length > 50) {
      setError('Label must be 50 characters or less')
      return
    }

    setSaving(true)
    try {
      await onSave({
        label: label.trim(),
        iconName,
        metricType,
        displayOrder
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save stat card')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {card ? 'Edit Stat Card' : 'Add Stat Card'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
            disabled={saving}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Total Documents"
              maxLength={50}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={saving}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {label.length}/50 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                disabled={saving}
              >
                {getIconComponent(iconName)}
                <span className="text-sm text-gray-700">{iconName}</span>
              </button>

              {showIconPicker && (
                <div className="absolute top-full left-0 mt-2 z-10">
                  <IconPicker
                    selectedIcon={iconName}
                    onSelect={setIconName}
                    onClose={() => setShowIconPicker(false)}
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metric Type
            </label>
            <select
              value={metricType}
              onChange={(e) => setMetricType(e.target.value as MetricType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={saving}
            >
              {METRIC_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Order
            </label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={saving}
            />
            <p className="text-xs text-gray-500 mt-1">
              Lower numbers appear first
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : card ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
