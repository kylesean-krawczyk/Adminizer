import React, { useState, useEffect } from 'react'
import { X, Save, Download, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface DocumentEditorProps {
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
  onSave: (content: string) => void
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  isOpen,
  onClose,
  document: currentDocument,
  onSave
}) => {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !currentDocument) {
      setContent('')
      setError(null)
      return
    }

    const loadContent = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const { data, error } = await supabase.storage
          .from('documents')
          .download(currentDocument.file_path)

        if (error) throw error

        const text = await data.text()
        setContent(text)
      } catch (err) {
        console.error('Error loading document content:', err)
        setError('Failed to load document content')
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [isOpen, currentDocument])

  const handleSave = async () => {
    if (!currentDocument) return

    setSaving(true)
    try {
      // Create a new blob with the updated content
      const blob = new Blob([content], { type: 'text/plain' })
      
      // Upload the updated content back to storage
      const { error } = await supabase.storage
        .from('documents')
        .update(currentDocument.file_path, blob)

      if (error) throw error

      onSave(content)
      onClose()
    } catch (err) {
      console.error('Error saving document:', err)
      setError('Failed to save document')
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = () => {
    if (!currentDocument) return

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = currentDocument.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isOpen || !currentDocument) return null

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  const isEditableFile = (filename: string) => {
    const ext = getFileExtension(filename)
    return ['txt', 'md', 'csv', 'json', 'xml', 'html', 'css', 'js', 'ts', 'jsx', 'tsx'].includes(ext)
  }

  if (!isEditableFile(currentDocument.name)) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              File Not Editable
            </h3>
            <p className="text-gray-600 mb-6">
              This file type cannot be edited in the browser. Only text-based files (txt, md, csv, etc.) can be edited.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                Editing: {currentDocument.name}
              </h2>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {currentDocument.category}
                </span>
                <span>{new Date(currentDocument.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={handleDownload}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Download"
                disabled={loading}
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                title="Save"
              >
                <Save className="h-4 w-4" />
                <span className="text-sm">{saving ? 'Saving...' : 'Save'}</span>
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
          <div className="flex-1 overflow-hidden p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading document...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="bg-red-100 rounded-full p-6 mb-4 mx-auto w-24 h-24 flex items-center justify-center">
                    <FileText className="h-12 w-12 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Document</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                placeholder="Document content will appear here..."
                disabled={saving}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentEditor