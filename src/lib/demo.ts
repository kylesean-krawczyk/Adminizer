// Demo mode configuration and data service
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

// Demo organization data
export const demoOrganization = {
  id: 'demo-org-id',
  name: 'Acme Nonprofit Foundation',
  created_by: 'demo-admin-id',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

// Demo user profiles
export const demoUsers = [
  {
    id: 'demo-admin-id',
    email: 'admin@acmenonprofit.org',
    full_name: 'Sarah Johnson',
    role: 'master_admin',
    organization_id: 'demo-org-id',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'demo-user-1',
    email: 'john.smith@acmenonprofit.org',
    full_name: 'John Smith',
    role: 'admin',
    organization_id: 'demo-org-id',
    is_active: true,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 'demo-user-2',
    email: 'emily.davis@acmenonprofit.org',
    full_name: 'Emily Davis',
    role: 'user',
    organization_id: 'demo-org-id',
    is_active: true,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z'
  }
]

// Demo documents
export const demoDocuments = [
  {
    id: 'demo-doc-1',
    name: 'Annual Report 2024.pdf',
    category: 'Reports',
    upload_date: '2024-03-15',
    expiry_date: null,
    size: 2048576,
    status: 'Active',
    file_path: 'demo/annual-report-2024.pdf',
    tags: ['annual', 'report', 'business'],
    description: 'Comprehensive annual report showcasing business performance and financial transparency',
    organization_id: 'demo-org-id',
    created_at: '2024-03-15T10:30:00Z',
    updated_at: '2024-03-15T10:30:00Z'
  },
  {
    id: 'demo-doc-2',
    name: 'Employee Handbook.docx',
    category: 'HR',
    upload_date: '2024-01-10',
    expiry_date: '2025-01-10',
    size: 1536000,
    status: 'Active',
    file_path: 'demo/employee-handbook.docx',
    tags: ['hr', 'policies', 'handbook'],
    description: 'Complete employee handbook with policies and procedures',
    organization_id: 'demo-org-id',
    created_at: '2024-01-10T14:20:00Z',
    updated_at: '2024-01-10T14:20:00Z'
  },
  {
    id: 'demo-doc-3',
    name: 'Brand Guidelines.pdf',
    category: 'Branding',
    upload_date: '2024-02-20',
    expiry_date: null,
    size: 5242880,
    status: 'Active',
    file_path: 'demo/brand-guidelines.pdf',
    tags: ['branding', 'design', 'guidelines'],
    description: 'Official brand guidelines including logo usage, colors, and typography',
    organization_id: 'demo-org-id',
    created_at: '2024-02-20T09:15:00Z',
    updated_at: '2024-02-20T09:15:00Z'
  },
  {
    id: 'demo-doc-4',
    name: 'Customer Service Manual.pdf',
    category: 'Customer Support',
    upload_date: '2024-03-01',
    expiry_date: '2024-12-31',
    size: 3145728,
    status: 'Expiring Soon',
    file_path: 'demo/customer-service-manual.pdf',
    tags: ['customer', 'service', 'training'],
    description: 'Comprehensive training manual for customer service representatives',
    organization_id: 'demo-org-id',
    created_at: '2024-03-01T16:45:00Z',
    updated_at: '2024-03-01T16:45:00Z'
  },
  {
    id: 'demo-doc-5',
    name: 'Business License.pdf',
    category: 'Legal',
    upload_date: '2024-01-05',
    expiry_date: '2025-12-31',
    size: 512000,
    status: 'Active',
    file_path: 'demo/business-license.pdf',
    tags: ['legal', 'license', 'business'],
    description: 'Current business operating license',
    organization_id: 'demo-org-id',
    created_at: '2024-01-05T11:00:00Z',
    updated_at: '2024-01-05T11:00:00Z'
  },
  {
    id: 'demo-doc-6',
    name: 'Q1 Financial Report.xlsx',
    category: 'Accounting',
    upload_date: '2024-04-01',
    expiry_date: null,
    size: 1024000,
    status: 'Active',
    file_path: 'demo/q1-financial.xlsx',
    tags: ['financial', 'quarterly', 'accounting'],
    description: 'First quarter financial report with budget analysis',
    organization_id: 'demo-org-id',
    created_at: '2024-04-01T13:30:00Z',
    updated_at: '2024-04-01T13:30:00Z'
  },
  {
    id: 'demo-doc-7',
    name: 'Marketing Strategy.pptx',
    category: 'Marketing',
    upload_date: '2024-02-14',
    expiry_date: null,
    size: 2560000,
    status: 'Active',
    file_path: 'demo/marketing-strategy.pptx',
    tags: ['marketing', 'strategy', 'campaigns'],
    description: 'Comprehensive marketing strategy for 2024',
    organization_id: 'demo-org-id',
    created_at: '2024-02-14T10:00:00Z',
    updated_at: '2024-02-14T10:00:00Z'
  },
  {
    id: 'demo-doc-8',
    name: 'Executive Meeting Minutes - March.docx',
    category: 'Operations',
    upload_date: '2024-03-20',
    expiry_date: null,
    size: 768000,
    status: 'Active',
    file_path: 'demo/executive-minutes-march.docx',
    tags: ['executive', 'meeting', 'minutes'],
    description: 'Executive team meeting minutes from March 2024',
    organization_id: 'demo-org-id',
    created_at: '2024-03-20T17:00:00Z',
    updated_at: '2024-03-20T17:00:00Z'
  }
]

// Demo OAuth connections
export const demoOAuthConnections = [
  {
    id: 'demo-oauth-1',
    provider_id: 'google-workspace',
    user_id: 'demo-admin-id',
    organization_id: 'demo-org-id',
    access_token: 'demo-token-google',
    refresh_token: 'demo-refresh-google',
    expires_at: '2024-12-31T23:59:59Z',
    scopes: ['https://www.googleapis.com/auth/userinfo.email'],
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'demo-oauth-2',
    provider_id: 'quickbooks',
    user_id: 'demo-admin-id',
    organization_id: 'demo-org-id',
    access_token: 'demo-token-qb',
    refresh_token: 'demo-refresh-qb',
    expires_at: '2024-12-31T23:59:59Z',
    scopes: ['com.intuit.quickbooks.accounting'],
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

// Demo service class
export class DemoDataService {
  static getOrganization() {
    return demoOrganization
  }

  static getUsers() {
    return demoUsers
  }

  static getDocuments() {
    return demoDocuments
  }

  static getOAuthConnections() {
    return demoOAuthConnections
  }

  static getCurrentUser() {
    return demoUsers[0] // Return admin user as current user
  }

  static async uploadDocument(file: File, metadata: any) {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newDoc = {
      id: `demo-doc-${Date.now()}`,
      name: file.name,
      category: metadata.category,
      upload_date: new Date().toISOString().split('T')[0],
      expiry_date: metadata.expiryDate || null,
      size: file.size,
      status: 'Active',
      file_path: `demo/${file.name}`,
      tags: metadata.tags || [],
      description: metadata.description || null,
      organization_id: 'demo-org-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    demoDocuments.unshift(newDoc)
    return newDoc
  }

  static async deleteDocument(id: string) {
    const index = demoDocuments.findIndex(doc => doc.id === id)
    if (index > -1) {
      demoDocuments.splice(index, 1)
    }
  }

  static async downloadDocument(fileName: string) {
    // Create a demo file for download
    const content = `This is a demo file: ${fileName}\n\nGenerated for portfolio demonstration purposes.\n\nActual file content would be displayed here in a real implementation.`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  static async inviteUser(inviteData: any) {
    // Simulate invitation
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      id: `demo-invite-${Date.now()}`,
      email: inviteData.email,
      role: inviteData.role,
      organization_id: 'demo-org-id',
      invited_by: 'demo-admin-id',
      token: 'demo-token-' + Math.random().toString(36).substring(7),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    }
  }

  static async initiateOAuth(providerId: string) {
    // Show demo message instead of actual OAuth
    alert(`Demo Mode: OAuth connection to ${providerId} would be initiated here. In the real application, this would redirect to the provider's authorization page.`)
  }

  static isConnected(providerId: string) {
    return demoOAuthConnections.some(conn => conn.provider_id === providerId && conn.is_active)
  }
}