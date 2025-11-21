import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings, FileText, Users, Plus, Lock } from 'lucide-react'
import { useDocuments } from '../../hooks'
import { useUserManagement } from '../../hooks'
import { useTerminology } from '../../hooks'
import DocumentActionsWidget from '../Operations/DocumentActionsWidget'

const DepartmentPage = () => {
  const { department } = useParams<{ department: string }>()
  const navigate = useNavigate()
  const { documents } = useDocuments()
  const { isAdmin } = useUserManagement()
  const { term } = useTerminology()

  // Department configurations
  const departmentConfig = {
    'human-resources': {
      title: 'Human Resources',
      description: 'Employee management and HR processes',
      color: 'blue',
      icon: '👥',
      features: [
        'Employee records and profiles',
        'Onboarding and offboarding',
        'Time-off and attendance tracking',
        'Performance reviews and evaluations',
        'Training and development',
        'Benefits administration'
      ]
    },
    'finance-accounting': {
      title: 'Finance & Accounting',
      description: 'Financial management and accounting operations',
      color: 'green',
      icon: '💰',
      features: [
        'Invoicing and billing',
        'Expense tracking and management',
        'Budget planning and monitoring',
        'Financial reporting and analysis',
        'Tax preparation and compliance',
        'Cash flow management'
      ]
    },
    'sales': {
      title: 'Sales',
      description: 'Sales management and customer analytics',
      color: 'emerald',
      icon: '📈',
      features: [
        'Lead management and tracking',
        'Deal pipeline and forecasting',
        'Customer relationship management',
        'Sales performance analytics',
        'Quote and proposal generation',
        'Territory and account management'
      ]
    },
    'operations': {
      title: 'Operations',
      description: 'Business operations and process management',
      color: 'purple',
      icon: '⚙️',
      features: [
        'Workflow design and optimization',
        'Inventory and asset management',
        'Facilities and space management',
        'Process documentation',
        'Quality control and standards',
        'Vendor and supplier management'
      ]
    },
    'customer-support': {
      title: 'Customer Support',
      description: 'Customer service and support operations',
      color: 'indigo',
      icon: '🎧',
      features: [
        'Ticket and case management',
        'Customer communication tracking',
        'Knowledge base management',
        'Service level monitoring',
        'Customer satisfaction tracking',
        'Support team coordination'
      ]
    },
    'member-care': {
      title: 'Member Care',
      description: 'Member services and support',
      color: 'indigo',
      icon: '🎧',
      features: [
        'Member records and profiles',
        'Member communication tracking',
        'Service request management',
        'Member satisfaction tracking',
        'Support team coordination',
        'Member engagement programs'
      ]
    },
    'marketing': {
      title: 'Marketing',
      description: 'Marketing campaigns and lead generation',
      color: 'pink',
      icon: '📢',
      features: [
        'Campaign planning and execution',
        'Content creation and management',
        'Lead generation and nurturing',
        'Marketing analytics and ROI',
        'Brand management',
        'Social media coordination'
      ]
    },
    'it-technology': {
      title: 'IT & Technology',
      description: 'Technology infrastructure and digital tools',
      color: 'cyan',
      icon: '💻',
      features: [
        'IT asset management',
        'Software license tracking',
        'Security and compliance',
        'Help desk and support',
        'Infrastructure monitoring',
        'Technology planning'
      ]
    },
    'legal-compliance': {
      title: 'Legal & Compliance',
      description: 'Legal affairs and regulatory compliance',
      color: 'gray',
      icon: '⚖️',
      features: [
        'Contract management',
        'Policy development',
        'Regulatory compliance tracking',
        'Risk assessment and management',
        'Legal document storage',
        'Compliance reporting'
      ]
    },
    'procurement': {
      title: 'Procurement',
      description: 'Vendor management and purchasing',
      color: 'orange',
      icon: '📦',
      features: [
        'Vendor selection and management',
        'Purchase order processing',
        'Supplier relationship management',
        'Cost analysis and optimization',
        'Contract negotiation',
        'Procurement compliance'
      ]
    },
    'project-management': {
      title: 'Project Management',
      description: 'Project planning and execution',
      color: 'red',
      icon: '📋',
      features: [
        'Project planning and scheduling',
        'Task assignment and tracking',
        'Resource allocation',
        'Timeline and milestone management',
        'Team collaboration',
        'Project reporting and analysis'
      ]
    },
    'research-development': {
      title: 'Research & Development',
      description: 'Innovation and product development',
      color: 'teal',
      icon: '🧪',
      features: [
        'Innovation tracking and management',
        'Product development lifecycle',
        'Research project coordination',
        'Testing and validation',
        'Intellectual property management',
        'R&D budget and resource planning'
      ]
    },
    'quality-assurance': {
      title: 'Quality Assurance',
      description: 'Quality control and standards compliance',
      color: 'lime',
      icon: '✅',
      features: [
        'Quality control processes',
        'Audit planning and execution',
        'Standards compliance monitoring',
        'Defect tracking and resolution',
        'Quality metrics and reporting',
        'Continuous improvement initiatives'
      ]
    }
  }

  const config = departmentConfig[department as keyof typeof departmentConfig]
  
  if (!config) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Department Not Found</h2>
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Return to Dashboard
        </button>
      </div>
    )
  }

  // Check if user has access to this department (for demo, we'll show access for all)
  const hasAccess = true // In real implementation, this would check user permissions

  // Filter documents by department
  const departmentDocuments = documents.filter(doc => 
    doc.category.toLowerCase().includes(department?.toLowerCase() || '') ||
    doc.tags.some(tag => tag.toLowerCase().includes(department?.toLowerCase() || ''))
  )

  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
            <p className="text-gray-600 mt-1">{config.description}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="bg-red-100 rounded-full p-6 mx-auto w-24 h-24 flex items-center justify-center mb-6">
            <Lock className="h-12 w-12 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Access Restricted
          </h3>
          <p className="text-gray-600 mb-6">
            You don't have access to the {config.title} department. Contact your administrator to request access.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <span className="text-2xl">{config.icon}</span>
              <span>{config.title}</span>
            </h1>
            <p className="text-gray-600 mt-1">{config.description}</p>
          </div>
        </div>
        
        {isAdmin && (
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            <Settings className="h-4 w-4" />
            <span>Manage Access</span>
          </button>
        )}
      </div>

      {/* Department Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`bg-${config.color}-500 p-3 rounded-lg`}>
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Documents</p>
              <p className="text-2xl font-bold text-gray-900">{departmentDocuments.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`bg-${config.color}-500 p-3 rounded-lg`}>
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{term('team', { capitalize: 'title' })} {term('members', { capitalize: 'first' })}</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`bg-${config.color}-500 p-3 rounded-lg`}>
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`bg-${config.color}-500 p-3 rounded-lg`}>
              <Plus className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resources</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Features */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{term('department', { capitalize: 'first' })} Features & Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {config.features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 bg-${config.color}-500 rounded-full`}></div>
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Document Management */}
      <DocumentActionsWidget 
        category={department || ''}
        categoryTitle={config.title}
        color={config.color}
      />

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            <FileText className="h-5 w-5 text-gray-600" />
            <span className="text-gray-600 font-medium">Upload Documents</span>
          </button>
          
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors">
            <Users className="h-5 w-5 text-gray-600" />
            <span className="text-gray-600 font-medium">Manage {term('team', { capitalize: 'first' })}</span>
          </button>
          
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors">
            <Settings className="h-5 w-5 text-gray-600" />
            <span className="text-gray-600 font-medium">{term('department', { capitalize: 'first' })} Settings</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DepartmentPage