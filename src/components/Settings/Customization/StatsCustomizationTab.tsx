import React from 'react'
import { CustomizationDraft, CUSTOMIZATION_LIMITS } from '../../../types/organizationCustomization'
import { Eye, EyeOff, RotateCcw, AlertCircle } from 'lucide-react'

interface StatsCustomizationTabProps {
  draft: CustomizationDraft
  updateDraft: (section: any, value: any) => void
}

const StatsCustomizationTab: React.FC<StatsCustomizationTabProps> = ({ draft, updateDraft }) => {
  const handleToggleVisibility = (cardId: string) => {
    const cards = draft.stats_config.cards || []
    const existingCard = cards.find(c => c.id === cardId)

    if (existingCard) {
      updateDraft('stats_config', {
        ...draft.stats_config,
        cards: cards.map(c =>
          c.id === cardId ? { ...c, visible: !(c.visible ?? true) } : c
        )
      })
    } else {
      updateDraft('stats_config', {
        ...draft.stats_config,
        cards: [...cards, { id: cardId, visible: false }]
      })
    }
  }

  const handleLabelChange = (cardId: string, newLabel: string) => {
    const cards = draft.stats_config.cards || []
    const existingCard = cards.find(c => c.id === cardId)

    if (existingCard) {
      updateDraft('stats_config', {
        ...draft.stats_config,
        cards: cards.map(c =>
          c.id === cardId ? { ...c, label: newLabel } : c
        )
      })
    } else {
      updateDraft('stats_config', {
        ...draft.stats_config,
        cards: [...cards, { id: cardId, label: newLabel }]
      })
    }
  }

  const handleResetLabel = (cardId: string) => {
    const cards = draft.stats_config.cards || []
    const existingCard = cards.find(c => c.id === cardId)

    if (existingCard) {
      const updatedCard = { ...existingCard }
      delete updatedCard.label

      updateDraft('stats_config', {
        ...draft.stats_config,
        cards: cards.map(c => c.id === cardId ? updatedCard : c)
      })
    }
  }

  const handleResetAllLabels = () => {
    if (window.confirm('Are you sure you want to reset all stat card labels to their defaults?')) {
      const cards = draft.stats_config.cards || []
      updateDraft('stats_config', {
        ...draft.stats_config,
        cards: cards.map(c => {
          const updated = { ...c }
          delete updated.label
          return updated
        })
      })
    }
  }

  const isVisible = (cardId: string) => {
    const card = draft.stats_config.cards?.find(c => c.id === cardId)
    return card?.visible ?? true
  }

  const getCustomLabel = (cardId: string) => {
    const card = draft.stats_config.cards?.find(c => c.id === cardId)
    return card?.label || ''
  }

  const hasCustomLabel = (cardId: string) => {
    const card = draft.stats_config.cards?.find(c => c.id === cardId)
    return !!card?.label
  }

  const defaultStats = [
    { id: 'total-documents', label: 'Total Documents' },
    { id: 'member-records', label: 'Member Records' },
    { id: 'expiring-soon', label: 'Expiring Soon' },
    { id: 'overdue', label: 'Overdue' }
  ]

  const getDisplayLabel = (stat: typeof defaultStats[0]) => {
    const customLabel = getCustomLabel(stat.id)
    return customLabel || stat.label
  }

  const getLabelLength = (cardId: string) => {
    const customLabel = getCustomLabel(cardId)
    return customLabel.length
  }

  const isLabelTooLong = (cardId: string) => {
    return getLabelLength(cardId) > CUSTOMIZATION_LIMITS.STAT_LABEL_MAX_LENGTH
  }

  const isApproachingLimit = (cardId: string) => {
    const length = getLabelLength(cardId)
    const limit = CUSTOMIZATION_LIMITS.STAT_LABEL_MAX_LENGTH
    return length >= limit * 0.9 && length <= limit
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Stats Cards Configuration</h2>
          <p className="text-sm text-gray-600">
            Customize the labels and visibility of stat cards on the dashboard.
          </p>
        </div>
        <button
          onClick={handleResetAllLabels}
          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset All Labels</span>
        </button>
      </div>

      <div className="space-y-4">
        {defaultStats.map((stat) => {
          const visible = isVisible(stat.id)
          const customLabel = getCustomLabel(stat.id)
          const hasCustom = hasCustomLabel(stat.id)
          const length = getLabelLength(stat.id)
          const tooLong = isLabelTooLong(stat.id)
          const approaching = isApproachingLimit(stat.id)

          return (
            <div key={stat.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${visible ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {visible ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {stat.label}
                      {hasCustom && (
                        <span className="ml-2 text-xs text-blue-600 font-normal">(customized)</span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-500">ID: {stat.id}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleVisibility(stat.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    visible ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      visible ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Custom Label
                  </label>
                  {hasCustom && (
                    <button
                      onClick={() => handleResetLabel(stat.id)}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => handleLabelChange(stat.id, e.target.value)}
                  placeholder={stat.label}
                  maxLength={CUSTOMIZATION_LIMITS.STAT_LABEL_MAX_LENGTH}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    tooLong ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {customLabel ? 'Custom label will override the default' : 'Leave empty to use default label'}
                  </p>
                  <span className={`text-xs ${
                    tooLong ? 'text-red-600 font-medium' :
                    approaching ? 'text-yellow-600' :
                    'text-gray-400'
                  }`}>
                    {length}/{CUSTOMIZATION_LIMITS.STAT_LABEL_MAX_LENGTH}
                  </span>
                </div>
                {tooLong && (
                  <div className="flex items-start space-x-2 text-red-600 text-xs">
                    <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>Label exceeds maximum length</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Preview</h3>
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {defaultStats.filter(stat => isVisible(stat.id)).map((stat) => {
              const displayLabel = getDisplayLabel(stat)
              return (
                <div key={stat.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{displayLabel}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {defaultStats.filter(stat => isVisible(stat.id)).length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No visible stat cards. Enable at least one card to see the preview.
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <p className="text-sm text-blue-800">
          Changes to stat card labels and visibility will take effect immediately after saving.
          Custom labels will override the default labels on your dashboard.
        </p>
      </div>
    </div>
  )
}

export default StatsCustomizationTab
