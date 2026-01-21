import { useState } from 'react'
import { Search, Filter, Download, Trash2, Eye, Edit, Settings, Sparkles } from 'lucide-react'
import { useDocuments } from '../hooks'
import { format } from 'date-fns'
import DocumentViewer from './DocumentViewer'
import DocumentEditModal from './DocumentEditModal'
import DocumentEditor from './DocumentEditor'
import { EnhancedDocumentSearch } from './DocumentSearch/EnhancedDocumentSearch'
import { useAuth } from '../contexts/AuthContext'

const DocumentList = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewerOpen, setViewerOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [showAISearch, setShowAISearch] = useState(false)
  const { documents, loading, error, deleteDocument, downloadDocument } = useDocuments()
  const { user } = useAuth()

  const categories = [
    'all',
    'HR',
    'Accounting',
    'Branding',
    'Social Media',
    'Communications',
    'Volunteer/People Management',
    'Streaming: Video & Podcast',
    'Reports',
    'Governance',
    'Legal',
    'Funding',
    'Financial',
    'Operations',
    'Other'
  ]

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  const isEditableFile = (filename: string) => {
    const ext = getFileExtension(filename)
    return ['txt', 'md', 'csv', 'json', 'xml', 'html', 'css', 'js', 'ts', 'jsx', 'tsx'].includes(ext)
  }

  const handleDelete = async (id: string, filePath: string, fileName: string) => {
    if (window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      try {
        await deleteDocument(id, filePath)
      } catch (err) {
        alert('Failed to delete document: ' + (err instanceof Error ? err.message : 'Unknown error'))
      }
    }
  }

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      await downloadDocument(filePath, fileName)
    } catch (err) {
      alert('Failed to download document: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleView = (document: any) => {
    setSelectedDocument(document)
    setViewerOpen(true)
  }

  const handleEdit = (document: any) => {
    setSelectedDocument(document)
    setEditModalOpen(true)
  }

  const handleEditContent = (document: any) => {
    setSelectedDocument(document)
    setEditorOpen(true)
  }

  const handleCloseViewer = () => {
    setViewerOpen(false)
    setSelectedDocument(null)
  }

  const handleCloseEditModal = () => {
    setEditModalOpen(false)
    setSelectedDocument(null)
  }

  const handleCloseEditor = () => {
    setEditorOpen(false)
    setSelectedDocument(null)
  }

  const handleSaveContent = () => {
    // Content is already saved in the DocumentEditor component
    console.log('Document content saved')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
          <p className="text-gray-600">Manage and organize your documents</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
          <p className="text-gray-600">Manage and organize your documents</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Error loading documents: {error}</p>
            <p className="text-gray-600">Please make sure Supabase is properly configured.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
          <p className="text-gray-600">Manage and organize your documents</p>
        </div>
        <button
          onClick={() => setShowAISearch(!showAISearch)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
        >
          <Sparkles className="h-4 w-4" />
          {showAISearch ? 'Standard Search' : 'AI Search'}
        </button>
      </div>

      {showAISearch ? (
        <EnhancedDocumentSearch
          onSelectDocument={(doc) => {
            setSelectedDocument(doc);
            setViewerOpen(true);
          }}
          userId={user?.id}
        />
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400 h-4 w-4" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No documents found. Upload your first document to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Upload Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Expiry Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Size</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleView(doc)}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                        >
                          {doc.name}
                        </button>
                        {doc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {doc.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="px-1 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                {tag}
                              </span>
                            ))}
                            {doc.tags.length > 3 && (
                              <span className="px-1 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                +{doc.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {doc.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {format(new Date(doc.upload_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {doc.expiry_date ? format(new Date(doc.expiry_date), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{formatFileSize(doc.size)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          doc.status === 'Active' ? 'bg-green-100 text-green-800' :
                          doc.status === 'Expiring Soon' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleView(doc)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(doc)}
                            className="p-1 text-gray-400 hover:text-purple-600"
                            title="Edit Properties"
                          >
                            <Settings size={16} />
                          </button>
                          {isEditableFile(doc.name) && (
                            <button
                              onClick={() => handleEditContent(doc)}
                              className="p-1 text-gray-400 hover:text-orange-600"
                              title="Edit Content"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDownload(doc.file_path, doc.name)}
                            className="p-1 text-gray-400 hover:text-green-600"
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id, doc.file_path, doc.name)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <DocumentViewer
        isOpen={viewerOpen}
        onClose={handleCloseViewer}
        document={selectedDocument}
        onDownload={handleDownload}
      />

      <DocumentEditModal
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        document={selectedDocument}
      />

      <DocumentEditor
        isOpen={editorOpen}
        onClose={handleCloseEditor}
        document={selectedDocument}
        onSave={handleSaveContent}
      />
    </div>
  )
}

export default DocumentList