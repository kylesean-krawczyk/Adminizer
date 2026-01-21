import React, { useState } from 'react'
import { Palette, RotateCcw, Save } from 'lucide-react'
import { useCustomBranding } from '../../hooks/useCustomBranding'
import LogoUpload from '../Navigation/LogoUpload'
import CustomLogo from '../Navigation/CustomLogo'

const BrandingSettings: React.FC = () => {
  const { 
    branding, 
    updateLogo, 
    updatePrimaryColor, 
    updateSecondaryColor, 
    updateOrganizationName,
    resetBranding 
  } = useCustomBranding()

  const [tempOrgName, setTempOrgName] = useState(branding.organizationName || '')
  const [tempPrimaryColor, setTempPrimaryColor] = useState(branding.primaryColor || '#3b82f6')
  const [tempSecondaryColor, setTempSecondaryColor] = useState(branding.secondaryColor || '#64748b')

  const handleSave = () => {
    updateOrganizationName(tempOrgName || null)
    updatePrimaryColor(tempPrimaryColor)
    updateSecondaryColor(tempSecondaryColor)
    alert('Branding settings saved successfully!')
  }

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all branding customizations?')) {
      resetBranding()
      setTempOrgName('')
      setTempPrimaryColor('#3b82f6')
      setTempSecondaryColor('#64748b')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Palette className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Branding Settings</h2>
            <p className="text-sm text-gray-600">Customize your organization's appearance</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset All</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Logo Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Logo</h3>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Current Logo</h4>
                <p className="text-xs text-gray-500">SVG format recommended, max 1MB</p>
              </div>
              <LogoUpload 
                currentLogo={branding.logo}
                onLogoChange={updateLogo}
                isAdmin={true}
              />
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center min-h-[60px]">
              {branding.logo ? (
                <CustomLogo logoUrl={branding.logo} />
              ) : (
                <div className="text-gray-400 text-sm">No logo uploaded</div>
              )}
            </div>
          </div>
        </div>

        {/* Organization Name */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Name</h3>
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={tempOrgName}
              onChange={(e) => setTempOrgName(e.target.value)}
              placeholder="Enter organization name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              This name will be displayed throughout the application
            </p>
          </div>
        </div>

        {/* Color Scheme */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Color Scheme</h3>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={tempPrimaryColor}
                    onChange={(e) => setTempPrimaryColor(e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tempPrimaryColor}
                    onChange={(e) => setTempPrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={tempSecondaryColor}
                    onChange={(e) => setTempSecondaryColor(e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tempSecondaryColor}
                    onChange={(e) => setTempSecondaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center space-x-4 mb-4">
                {branding.logo ? (
                  <CustomLogo logoUrl={branding.logo} />
                ) : (
                  <div className="text-xl font-bold" style={{ color: tempPrimaryColor }}>
                    {tempOrgName || 'Adminizer'}
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <div 
                  className="px-4 py-2 rounded-lg text-white text-sm"
                  style={{ backgroundColor: tempPrimaryColor }}
                >
                  Primary Button
                </div>
                <div 
                  className="px-4 py-2 rounded-lg text-white text-sm"
                  style={{ backgroundColor: tempSecondaryColor }}
                >
                  Secondary Button
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default BrandingSettings