import { useState } from 'react'

export interface Document {
  id: string
  name: string
  category: string
  upload_date: string
  expiry_date: string | null
  size: number
  status: string
  file_path: string
  tags: string[]
  description: string | null
  organization_id: string | null
  created_at: string
  updated_at: string
}

const demoDocuments: Document[] = [
  {
    id: 'demo-doc-1',
    name: 'Employee Handbook 2024.pdf',
    category: 'HR',
    upload_date: '2024-01-15',
    expiry_date: '2024-12-31',
    size: 2048576,
    status: 'Active',
    file_path: 'demo/employee-handbook.pdf',
    tags: ['handbook', 'policies', 'hr'],
    description: 'Updated employee handbook with new policies and procedures',
    organization_id: 'demo-org-1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'demo-doc-2',
    name: 'Q4 Financial Report.xlsx',
    category: 'Accounting',
    upload_date: '2024-01-10',
    expiry_date: null,
    size: 1024000,
    status: 'Active',
    file_path: 'demo/q4-financial-report.xlsx',
    tags: ['financial', 'quarterly', 'report'],
    description: 'Fourth quarter financial performance report',
    organization_id: 'demo-org-1',
    created_at: '2024-01-10T14:30:00Z',
    updated_at: '2024-01-10T14:30:00Z'
  },
  {
    id: 'demo-doc-3',
    name: 'Brand Guidelines.pdf',
    category: 'Branding',
    upload_date: '2024-01-08',
    expiry_date: '2025-01-08',
    size: 5120000,
    status: 'Active',
    file_path: 'demo/brand-guidelines.pdf',
    tags: ['branding', 'design', 'guidelines'],
    description: 'Official brand guidelines and design standards',
    organization_id: 'demo-org-1',
    created_at: '2024-01-08T09:15:00Z',
    updated_at: '2024-01-08T09:15:00Z'
  },
  {
    id: 'demo-doc-4',
    name: 'Social Media Calendar.xlsx',
    category: 'Social Media',
    upload_date: '2024-01-05',
    expiry_date: '2024-03-31',
    size: 512000,
    status: 'Expiring Soon',
    file_path: 'demo/social-media-calendar.xlsx',
    tags: ['social media', 'calendar', 'planning'],
    description: 'Q1 social media content calendar and posting schedule',
    organization_id: 'demo-org-1',
    created_at: '2024-01-05T16:45:00Z',
    updated_at: '2024-01-05T16:45:00Z'
  },
  {
    id: 'demo-doc-5',
    name: 'Legal Compliance Checklist.pdf',
    category: 'Legal',
    upload_date: '2023-12-20',
    expiry_date: '2023-12-31',
    size: 256000,
    status: 'Overdue',
    file_path: 'demo/legal-compliance.pdf',
    tags: ['legal', 'compliance', 'checklist'],
    description: 'Annual legal compliance requirements checklist',
    organization_id: 'demo-org-1',
    created_at: '2023-12-20T11:20:00Z',
    updated_at: '2023-12-20T11:20:00Z'
  }
]

export const useDemoDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>(demoDocuments)
  const [loading, setLoading] = useState(false)
  const [error] = useState<string | null>(null)

  const uploadDocument = async (file: File, metadata: {
    category: string
    expiryDate?: string
    tags: string[]
    description?: string
  }) => {
    // Simulate upload delay
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newDoc: Document = {
      id: `demo-doc-${Date.now()}`,
      name: file.name,
      category: metadata.category,
      upload_date: new Date().toISOString().split('T')[0],
      expiry_date: metadata.expiryDate || null,
      size: file.size,
      status: 'Active',
      file_path: `demo/${file.name}`,
      tags: metadata.tags,
      description: metadata.description || null,
      organization_id: 'demo-org-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    setDocuments(prev => [newDoc, ...prev])
    setLoading(false)
    return newDoc
  }

  const updateDocument = async (id: string, updates: {
    category?: string
    expiry_date?: string | null
    tags?: string[]
    description?: string | null
  }) => {
    const updatedDoc = documents.find(doc => doc.id === id)
    if (!updatedDoc) throw new Error('Document not found')
    
    const updated = { ...updatedDoc, ...updates, updated_at: new Date().toISOString() }
    setDocuments(prev => prev.map(doc => doc.id === id ? updated : doc))
    return updated
  }

  const deleteDocument = async (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id))
  }

  const downloadDocument = async (_filePath: string, fileName: string) => {
    // Simulate download
    const blob = new Blob(['Demo file content'], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const refetch = async () => {
    // Demo mode doesn't need to refetch
  }

  const readDocumentContent = async (_filePath: string): Promise<string | null> => {
    // Demo mode - return sample CSV content
    return `First Name,Last Name,Amount,Date
John,Smith,100.00,2024-01-15
Jane,Doe,250.50,2024-01-20
Bob,Johnson,75.00,2024-01-25`
  }

  return {
    documents,
    loading,
    error,
    uploadDocument,
    updateDocument,
    deleteDocument,
    downloadDocument,
    readDocumentContent,
    refetch
  }
}