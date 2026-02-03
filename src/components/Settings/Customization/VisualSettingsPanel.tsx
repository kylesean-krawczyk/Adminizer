import React, { useState } from 'react'
import { IconName } from '../../../types/departmentLandingPage'
import { IconPicker } from './IconPicker'
import * as Icons from 'lucide-react'

interface VisualSettingsPanelProps {
  iconName?: string
  emoji?: string
  colorTheme?: string
  onSave: (iconName?: string, emoji?: string, colorTheme?: string) => Promise<void>
}

const COLOR_THEMES = [
  { value: 'blue', label: 'Blue', bgClass: 'bg-blue-100', textClass: 'text-blue-600' },
  { value: 'green', label: 'Green', bgClass: 'bg-green-100', textClass: 'text-green-600' },
  { value: 'purple', label: 'Purple', bgClass: 'bg-purple-100', textClass: 'text-purple-600' },
  { value: 'red', label: 'Red', bgClass: 'bg-red-100', textClass: 'text-red-600' },
  { value: 'yellow', label: 'Yellow', bgClass: 'bg-yellow-100', textClass: 'text-yellow-600' },
  { value: 'pink', label: 'Pink', bgClass: 'bg-pink-100', textClass: 'text-pink-600' },
  { value: 'indigo', label: 'Indigo', bgClass: 'bg-indigo-100', textClass: 'text-indigo-600' },
  { value: 'gray', label: 'Gray', bgClass: 'bg-gray-100', textClass: 'text-gray-600' }
]

export const VisualSettingsPanel: React.FC<VisualSettingsPanelProps> = ({
  iconName: initialIcon,
  emoji: initialEmoji,
  colorTheme: initialColor,
  onSave
}) => {
  const [iconName, setIconName] = useState<string>(initialIcon || '')
  const [emoji, setEmoji] = useState<string>(initialEmoji || '')
  const [colorTheme, setColorTheme] = useState<string>(initialColor || 'blue')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const getIconComponent = (name: string) => {
    if (!name) return null
    const IconComponent = (Icons as any)[name]
    return IconComponent ? <IconComponent className="h-6 w-6" /> : null
  }

  const handleSave = async () => {
    setSaving(true)
    setSuccessMessage(null)

    try {
      await onSave(
        iconName || undefined,
        emoji || undefined,
        colorTheme || undefined
      )
      setSuccessMessage('Visual settings saved successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error saving visual settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const selectedTheme = COLOR_THEMES.find(t => t.value === colorTheme) || COLOR_THEMES[0]

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Icon
        </label>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowIconPicker(!showIconPicker)}
            className={`px-4 py-3 border-2 rounded-lg hover:bg-gray-50 flex items-center space-x-2 ${
              iconName ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
            }`}
          >
            {iconName ? (
              <>
                {getIconComponent(iconName)}
                <span className="text-sm font-medium">{iconName}</span>
              </>
            ) : (
              <span className="text-sm text-gray-500">Select an icon</span>
            )}
          </button>
          {iconName && (
            <button
              type="button"
              onClick={() => setIconName('')}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              Clear
            </button>
          )}
        </div>

        {showIconPicker && (
          <div className="mt-2">
            <IconPicker
              selectedIcon={iconName as IconName}
              onSelect={(icon) => {
                setIconName(icon)
                setShowIconPicker(false)
              }}
              onClose={() => setShowIconPicker(false)}
            />
          </div>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Optional icon to display for this department
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Emoji
        </label>
        <input
          type="text"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          placeholder="e.g., 📊"
          maxLength={2}
          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl"
        />
        <p className="text-xs text-gray-500 mt-2">
          Optional emoji to display for this department
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Color Theme
        </label>
        <div className="grid grid-cols-4 gap-2">
          {COLOR_THEMES.map((theme) => (
            <button
              key={theme.value}
              type="button"
              onClick={() => setColorTheme(theme.value)}
              className={`px-3 py-2 rounded-lg border-2 transition-all ${
                colorTheme === theme.value
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              } ${theme.bgClass}`}
            >
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-4 h-4 rounded-full ${theme.textClass.replace('text', 'bg')}`} />
                <span className="text-sm font-medium text-gray-700">{theme.label}</span>
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Color theme for this department's visual elements
        </p>
      </div>

      <div className="border-t pt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Preview</h4>
        <div className={`inline-flex items-center space-x-3 px-4 py-3 rounded-lg ${selectedTheme.bgClass}`}>
          {emoji && <span className="text-2xl">{emoji}</span>}
          {iconName && (
            <div className={selectedTheme.textClass}>
              {getIconComponent(iconName)}
            </div>
          )}
          <span className={`font-medium ${selectedTheme.textClass}`}>
            Department Name
          </span>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Visual Settings'}
        </button>
      </div>
    </div>
  )
}
