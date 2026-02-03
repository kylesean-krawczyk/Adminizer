import React, { useState, useEffect } from 'react'
import { Save, RotateCcw, Sparkles } from 'lucide-react'
import { VerticalId } from '../../../config/types'
import { DepartmentSectionAssignment } from '../../../types/departmentAssignments'
import { saveDepartmentBasicSettings, resetDepartmentToDefaults } from '../../../services/departmentSyncService'
import { IconPicker } from './IconPicker'

interface DepartmentBasicSettingsPanelProps {
  organizationId: string
  verticalId: VerticalId
  departmentId: string
  assignment: DepartmentSectionAssignment | null
  onSave: () => void
}

const DepartmentBasicSettingsPanel: React.FC<DepartmentBasicSettingsPanelProps> = ({
  organizationId,
  verticalId,
  departmentId,
  assignment,
  onSave
}) => {
  const [customName, setCustomName] = useState('')
  const [customDescription, setCustomDescription] = useState('')
  const [selectedIcon, setSelectedIcon] = useState<string>('')
  const [selectedEmoji, setSelectedEmoji] = useState('')
  const [colorTheme, setColorTheme] = useState('')
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (assignment) {
      setCustomName(assignment.custom_name || '')
      setCustomDescription(assignment.custom_description || '')
      setSelectedIcon(assignment.icon_name || '')
      setSelectedEmoji(assignment.emoji || '')
      setColorTheme(assignment.color_theme || '')
    }
  }, [assignment])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      await saveDepartmentBasicSettings({
        organizationId,
        verticalId,
        departmentId,
        settings: {
          customName: customName || undefined,
          customDescription: customDescription || undefined,
          iconName: selectedIcon || undefined,
          emoji: selectedEmoji || undefined,
          colorTheme: colorTheme || undefined
        }
      })

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      onSave()
    } catch (err) {
      console.error('Error saving settings:', err)
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset this department to defaults? This will clear all customizations.')) {
      return
    }

    try {
      setResetting(true)
      setError(null)

      await resetDepartmentToDefaults(organizationId, verticalId, departmentId)

      setCustomName('')
      setCustomDescription('')
      setSelectedIcon('')
      setSelectedEmoji('')
      setColorTheme('')

      onSave()
    } catch (err) {
      console.error('Error resetting:', err)
      setError('Failed to reset settings')
    } finally {
      setResetting(false)
    }
  }

  const colorOptions = [
    { name: 'Blue', value: 'blue', bg: 'bg-blue-500' },
    { name: 'Green', value: 'green', bg: 'bg-green-500' },
    { name: 'Red', value: 'red', bg: 'bg-red-500' },
    { name: 'Yellow', value: 'yellow', bg: 'bg-yellow-500' },
    { name: 'Orange', value: 'orange', bg: 'bg-orange-500' },
    { name: 'Pink', value: 'pink', bg: 'bg-pink-500' },
    { name: 'Teal', value: 'teal', bg: 'bg-teal-500' },
    { name: 'Gray', value: 'gray', bg: 'bg-gray-500' }
  ]

  const emojiOptions = ['📊', '💼', '🎯', '📈', '🚀', '⚙️', '🏢', '👥', '📝', '💡', '🔧', '📦', '🎨', '🔐', '📱']

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Basic Settings
          </h4>
          <p className="text-sm text-gray-600 mt-1">Customize the department's name, icon, and appearance</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">Settings saved successfully!</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department Name
          </label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder={assignment?.display_name || departmentId}
            maxLength={100}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">{customName.length}/100 characters</p>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={customDescription}
            onChange={(e) => setCustomDescription(e.target.value)}
            placeholder="Brief description of this department..."
            maxLength={500}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">{customDescription.length}/500 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Icon
          </label>
          <IconPicker
            selectedIcon={selectedIcon as any}
            onSelect={setSelectedIcon as any}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Emoji
          </label>
          <div className="flex flex-wrap gap-2">
            {emojiOptions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setSelectedEmoji(emoji)}
                className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg border-2 transition-all ${
                  selectedEmoji === emoji
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color Theme
          </label>
          <div className="flex flex-wrap gap-3">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                onClick={() => setColorTheme(color.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                  colorTheme === color.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${color.bg}`}></div>
                <span className="text-sm font-medium text-gray-700">{color.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-200">
        <button
          onClick={handleReset}
          disabled={resetting || saving}
          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
          {resetting ? 'Resetting...' : 'Reset to Defaults'}
        </button>

        <button
          onClick={handleSave}
          disabled={saving || resetting}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}

export default DepartmentBasicSettingsPanel
