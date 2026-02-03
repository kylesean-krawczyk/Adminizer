import React, { useState, useEffect } from 'react'
import { useVertical } from '../../contexts/VerticalContext'
import { useUserManagement } from '../../hooks'
import { useFeatureFlags } from '../../contexts/FeatureFlagContext'
import { getAllFeatures } from '../../config/features'
import { FeatureFlagService } from '../../services/featureFlagService'
import { FeatureFlag } from '../../types/features'
import { Check, X, Lock, Unlock, Clock, AlertCircle } from 'lucide-react'

const FeatureFlagsSettings: React.FC = () => {
  const { verticalId } = useVertical()
  const { userProfile } = useUserManagement()
  const { overrides, refreshFeatures } = useFeatureFlags()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [localOverrides, setLocalOverrides] = useState<Record<string, boolean>>({})

  const isMasterAdmin = userProfile?.role === 'master_admin'
  const allFeatures = getAllFeatures()

  useEffect(() => {
    setLocalOverrides(overrides)
  }, [overrides])

  const handleToggle = (featureId: string, currentValue: boolean) => {
    if (!isMasterAdmin) return

    setLocalOverrides(prev => ({
      ...prev,
      [featureId]: !currentValue
    }))
  }

  const handleRemoveOverride = (featureId: string) => {
    if (!isMasterAdmin) return

    setLocalOverrides(prev => {
      const updated = { ...prev }
      delete updated[featureId]
      return updated
    })
  }

  const handleSave = async () => {
    if (!isMasterAdmin || !userProfile?.organization_id) return

    setSaving(true)
    setMessage(null)

    try {
      const changedFeatures = Object.keys(localOverrides).filter(
        key => localOverrides[key] !== overrides[key]
      )

      for (const featureId of changedFeatures) {
        if (localOverrides[featureId] === undefined) {
          await FeatureFlagService.removeFeatureOverride(
            userProfile.organization_id,
            featureId,
            userProfile.id
          )
        } else {
          await FeatureFlagService.setFeatureOverride(
            userProfile.organization_id,
            featureId,
            localOverrides[featureId],
            userProfile.id
          )
        }
      }

      await refreshFeatures()
      setMessage({ type: 'success', text: 'Feature flags updated successfully' })
    } catch (error) {
      console.error('Error saving feature flags:', error)
      setMessage({ type: 'error', text: 'Failed to save feature flags' })
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = JSON.stringify(localOverrides) !== JSON.stringify(overrides)

  const getFeatureStatus = (feature: FeatureFlag) => {
    const isInVertical = feature.allowedVerticals.includes(verticalId)
    const hasOverride = localOverrides[feature.id] !== undefined
    const overrideValue = localOverrides[feature.id]
    const defaultEnabled = feature.enabled && isInVertical

    if (hasOverride) {
      return {
        enabled: overrideValue,
        source: 'override' as const,
        label: overrideValue ? 'Enabled (Override)' : 'Disabled (Override)'
      }
    }

    if (!isInVertical) {
      return {
        enabled: false,
        source: 'vertical' as const,
        label: 'Not Available (Vertical)'
      }
    }

    return {
      enabled: defaultEnabled,
      source: 'default' as const,
      label: defaultEnabled ? 'Enabled (Default)' : 'Disabled (Default)'
    }
  }

  if (!isMasterAdmin) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 text-yellow-600 mb-4">
          <Lock className="h-6 w-6" />
          <h2 className="text-xl font-semibold">Feature Flags Management</h2>
        </div>
        <p className="text-gray-600">
          Only master administrators can manage feature flags. Contact your system administrator for access.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <Unlock className="h-6 w-6 text-blue-600" />
              <span>Feature Flags Management</span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Control which features are available for testing and development. Current vertical: <strong>{verticalId}</strong>
            </p>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {allFeatures.map(feature => {
              const status = getFeatureStatus(feature)
              const isInVertical = feature.allowedVerticals.includes(verticalId)
              const hasOverride = localOverrides[feature.id] !== undefined

              return (
                <div
                  key={feature.id}
                  className={`border rounded-lg p-4 ${!isInVertical ? 'bg-gray-50' : 'bg-white'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{feature.name}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          status.enabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {status.enabled ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                          {status.label}
                        </span>
                        {feature.category && (
                          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                            {feature.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Verticals: {feature.allowedVerticals.join(', ')}</span>
                        {feature.requiredRole && <span>Role: {feature.requiredRole}</span>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {hasOverride && (
                        <button
                          onClick={() => handleRemoveOverride(feature.id)}
                          className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Reset
                        </button>
                      )}
                      <button
                        onClick={() => handleToggle(feature.id, status.enabled)}
                        disabled={!isInVertical && !hasOverride}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          status.enabled ? 'bg-blue-600' : 'bg-gray-300'
                        } ${!isInVertical && !hasOverride ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            status.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {hasChanges && (
          <div className="mt-6 flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 text-blue-800">
              <Clock className="h-5 w-5" />
              <span className="font-medium">You have unsaved changes</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setLocalOverrides(overrides)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About Feature Flags</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Feature flags control which capabilities are available in your vertical</li>
              <li>Overrides allow you to enable or disable features for testing purposes</li>
              <li>Changes apply immediately after saving and affect all users in your organization</li>
              <li>Features restricted by vertical cannot be enabled without an override</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeatureFlagsSettings
