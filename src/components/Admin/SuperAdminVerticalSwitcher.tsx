import React, { useState, useEffect } from 'react'
import { Check, ChevronDown, Church, Building2, FileText } from 'lucide-react'
import { useVertical } from '../../contexts/VerticalContext'
import { useVerticalSwitcher } from '../../hooks/useVerticalSwitcher'
import { VerticalId } from '../../config/types'
import VerticalSwitchModal from '../Settings/VerticalSwitchModal'

const verticalConfig = {
  church: {
    name: 'Church',
    icon: Church,
    color: 'text-purple-200'
  },
  business: {
    name: 'Business',
    icon: Building2,
    color: 'text-blue-200'
  },
  estate: {
    name: 'Estate Planning',
    icon: FileText,
    color: 'text-green-200'
  }
}

const SuperAdminVerticalSwitcher: React.FC = () => {
  const { verticalId } = useVertical()
  const { switchVertical, getEnabledVerticals, isVerticalEnabled, state } = useVerticalSwitcher()
  const [showDropdown, setShowDropdown] = useState(false)
  const [enabledVerticals, setEnabledVerticals] = useState<VerticalId[]>(['church', 'business', 'estate'])
  const [showModal, setShowModal] = useState(false)
  const [selectedVertical, setSelectedVertical] = useState<VerticalId | null>(null)

  useEffect(() => {
    const loadEnabledVerticals = async () => {
      const enabled = await getEnabledVerticals()
      setEnabledVerticals(enabled)
    }
    loadEnabledVerticals()
  }, [getEnabledVerticals])

  const handleSwitch = (vertical: VerticalId) => {
    if (vertical === verticalId) {
      setShowDropdown(false)
      return
    }

    if (!isVerticalEnabled(vertical, enabledVerticals)) {
      alert(`${verticalConfig[vertical].name} vertical is not enabled for your organization`)
      setShowDropdown(false)
      return
    }

    setSelectedVertical(vertical)
    setShowModal(true)
    setShowDropdown(false)
  }

  const handleConfirmSwitch = async () => {
    if (!selectedVertical) return

    try {
      await switchVertical(selectedVertical)
      setShowModal(false)
    } catch (error) {
      console.error('Failed to switch vertical:', error)
    }
  }

  const currentVertical = verticalConfig[verticalId]
  const CurrentIcon = currentVertical.icon

  return (
    <>
      <div className="flex items-center space-x-2 border-l border-white/30 pl-4">
        <span className="text-purple-100 text-sm font-medium">Active Vertical:</span>
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-lg"
            disabled={state.loading}
          >
            <CurrentIcon className="h-4 w-4 text-white" />
            <span className="text-white font-medium">{currentVertical.name}</span>
            <ChevronDown className={`h-4 w-4 text-white transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase">Switch Vertical</p>
                </div>
                {(['church', 'business', 'estate'] as VerticalId[]).map((vertical) => {
                  const config = verticalConfig[vertical]
                  const Icon = config.icon
                  const enabled = isVerticalEnabled(vertical, enabledVerticals)
                  const isCurrent = vertical === verticalId

                  return (
                    <button
                      key={vertical}
                      onClick={() => handleSwitch(vertical)}
                      disabled={!enabled || state.loading}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors ${
                        !enabled
                          ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                          : isCurrent
                          ? 'bg-purple-50 text-purple-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-5 w-5 ${
                          isCurrent ? 'text-purple-600' : enabled ? 'text-gray-600' : 'text-gray-300'
                        }`} />
                        <div>
                          <div className="font-medium">{config.name}</div>
                          {!enabled && (
                            <div className="text-xs text-gray-400">Not enabled</div>
                          )}
                        </div>
                      </div>
                      {isCurrent && <Check className="h-5 w-5 text-purple-600" />}
                    </button>
                  )
                })}
                <div className="px-4 py-2 border-t border-gray-200 mt-2">
                  <p className="text-xs text-gray-500">
                    Switching verticals will update terminology and navigation throughout the app.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showModal && selectedVertical && (
        <VerticalSwitchModal
          fromVertical={verticalId}
          toVertical={selectedVertical}
          onConfirm={handleConfirmSwitch}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  )
}

export default SuperAdminVerticalSwitcher
