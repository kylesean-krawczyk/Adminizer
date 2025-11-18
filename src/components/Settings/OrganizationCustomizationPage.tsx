import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, RotateCcw, Download, Upload, AlertCircle } from 'lucide-react'
import { useUserManagement } from '../../hooks'
import { useOrganizationCustomization } from '../../hooks/useOrganizationCustomization'
import { VerticalId } from '../../config/types'
import DashboardCustomizationTab from './Customization/DashboardCustomizationTab'
import StatsCustomizationTab from './Customization/StatsCustomizationTab'
import DepartmentCustomizationTab from './Customization/DepartmentCustomizationTab'
import BrandingCustomizationTab from './Customization/BrandingCustomizationTab'
import VersionHistoryPanel from './Customization/VersionHistoryPanel'

const OrganizationCustomizationPage: React.FC = () => {
  const navigate = useNavigate()
  const { userProfile, organization, loading: userLoading } = useUserManagement()

  const [activeTab, setActiveTab] = useState<'dashboard' | 'stats' | 'departments' | 'branding' | 'history'>('dashboard')

  console.log('[OrganizationCustomizationPage] Render state:', {
    userProfile: userProfile ? { id: userProfile.id, role: userProfile.role, email: userProfile.email } : null,
    organization: organization ? { id: organization.id, name: organization.name } : null,
    userLoading
  })

  // CRITICAL: All hooks must be called before any conditional returns
  // This prevents React Error #310: "Rendered more hooks than during the previous render"
  const {
    selectedVertical,
    draft,
    loading,
    saving,
    hasUnsavedChanges,
    error: customizationError,
    updateDraft,
    save,
    resetToDefaults,
    discardChanges,
    switchVertical,
    exportConfig,
    importConfig,
    refresh
  } = useOrganizationCustomization({
    organizationId: organization?.id || '',
    initialVerticalId: (userProfile?.active_vertical as VerticalId) || 'church'
  })

  console.log('[OrganizationCustomizationPage] Customization state:', {
    selectedVertical,
    loading,
    saving,
    hasUnsavedChanges,
    customizationError,
    hasDraft: !!draft,
    draftKeys: Object.keys(draft)
  })

  // Show loading state while user data is being fetched
  if (userLoading) {
    console.log('[OrganizationCustomizationPage] Showing user loading state')
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Loading user profile...</p>
        </div>
      </div>
    )
  }

  // Check permissions AFTER all hooks have been called
  if (!userProfile || !organization || userProfile.role !== 'master_admin') {
    console.log('[OrganizationCustomizationPage] Access denied:', {
      hasUserProfile: !!userProfile,
      hasOrganization: !!organization,
      userRole: userProfile?.role
    })
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Access Denied</h3>
              <p className="text-red-700">
                Only master administrators can access organization customization settings.
              </p>
              <button
                onClick={() => navigate('/')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    try {
      await save('Updated customization settings')
      alert('Customization saved successfully!')
      refresh()
    } catch (error) {
      alert('Failed to save customization')
    }
  }

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all customizations to default? This cannot be undone.')) {
      await resetToDefaults()
    }
  }

  const handleExport = async () => {
    try {
      const json = await exportConfig()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `customization-${selectedVertical}-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('Failed to export customization')
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          const text = await file.text()
          await importConfig(text)
          alert('Customization imported successfully!')
          refresh()
        } catch (error) {
          alert('Failed to import customization')
        }
      }
    }
    input.click()
  }

  const handleVerticalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVertical = e.target.value as VerticalId
    const switched = switchVertical(newVertical)
    if (!switched) {
      e.target.value = selectedVertical
    }
  }

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  if (loading) {
    console.log('[OrganizationCustomizationPage] Showing customization loading state')
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Loading customization settings...</p>
        </div>
      </div>
    )
  }

  // Show error message if there was an error loading customization
  if (customizationError) {
    console.error('[OrganizationCustomizationPage] Customization error:', customizationError)
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-1">Error Loading Customization</h3>
              <p className="text-yellow-700 mb-4">{customizationError}</p>
              <button
                onClick={() => refresh()}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  console.log('[OrganizationCustomizationPage] Rendering main content')

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'stats', label: 'Stats Cards' },
    { id: 'departments', label: 'Departments' },
    { id: 'branding', label: 'Branding' },
    { id: 'history', label: 'Version History' }
  ]

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Organization Customization</h1>
              <p className="text-gray-600 mt-1">Customize your organization's appearance and structure</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              <button
                onClick={handleImport}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span>Import</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                Customize settings for:
              </label>
              <select
                value={selectedVertical}
                onChange={handleVerticalChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {organization.enabled_verticals.map((vertical: VerticalId) => (
                  <option key={vertical} value={vertical}>
                    {vertical.charAt(0).toUpperCase() + vertical.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-3">
              {hasUnsavedChanges && (
                <button
                  onClick={discardChanges}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Discard Changes
                </button>
              )}
              <button
                onClick={handleReset}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset to Defaults</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !hasUnsavedChanges}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors ${
                  hasUnsavedChanges && !saving
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>

          {hasUnsavedChanges && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                You have unsaved changes. Remember to save before switching verticals or leaving this page.
              </p>
            </div>
          )}
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'dashboard' && (
            <DashboardCustomizationTab draft={draft} updateDraft={updateDraft} />
          )}
          {activeTab === 'stats' && (
            <StatsCustomizationTab draft={draft} updateDraft={updateDraft} />
          )}
          {activeTab === 'departments' && (
            <DepartmentCustomizationTab draft={draft} updateDraft={updateDraft} />
          )}
          {activeTab === 'branding' && (
            <BrandingCustomizationTab draft={draft} updateDraft={updateDraft} />
          )}
          {activeTab === 'history' && (
            <VersionHistoryPanel
              organizationId={organization.id}
              verticalId={selectedVertical}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default OrganizationCustomizationPage
