import React from 'react'
import { CustomizationDraft } from '../../../types/organizationCustomization'
import { Eye, EyeOff } from 'lucide-react'

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

  const isVisible = (cardId: string) => {
    const card = draft.stats_config.cards?.find(c => c.id === cardId)
    return card?.visible ?? true
  }

  const defaultStats = [
    { id: 'total-documents', label: 'Total Documents' },
    { id: 'member-records', label: 'Member Records' },
    { id: 'expiring-soon', label: 'Expiring Soon' },
    { id: 'overdue', label: 'Overdue' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Stats Cards Configuration</h2>
        <p className="text-sm text-gray-600 mb-6">
          Show or hide stat cards on the dashboard. At least one card must remain visible.
        </p>
      </div>

      <div className="space-y-3">
        {defaultStats.map((stat) => {
          const visible = isVisible(stat.id)
          return (
            <div key={stat.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${visible ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {visible ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{stat.label}</h4>
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
            </div>
          )
        })}
      </div>

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <p className="text-sm text-blue-800">
          Note: Changes to stat card visibility will take effect immediately after saving.
          The actual data displayed in each card is determined by your organization's documents and activities.
        </p>
      </div>
    </div>
  )
}

export default StatsCustomizationTab
