import React, { useState } from 'react'
import { X, ArrowRight, AlertCircle } from 'lucide-react'
import { VerticalId } from '../../config/types'
import { useVerticalSwitcher } from '../../hooks/useVerticalSwitcher'

interface VerticalSwitchModalProps {
  fromVertical: VerticalId
  toVertical: VerticalId
  onConfirm: () => void
  onCancel: () => void
}

const verticalLabels: Record<VerticalId, string> = {
  church: 'Church Management',
  business: 'Business Operations',
  estate: 'Estate Planning'
}

const terminologyChanges: Record<VerticalId, Record<string, string>> = {
  church: {
    members: 'Members',
    revenue: 'Tithes & Offerings',
    departments: 'Ministries',
    customers: 'Members',
    team: 'Ministry Team'
  },
  business: {
    members: 'Employees',
    revenue: 'Revenue',
    departments: 'Departments',
    customers: 'Customers',
    team: 'Team'
  },
  estate: {
    members: 'Clients',
    revenue: 'Billable Hours',
    departments: 'Practice Areas',
    customers: 'Clients',
    team: 'Associates'
  }
}

const VerticalSwitchModal: React.FC<VerticalSwitchModalProps> = ({
  fromVertical,
  toVertical,
  onConfirm,
  onCancel
}) => {
  const { switchVertical, state } = useVerticalSwitcher()
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await switchVertical(toVertical)
      onConfirm()
    } catch (error) {
      console.error('Failed to switch vertical:', error)
      setIsLoading(false)
    }
  }

  const fromTerms = terminologyChanges[fromVertical]
  const toTerms = terminologyChanges[toVertical]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Confirm Vertical Switch
          </h3>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Current</div>
              <div className="text-lg font-semibold text-gray-900">
                {verticalLabels[fromVertical]}
              </div>
            </div>
            <ArrowRight className="h-6 w-6 text-gray-400" />
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Switching to</div>
              <div className="text-lg font-semibold text-blue-600">
                {verticalLabels[toVertical]}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">What will change:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Terminology throughout the application</li>
                  <li>Navigation labels and menu items</li>
                  <li>Department names and categories</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Terminology Changes:
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left pb-2 text-gray-600">Category</th>
                    <th className="text-left pb-2 text-gray-600">Current</th>
                    <th className="text-center pb-2"></th>
                    <th className="text-left pb-2 text-gray-600">New</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.keys(fromTerms).map((key) => (
                    <tr key={key}>
                      <td className="py-2 text-gray-500 capitalize">{key}</td>
                      <td className="py-2 text-gray-900">{fromTerms[key]}</td>
                      <td className="py-2 text-center">
                        <ArrowRight className="h-4 w-4 text-gray-400 mx-auto" />
                      </td>
                      <td className="py-2 text-blue-600 font-medium">{toTerms[key]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-semibold mb-1">What stays the same:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>All your documents and files</li>
                  <li>User accounts and permissions</li>
                  <li>Branding and custom logos</li>
                  <li>Integration connections</li>
                  <li>All your data and settings</li>
                </ul>
              </div>
            </div>
          </div>

          {state.error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{state.error}</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-200">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Switching...</span>
              </>
            ) : (
              <span>Switch Now</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default VerticalSwitchModal
