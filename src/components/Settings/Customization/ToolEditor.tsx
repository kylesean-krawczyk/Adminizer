import React, { useState } from 'react'
import { DepartmentTool, ToolType } from '../../../types/departmentLandingPage'
import { X } from 'lucide-react'

interface ToolEditorProps {
  tool?: DepartmentTool
  onSave: (data: {
    toolName: string
    toolDescription?: string
    toolUrl?: string
    toolType: ToolType
    displayOrder: number
  }) => Promise<void>
  onCancel: () => void
  existingOrders: number[]
}

const TOOL_TYPES: { value: ToolType; label: string; description: string; requiresUrl: boolean }[] = [
  { value: 'internal_route', label: 'Internal Route', description: 'Link to another page in the app', requiresUrl: true },
  { value: 'external_link', label: 'External Link', description: 'Link to an external website', requiresUrl: true },
  { value: 'integration', label: 'Integration', description: 'Third-party integration', requiresUrl: false }
]

export const ToolEditor: React.FC<ToolEditorProps> = ({
  tool,
  onSave,
  onCancel,
  existingOrders
}) => {
  const [toolName, setToolName] = useState(tool?.tool_name || '')
  const [toolDescription, setToolDescription] = useState(tool?.tool_description || '')
  const [toolUrl, setToolUrl] = useState(tool?.tool_url || '')
  const [toolType, setToolType] = useState<ToolType>(tool?.tool_type || 'internal_route')
  const [displayOrder, setDisplayOrder] = useState(
    tool?.display_order ?? Math.max(0, ...existingOrders, 0) + 1
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedToolType = TOOL_TYPES.find(t => t.value === toolType)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!toolName.trim()) {
      setError('Tool name is required')
      return
    }

    if (toolName.length > 100) {
      setError('Tool name must be 100 characters or less')
      return
    }

    if (toolDescription && toolDescription.length > 500) {
      setError('Description must be 500 characters or less')
      return
    }

    if (selectedToolType?.requiresUrl && !toolUrl.trim()) {
      setError('URL is required for this tool type')
      return
    }

    setSaving(true)
    try {
      await onSave({
        toolName: toolName.trim(),
        toolDescription: toolDescription.trim() || undefined,
        toolUrl: toolUrl.trim() || undefined,
        toolType,
        displayOrder
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tool')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {tool ? 'Edit Tool' : 'Add Tool'}
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
              Tool Name
            </label>
            <input
              type="text"
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              placeholder="e.g., Document Editor"
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={saving}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {toolName.length}/100 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tool Type
            </label>
            <select
              value={toolType}
              onChange={(e) => setToolType(e.target.value as ToolType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={saving}
            >
              {TOOL_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
          </div>

          {selectedToolType?.requiresUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL {selectedToolType.requiresUrl ? '' : '(Optional)'}
              </label>
              <input
                type="text"
                value={toolUrl}
                onChange={(e) => setToolUrl(e.target.value)}
                placeholder={toolType === 'internal_route' ? '/path/to/page' : 'https://example.com'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={saving}
                required={selectedToolType.requiresUrl}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={toolDescription}
              onChange={(e) => setToolDescription(e.target.value)}
              placeholder="Briefly describe this tool..."
              maxLength={500}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={saving}
            />
            <p className="text-xs text-gray-500 mt-1">
              {toolDescription.length}/500 characters
            </p>
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
              {saving ? 'Saving...' : tool ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
