import React, { useState, useRef } from 'react'
import { Upload, X, Check, Image } from 'lucide-react'

interface LogoUploadProps {
  currentLogo?: string
  onLogoChange: (logoUrl: string | null) => void
  isAdmin: boolean
}

const LogoUpload: React.FC<LogoUploadProps> = ({ currentLogo, onLogoChange, isAdmin }) => {
  const [isUploading, setIsUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.includes('svg')) {
      alert('Please upload an SVG file only')
      return
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      alert('File size must be less than 1MB')
      return
    }

    setIsUploading(true)

    try {
      // Convert file to data URL for preview and storage
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        
        // Store in localStorage for persistence
        localStorage.setItem('custom-logo', result)
        onLogoChange(result)
        setShowUploadModal(false)
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert('Failed to upload logo')
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const removeLogo = () => {
    localStorage.removeItem('custom-logo')
    onLogoChange(null)
    setShowUploadModal(false)
  }

  if (!isAdmin) {
    return null
  }

  return (
    <>
      <button
        onClick={() => setShowUploadModal(true)}
        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
        title="Upload Custom Logo"
      >
        <Image className="h-4 w-4" />
      </button>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowUploadModal(false)} />
          
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Upload Custom Logo</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6">
                {currentLogo ? (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Current Logo</h3>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div 
                        className="h-8 flex items-center"
                        dangerouslySetInnerHTML={{ 
                          __html: currentLogo.startsWith('data:') 
                            ? atob(currentLogo.split(',')[1]) 
                            : currentLogo 
                        }}
                      />
                      <button
                        onClick={removeLogo}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : null}

                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop SVG file here or click to browse
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    SVG files only, max 1MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".svg,image/svg+xml"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>

                <div className="mt-6 bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Logo Guidelines</h4>
                      <ul className="mt-1 text-sm text-blue-800 space-y-1">
                        <li>• Use SVG format for best quality</li>
                        <li>• Recommended height: 24-32px</li>
                        <li>• Keep file size under 1MB</li>
                        <li>• Logo will replace "Adminizer" text</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default LogoUpload