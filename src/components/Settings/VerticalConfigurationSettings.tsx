import React, { useState, useEffect } from 'react'
import { Check, Building2, Church, FileText, Loader2 } from 'lucide-react'
import { useVertical } from '../../contexts/VerticalContext'
import { useVerticalSwitcher } from '../../hooks/useVerticalSwitcher'
import { VerticalId } from '../../config/types'
import VerticalSwitchModal from './VerticalSwitchModal'

interface VerticalOption {
  id: VerticalId
  name: string
  description: string
  icon: React.ReactNode
  terminology: { label: string; value: string }[]
}

const verticalOptions: VerticalOption[] = [
  {
    id: 'church',
    name: 'Church Management',
    description: 'Optimized for faith-based organizations, churches, and ministries',
    icon: <Church className="h-12 w-12 text-purple-600" />,
    terminology: [
      { label: 'Members', value: 'Congregation members' },
      { label: 'Revenue', value: 'Tithes & Offerings' },
      { label: 'Departments', value: 'Ministries' }
    ]
  },
  {
    id: 'business',
    name: 'Business Operations',
    description: 'Designed for standard business operations and commercial organizations',
    icon: <Building2 className="h-12 w-12 text-blue-600" />,
    terminology: [
      { label: 'Members', value: 'Employees' },
      { label: 'Revenue', value: 'Revenue' },
      { label: 'Departments', value: 'Departments' }
    ]
  },
  {
    id: 'estate',
    name: 'Estate Planning',
    description: 'Tailored for estate planning professionals and legal services',
    icon: <FileText className="h-12 w-12 text-green-600" />,
    terminology: [
      { label: 'Members', value: 'Clients' },
      { label: 'Revenue', value: 'Billable Hours' },
      { label: 'Departments', value: 'Practice Areas' }
    ]
  }
]

const VerticalConfigurationSettings: React.FC = () => {
  const { verticalId } = useVertical()
  const { getEnabledVerticals, isVerticalEnabled, state } = useVerticalSwitcher()
  const [enabledVerticals, setEnabledVerticals] = useState<VerticalId[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedVertical, setSelectedVertical] = useState<VerticalId | null>(null)

  useEffect(() => {
    const loadEnabledVerticals = async () => {
      setLoading(true)
      try {
        const enabled = await getEnabledVerticals()
        setEnabledVerticals(enabled)
      } catch (error) {
        console.error('Failed to load enabled verticals:', error)
      } finally {
        setLoading(false)
      }
    }
    loadEnabledVerticals()
  }, [getEnabledVerticals])

  const handleSwitchClick = (vertical: VerticalId) => {
    if (vertical === verticalId) return
    setSelectedVertical(vertical)
    setShowModal(true)
  }

  const handleConfirmSwitch = () => {
    setShowModal(false)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vertical Configuration</h3>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Vertical Configuration</h3>
          <p className="mt-1 text-sm text-gray-600">
            Choose the vertical that best fits your organization. This changes terminology and features throughout the application.
          </p>
        </div>

        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-3">
            {verticalOptions.map((option) => {
              const isCurrent = option.id === verticalId
              const enabled = isVerticalEnabled(option.id, enabledVerticals)

              return (
                <div
                  key={option.id}
                  className={`relative rounded-lg border-2 p-6 transition-all ${
                    isCurrent
                      ? 'border-blue-600 bg-blue-50'
                      : enabled
                      ? 'border-gray-200 hover:border-gray-300 bg-white'
                      : 'border-gray-100 bg-gray-50 opacity-60'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute top-4 right-4">
                      <div className="bg-blue-600 text-white rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4">{option.icon}</div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {option.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">{option.description}</p>

                    <div className="w-full border-t border-gray-200 pt-4 mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        Terminology Examples:
                      </p>
                      <ul className="space-y-1 text-xs text-gray-600">
                        {option.terminology.map((term, idx) => (
                          <li key={idx}>
                            <span className="font-medium">{term.label}:</span> {term.value}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {!enabled ? (
                      <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-md">
                        Contact your account manager to enable this vertical
                      </div>
                    ) : isCurrent ? (
                      <div className="text-sm font-medium text-blue-600">
                        Currently Active
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSwitchClick(option.id)}
                        disabled={state.loading}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {state.loading ? 'Switching...' : 'Switch to This Vertical'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {enabledVerticals.length < 3 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Note:</span> Your organization has access to{' '}
                {enabledVerticals.length} vertical{enabledVerticals.length !== 1 ? 's' : ''}.
                Contact your account manager to enable additional verticals.
              </p>
            </div>
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

export default VerticalConfigurationSettings
