import React, { useState, useEffect } from 'react'
import { X, Download, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface DocumentViewerProps {
  isOpen: boolean
  onClose: () => void
  document: {
    id: string
    name: string
    file_path: string
    category: string
    size: number
    created_at: string
  } | null
  onDownload: (filePath: string, fileName: string) => void
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  isOpen,
  onClose,
  document,
  onDownload
}) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !document) {
      setFileUrl(null)
      setError(null)
      return
    }

    const getFileUrl = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Try to get a signed URL first
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(document.file_path, 3600) // 1 hour expiry

        if (error) {
          console.error('Error creating signed URL:', error)
          // Fallback to public URL
          const { data: publicData } = supabase.storage
            .from('documents')
            .getPublicUrl(document.file_path)
          
          setFileUrl(publicData.publicUrl)
        } else {
          setFileUrl(data.signedUrl)
        }
      } catch (err) {
        console.error('Error getting file URL:', err)
        setError('Failed to load document')
      } finally {
        setLoading(false)
      }
    }

    getFileUrl()
  }, [isOpen, document])

  if (!isOpen || !document) return null

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  const getFileType = (filename: string) => {
    const ext = getFileExtension(filename)
    if (['pdf'].includes(ext)) return 'pdf'
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image'
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video'
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio'
    if (['txt', 'md'].includes(ext)) return 'text'
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'office'
    return 'other'
  }

  const fileType = getFileType(document.name)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading document...</p>
          </div>
        </div>
      )
    }

    if (error || !fileUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="bg-red-100 rounded-full p-6 mb-4">
            <ExternalLink className="h-12 w-12 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to load document
          </h3>
          <p className="text-gray-600 mb-6">
            {error || 'There was an issue loading this document. You can try downloading it instead.'}
          </p>
          <button
            onClick={() => onDownload(document.file_path, document.name)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download File</span>
          </button>
        </div>
      )
    }

    switch (fileType) {
      case 'pdf':
        return (
          <div className="w-full h-full">
            <iframe
              src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-full border-0"
              title={document.name}
              onError={() => setError('PDF could not be displayed')}
            />
          </div>
        )
      
      case 'image':
        return (
          <div className="flex items-center justify-center h-full p-4">
            <img
              src={fileUrl}
              alt={document.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              onError={() => setError('Image could not be displayed')}
            />
          </div>
        )
      
      case 'video':
        return (
          <div className="flex items-center justify-center h-full p-4">
            <video
              src={fileUrl}
              controls
              className="max-w-full max-h-full rounded-lg shadow-lg"
              onError={() => setError('Video could not be displayed')}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )
      
      case 'audio':
        return (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-6 mb-4 mx-auto w-24 h-24 flex items-center justify-center">
                <svg className="h-12 w-12 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M13.828 8.172a1 1 0 011.414 0A5.983 5.983 0 0117 12a5.983 5.983 0 01-1.758 3.828 1 1 0 11-1.414-1.414A3.987 3.987 0 0015 12a3.987 3.987 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{document.name}</h3>
              <audio
                src={fileUrl}
                controls
                className="w-full max-w-md mx-auto"
                onError={() => setError('Audio could not be played')}
              >
                Your browser does not support the audio tag.
              </audio>
            </div>
          </div>
        )

      case 'text':
        return (
          <div className="w-full h-full p-4">
            <iframe
              src={fileUrl}
              className="w-full h-full border border-gray-200 rounded-lg"
              title={document.name}
              onError={() => setError('Text file could not be displayed')}
            />
          </div>
        )

      case 'office':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="bg-blue-100 rounded-full p-6 mb-4">
              <svg className="h-12 w-12 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Office Document
            </h3>
            <p className="text-gray-600 mb-6">
              This document type requires downloading to view. Click below to download and open with the appropriate application.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => onDownload(document.file_path, document.name)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download File</span>
              </button>
              <p className="text-sm text-gray-500">
                Or try opening in{' '}
                <a
                  href={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Office Online
                </a>
              </p>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="bg-gray-100 rounded-full p-6 mb-4">
              <ExternalLink className="h-12 w-12 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Preview not available
            </h3>
            <p className="text-gray-600 mb-6">
              This file type cannot be previewed in the browser. Download the file to view its content.
            </p>
            <button
              onClick={() => onDownload(document.file_path, document.name)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download File</span>
            </button>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {document.name}
              </h2>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {document.category}
                </span>
                <span>{formatFileSize(document.size)}</span>
                <span>{new Date(document.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => onDownload(document.file_path, document.name)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentViewer