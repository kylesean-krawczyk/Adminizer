import React from 'react'
import { CustomizationDraft } from '../../../types/organizationCustomization'
import { RotateCcw } from 'lucide-react'

interface DashboardCustomizationTabProps {
  draft: CustomizationDraft
  updateDraft: (section: any, value: any) => void
}

const DashboardCustomizationTab: React.FC<DashboardCustomizationTabProps> = ({ draft, updateDraft }) => {
  const handleChange = (field: string, value: string) => {
    updateDraft('dashboard_config', {
      ...draft.dashboard_config,
      [field]: value
    })
  }

  const resetField = (field: keyof typeof draft.dashboard_config) => {
    const config = { ...draft.dashboard_config }
    delete config[field]
    updateDraft('dashboard_config', config)
  }

  const config = draft.dashboard_config

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Dashboard Configuration</h2>
        <p className="text-sm text-gray-600 mb-6">
          Customize the dashboard titles and section headings shown to users in your organization.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Dashboard Title
            </label>
            <button
              onClick={() => resetField('title')}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
          <input
            type="text"
            value={config.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g., Church Ministries"
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500">Main title shown at the top of the dashboard</p>
            <span className="text-xs text-gray-400">{(config.title || '').length}/100</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Dashboard Subtitle
            </label>
            <button
              onClick={() => resetField('subtitle')}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
          <input
            type="text"
            value={config.subtitle || ''}
            onChange={(e) => handleChange('subtitle', e.target.value)}
            placeholder="e.g., Access your ministry-specific tools and resources"
            maxLength={200}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500">Descriptive subtitle under the main title</p>
            <span className="text-xs text-gray-400">{(config.subtitle || '').length}/200</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Core Section Title
            </label>
            <button
              onClick={() => resetField('coreSectionTitle')}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
          <input
            type="text"
            value={config.coreSectionTitle || ''}
            onChange={(e) => handleChange('coreSectionTitle', e.target.value)}
            placeholder="e.g., Core Ministries"
            maxLength={50}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500">Title for the core departments section</p>
            <span className="text-xs text-gray-400">{(config.coreSectionTitle || '').length}/50</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Additional Section Title
            </label>
            <button
              onClick={() => resetField('additionalSectionTitle')}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
          <input
            type="text"
            value={config.additionalSectionTitle || ''}
            onChange={(e) => handleChange('additionalSectionTitle', e.target.value)}
            placeholder="e.g., Additional Ministries"
            maxLength={50}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500">Title for the additional departments section</p>
            <span className="text-xs text-gray-400">{(config.additionalSectionTitle || '').length}/50</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Preview</h3>
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {config.title || 'Dashboard Title'}
            </h2>
            <p className="text-gray-600 mt-1">
              {config.subtitle || 'Dashboard subtitle will appear here'}
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {config.coreSectionTitle || 'Core Section'}
                </h3>
                <div className="bg-gray-100 rounded p-4 text-sm text-gray-500">
                  Core departments will appear here
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {config.additionalSectionTitle || 'Additional Section'}
                </h3>
                <div className="bg-gray-100 rounded p-4 text-sm text-gray-500">
                  Additional departments will appear here
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardCustomizationTab
