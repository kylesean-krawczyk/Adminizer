import React, { useState } from 'react'
import { FileText, Download, Mail, Eye, Search, Calendar, Tag } from 'lucide-react'
import { useDocuments } from '../../hooks'
import { format } from 'date-fns'
import DocumentViewer from '../DocumentViewer'
import EmailDocumentModal from './EmailDocumentModal'

interface DocumentActionsWidgetProps {
  category: string
  categoryTitle: string
  color: string
}

const DocumentActionsWidget: React.FC<DocumentActionsWidgetProps> = ({ 
  category, 
  categoryTitle, 
  color 
}) => {
  const { documents, loading, downloadDocument } = useDocuments()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [documentsToEmail, setDocumentsToEmail] = useState<any[]>([])
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())

  // Filter documents by category and search term
  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = doc.category.toLowerCase().includes(category.toLowerCase()) ||
                           doc.tags.some(tag => tag.toLowerCase().includes(category.toLowerCase()))
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesCategory && (searchTerm === '' || matchesSearch)
  })

  const handleView = (document: any) => {
    setSelectedDocument(document)
    setViewerOpen(true)
  }

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      await downloadDocument(filePath, fileName)
    } catch (err) {
      alert('Failed to download document: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleEmailSingle = (document: any) => {
    setDocumentsToEmail([document])
    setEmailModalOpen(true)
  }

  const handleEmailSelected = () => {
    const docsToEmail = filteredDocuments.filter(doc => selectedDocs.has(doc.id))
    setDocumentsToEmail(docsToEmail)
    setEmailModalOpen(true)
  }

  const handleSelectDocument = (docId: string) => {
    const newSelected = new Set(selectedDocs)
    if (newSelected.has(docId)) {
      newSelected.delete(docId)
    } else {
      newSelected.add(docId)
    }
    setSelectedDocs(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedDocs.size === filteredDocuments.length) {
      setSelectedDocs(new Set())
    } else {
      setSelectedDocs(new Set(filteredDocuments.map(doc => doc.id)))
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-${color}-100`}>
                <FileText className={`h-5 w-5 text-${color}-600`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {categoryTitle} Documents
                </h3>
                <p className="text-sm text-gray-600">
                  {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
            
            {selectedDocs.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedDocs.size} selected
                </span>
                <button
                  onClick={handleEmailSelected}
                  className={`flex items-center space-x-1 px-3 py-1 bg-${color}-600 text-white rounded-md text-sm hover:bg-${color}-700 transition-colors`}
                >
                  <Mail className="h-4 w-4" />
                  <span>Email Selected</span>
                </button>
              </div>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            
            {filteredDocuments.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedDocs.size === filteredDocuments.length}
                  onChange={() => {}}
                  className="rounded"
                />
                <span>Select All</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No {categoryTitle} Documents Found
              </h4>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? `No documents match "${searchTerm}" in the ${categoryTitle} category.`
                  : `No documents have been uploaded for the ${categoryTitle} category yet.`
                }
              </p>
              <button
                onClick={() => window.location.href = '/upload'}
                className={`px-4 py-2 bg-${color}-600 text-white rounded-lg hover:bg-${color}-700 transition-colors`}
              >
                Upload Documents
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    selectedDocs.has(doc.id) ? `border-${color}-300 bg-${color}-50` : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedDocs.has(doc.id)}
                        onChange={() => handleSelectDocument(doc.id)}
                        className={`mt-1 rounded text-${color}-600 focus:ring-${color}-500`}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {doc.name}
                          </h4>
                          <span className={`px-2 py-1 text-xs rounded-full bg-${color}-100 text-${color}-800`}>
                            {doc.category}
                          </span>
                          {doc.expiry_date && (
                            <span className="flex items-center space-x-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              <span>Expires {format(new Date(doc.expiry_date), 'MMM dd, yyyy')}</span>
                            </span>
                          )}
                        </div>
                        
                        {doc.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {doc.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{formatFileSize(doc.size)}</span>
                          <span>Uploaded {format(new Date(doc.created_at), 'MMM dd, yyyy')}</span>
                          {doc.tags.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <Tag className="h-3 w-3" />
                              <span>{doc.tags.slice(0, 2).join(', ')}</span>
                              {doc.tags.length > 2 && <span>+{doc.tags.length - 2}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleView(doc)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Document"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(doc.file_path, doc.name)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download Document"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEmailSingle(doc)}
                        className={`p-2 text-gray-400 hover:text-${color}-600 hover:bg-${color}-50 rounded-lg transition-colors`}
                        title="Email Document"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewer
        isOpen={viewerOpen}
        onClose={() => {
          setViewerOpen(false)
          setSelectedDocument(null)
        }}
        document={selectedDocument}
        onDownload={handleDownload}
      />

      {/* Email Modal */}
      <EmailDocumentModal
        isOpen={emailModalOpen}
        onClose={() => {
          setEmailModalOpen(false)
          setDocumentsToEmail([])
        }}
        documents={documentsToEmail}
        categoryColor={color}
      />
    </>
  )
}

export default DocumentActionsWidget