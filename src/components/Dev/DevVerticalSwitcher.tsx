import React, { useState, useEffect } from 'react'
import { Settings, Check, ChevronDown, Wrench, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useVertical } from '../../contexts/VerticalContext'
import { useVerticalSwitcher } from '../../hooks/useVerticalSwitcher'
import { useUserManagement } from '../../hooks'
import { VerticalId } from '../../config/types'

const isDevelopmentMode = import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV

const verticalLabels: Record<VerticalId, string> = {
  church: 'Church',
  business: 'Business',
  estate: 'Estate Planning'
}

const verticalIcons: Record<VerticalId, string> = {
  church: '⛪',
  business: '🏢',
  estate: '📜'
}

const DevVerticalSwitcher: React.FC = () => {
  const { verticalId } = useVertical()
  const { userProfile } = useUserManagement()
  const { switchVertical, getEnabledVerticals, isVerticalEnabled, state } = useVerticalSwitcher()
  const [showDropdown, setShowDropdown] = useState(false)
  const [enabledVerticals, setEnabledVerticals] = useState<VerticalId[]>(['church', 'business', 'estate'])

  useEffect(() => {
    const loadEnabledVerticals = async () => {
      const enabled = await getEnabledVerticals()
      setEnabledVerticals(enabled)
    }
    loadEnabledVerticals()
  }, [getEnabledVerticals])

  if (!isDevelopmentMode) return null

  const handleSwitch = async (vertical: VerticalId) => {
    if (vertical === verticalId) {
      setShowDropdown(false)
      return
    }

    if (!isVerticalEnabled(vertical, enabledVerticals)) {
      alert(`${verticalLabels[vertical]} vertical is not enabled for your organization`)
      return
    }

    try {
      await switchVertical(vertical)
      setShowDropdown(false)
    } catch (error) {
      console.error('Failed to switch vertical:', error)
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 text-center text-sm font-medium shadow-lg">
      <div className="flex items-center justify-center space-x-4">
        <Settings className="h-4 w-4" />
        <span>Development Mode</span>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1 rounded-md"
            disabled={state.loading}
          >
            <span>{verticalIcons[verticalId]}</span>
            <span>{verticalLabels[verticalId]}</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                {(['church', 'business', 'estate'] as VerticalId[]).map((vertical) => {
                  const enabled = isVerticalEnabled(vertical, enabledVerticals)
                  const isCurrent = vertical === verticalId

                  return (
                    <button
                      key={vertical}
                      onClick={() => handleSwitch(vertical)}
                      disabled={!enabled || state.loading}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left transition-colors ${
                        !enabled
                          ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                          : isCurrent
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{verticalIcons[vertical]}</span>
                        <span>{verticalLabels[vertical]}</span>
                      </div>
                      {isCurrent && <Check className="h-4 w-4 text-blue-600" />}
                      {!enabled && (
                        <span className="text-xs text-gray-400">(Disabled)</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <div className="text-xs opacity-75">
          Press Ctrl+Shift+V to cycle verticals
        </div>

        {userProfile?.role === 'master_admin' && (
          <div className="flex items-center gap-2 ml-4 border-l border-white/30 pl-4">
            <Link
              to="/dev/tool-registry"
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1 rounded-md text-xs"
            >
              <Wrench className="h-3 w-3" />
              Tool Registry
            </Link>
            <Link
              to="/dev/tool-logs"
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1 rounded-md text-xs"
            >
              <Calendar className="h-3 w-3" />
              Tool Logs
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default DevVerticalSwitcher
