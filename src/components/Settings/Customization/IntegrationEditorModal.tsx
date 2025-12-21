import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { DepartmentIntegration, IconName } from '../../../types/departmentLandingPage'
import { IconPicker } from './IconPicker'

interface IntegrationEditorModalProps {
  integration: DepartmentIntegration | null
  onSave: (data: {
    id?: string
    name: string
    description?: string
    icon: string
    logoUrl?: string
    badges: string[]
    features: string[]
    oauthEnabled: boolean
    oauthProvider?: string
    externalLink?: string
    status: 'active' | 'inactive' | 'pending'
    displayOrder: number
  }) => Promise<void>
  onCancel: () => void
  existingOrders: number[]
}

export const IntegrationEditorModal: React.FC<IntegrationEditorModalProps> = ({
  integration,
  onSave,
  onCancel,
  existingOrders
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState<string>('Plug')
  const [logoUrl, setLogoUrl] = useState('')
  const [badges, setBadges] = useState<string[]>([])
  const [newBadge, setNewBadge] = useState('')
  const [features, setFeatures] = useState<string[]>([])
  const [newFeature, setNewFeature] = useState('')
  const [oauthEnabled, setOauthEnabled] = useState(false)
  const [oauthProvider, setOauthProvider] = useState('')
  const [externalLink, setExternalLink] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive' | 'pending'>('active')
  const [displayOrder, setDisplayOrder] = useState(0)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (integration) {
      console.log('[IntegrationEditorModal] 📝 Editing integration:', integration.name)
      setName(integration.name)
      setDescription(integration.description || '')
      setIcon(integration.icon)
      setLogoUrl(integration.logo_url || '')
      setBadges(integration.badges || [])
      setFeatures(integration.features || [])
      setOauthEnabled(integration.oauth_enabled)
      setOauthProvider(integration.oauth_provider || '')
      setExternalLink(integration.external_link || '')
      setStatus(integration.status)
      setDisplayOrder(integration.display_order)
    } else {
      const nextOrder = Math.max(-1, ...existingOrders) + 1
      setDisplayOrder(nextOrder)
    }
  }, [integration, existingOrders])

  const handleAddBadge = () => {
    if (newBadge.trim() && !badges.includes(newBadge.trim())) {
      setBadges([...badges, newBadge.trim()])
      setNewBadge('')
    }
  }

  const handleRemoveBadge = (index: number) => {
    setBadges(badges.filter((_, i) => i !== index))
  }

  const handleAddFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures([...features, newFeature.trim()])
      setNewFeature('')
    }
  }

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert('Integration name is required')
      return
    }

    console.log('[IntegrationEditorModal] 💾 Saving integration:', name)
    setSaving(true)

    try {
      await onSave({
        id: integration?.id,
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        logoUrl: logoUrl.trim() || undefined,
        badges,
        features,
        oauthEnabled,
        oauthProvider: oauthProvider.trim() || undefined,
        externalLink: externalLink.trim() || undefined,
        status,
        displayOrder
      })
    } finally {
      setSaving(false)
    }
  }

  const commonBadges = ['Popular', 'OAuth Required', 'Premium', 'Beta', 'New', 'Recommended', 'Enterprise']

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {integration ? 'Edit Integration' : 'Add Integration'}
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
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Integration Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Salesforce, BambooHR"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of the integration..."
            />
          </div>

          {/* Icon and Logo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon
              </label>
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
              >
                {icon}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo URL (optional)
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Badges */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Badges
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {badges.map((badge, index) => (
                <span
                  key={index}
                  className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  <span>{badge}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBadge(index)}
                    className="hover:text-blue-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBadge}
                onChange={(e) => setNewBadge(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBadge())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add badge..."
              />
              <button
                type="button"
                onClick={handleAddBadge}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {commonBadges.filter(b => !badges.includes(b)).map(badge => (
                <button
                  key={badge}
                  type="button"
                  onClick={() => setBadges([...badges, badge])}
                  className="px-2 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50"
                >
                  + {badge}
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Features
            </label>
            <div className="space-y-2 mb-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">
                    {feature}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add feature..."
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* OAuth Configuration */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="oauthEnabled"
                checked={oauthEnabled}
                onChange={(e) => setOauthEnabled(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="oauthEnabled" className="text-sm font-medium text-gray-700">
                OAuth Enabled
              </label>
            </div>
            {oauthEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OAuth Provider
                </label>
                <input
                  type="text"
                  value={oauthProvider}
                  onChange={(e) => setOauthProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., salesforce, google, microsoft"
                />
              </div>
            )}
          </div>

          {/* External Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              External Link
            </label>
            <input
              type="url"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://..."
            />
          </div>

          {/* Status and Display Order */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Order
              </label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
            </div>
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
            {saving ? 'Saving...' : 'Save Integration'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default IntegrationEditorModal
