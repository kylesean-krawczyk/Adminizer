import React, { useState } from 'react'
import { Upload, X, AlertCircle } from 'lucide-react'
import { CustomizationDraft } from '../../../types/organizationCustomization'
import {
  uploadOrganizationLogo,
  validateLogoUpload,
  formatFileSize,
  getFormatDisplayName,
  isRecommendedFormat,
  LOGO_UPLOAD_CONFIG
} from '../../../services/logoUploadService'
import { useUserManagement } from '../../../hooks'

interface BrandingCustomizationTabProps {
  draft: CustomizationDraft
  updateDraft: (section: any, value: any) => void
}

const BrandingCustomizationTab: React.FC<BrandingCustomizationTabProps> = ({ draft, updateDraft }) => {
  const { organization } = useUserManagement()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileSelect = async (file: File) => {
    if (!organization) return

    setUploadError(null)
    setUploading(true)

    try {
      const validation = await validateLogoUpload(file)

      if (!validation.valid) {
        setUploadError(validation.error || 'Invalid file')
        setUploading(false)
        return
      }

      if (validation.warning) {
        console.warn('Logo upload warning:', validation.warning)
      }

      const logoMetadata = await uploadOrganizationLogo(file, organization.id)

      updateDraft('branding_config', {
        ...draft.branding_config,
        logoUrl: logoMetadata.url,
        logoFormat: logoMetadata.format,
        logoFileSize: logoMetadata.fileSize,
        logoUploadedAt: logoMetadata.uploadedAt
      })
    } catch (error) {
      console.error('Error uploading logo:', error)
      setUploadError(error instanceof Error ? error.message : 'Failed to upload logo')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => {
    setDragActive(false)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const removeLogo = () => {
    updateDraft('branding_config', {
      ...draft.branding_config,
      logoUrl: undefined,
      logoFormat: undefined,
      logoFileSize: undefined,
      logoUploadedAt: undefined
    })
  }

  const config = draft.branding_config

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Branding Configuration</h2>
        <p className="text-sm text-gray-600 mb-6">
          Customize your organization's visual identity with a custom logo and colors.
        </p>
      </div>

      <div>
        <h3 className="text-md font-semibold text-gray-900 mb-3">Organization Logo</h3>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-white'
          }`}
        >
          {config.logoUrl ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <img
                  src={config.logoUrl}
                  alt="Organization logo"
                  className="max-h-32 max-w-full"
                />
              </div>
              <div className="text-sm text-gray-600">
                <p>Format: {getFormatDisplayName(config.logoFormat || '')}</p>
                {config.logoFileSize && <p>Size: {formatFileSize(config.logoFileSize)}</p>}
              </div>
              {config.logoFormat && !isRecommendedFormat(config.logoFormat) && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-800">
                    💡 Tip: SVG format will look sharper at all sizes
                  </p>
                </div>
              )}
              <button
                onClick={removeLogo}
                className="flex items-center space-x-2 mx-auto px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Remove Logo</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-sm text-gray-600">Drag & drop your logo or click to browse</p>
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: SVG for best quality • Max 2MB
                </p>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                  SVG ⭐
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                  PNG
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                  JPG
                </span>
              </div>
              <input
                type="file"
                onChange={handleFileInput}
                accept=".svg,.png,.jpg,.jpeg"
                className="hidden"
                id="logo-upload"
                disabled={uploading}
              />
              <label
                htmlFor="logo-upload"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
              >
                {uploading ? 'Uploading...' : 'Choose File'}
              </label>
            </div>
          )}

          {uploadError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{uploadError}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 bg-gray-50 rounded-lg p-4">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Format Guidelines:</h4>
          <ul className="space-y-1 text-xs text-gray-600">
            {Object.entries(LOGO_UPLOAD_CONFIG.recommendations).map(([format, rec]) => (
              <li key={format}>• <strong>{format.toUpperCase()}:</strong> {rec}</li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h3 className="text-md font-semibold text-gray-900 mb-3">Organization Name</h3>
        <input
          type="text"
          value={config.organizationName || ''}
          onChange={(e) => updateDraft('branding_config', {
            ...config,
            organizationName: e.target.value
          })}
          placeholder="Enter organization name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          This name will be displayed throughout the application
        </p>
      </div>
    </div>
  )
}

export default BrandingCustomizationTab
