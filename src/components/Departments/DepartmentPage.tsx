import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings, Lock } from 'lucide-react'
import { useDocuments } from '../../hooks'
import { useUserManagement } from '../../hooks'
import { useTerminology } from '../../hooks'
import { useVertical } from '../../contexts/VerticalContext'
import { useDepartmentLandingData } from '../../hooks/useDepartmentLandingData'
import { useStatCardMetrics } from '../../hooks/useStatCardMetrics'
import DocumentActionsWidget from '../Operations/DocumentActionsWidget'
import DynamicStatCards from './DynamicStatCards'
import DynamicFeaturesList from './DynamicFeaturesList'
import DynamicToolsList from './DynamicToolsList'
import IntegrationToolsSection from './IntegrationToolsSection'
import QuickActionsSection from './QuickActionsSection'

const DepartmentPage = () => {
  const { department } = useParams<{ department: string }>()
  const navigate = useNavigate()
  const { documents } = useDocuments()
  const { isAdmin } = useUserManagement()
  const { term } = useTerminology()
  const { verticalId } = useVertical()

  console.log('[DepartmentPage] 🚀 Rendering with department ID:', department)

  const {
    config: departmentConfig,
    statCards,
    features,
    tools,
    integrations,
    quickActions,
    loading: dataLoading
  } = useDepartmentLandingData({
    departmentId: department || '',
    verticalId,
    enabled: !!department
  })

  const {
    metrics,
    loading: metricsLoading
  } = useStatCardMetrics({
    statCards,
    departmentId: department || '',
    enabled: statCards.length > 0
  })

  const fallbackConfig = {
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
      color: 'gray',
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
      color: 'sky',
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
      color: 'sky',
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

  const config = departmentConfig
    ? {
        title: (departmentConfig as any).custom_display_name || departmentConfig.department_id || department || '',
        description: (departmentConfig as any).section_name || '',
        color: departmentConfig.color_theme || 'blue',
        icon: departmentConfig.emoji || '📁',
        features: []
      }
    : fallbackConfig[department as keyof typeof fallbackConfig]

  if (!config && !dataLoading) {
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

  const hasAccess = true

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

  if (dataLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="h-8 bg-gray-300 rounded w-64 mb-2 animate-pulse" />
            <div className="h-4 bg-gray-300 rounded w-96 animate-pulse" />
          </div>
        </div>
        <DynamicStatCards statCards={[]} metrics={{}} loading={true} />
      </div>
    )
  }

  const useDynamicComponents = statCards.length > 0 || features.length > 0 || tools.length > 0

  // Log data after load
  if (!dataLoading && !metricsLoading) {
    console.log('[DepartmentPage] 📊 Data loaded - Stats:', statCards.length, 'Features:', features.length, 'Tools:', tools.length, 'Integrations:', integrations.length, 'Actions:', quickActions.length)
  }

  return (
    <div className="space-y-6">
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
          <button
            onClick={() => navigate(`/settings/organization-customization?tab=departments`)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Customize Department</span>
          </button>
        )}
      </div>

      {/* Quick Actions Section */}
      <QuickActionsSection
        quickActions={quickActions}
        loading={dataLoading}
      />

      {useDynamicComponents ? (
        <>
          <DynamicStatCards
            statCards={statCards}
            metrics={metrics}
            colorTheme={config.color}
            loading={metricsLoading}
          />

          <DynamicFeaturesList
            features={features}
            colorTheme={config.color}
          />

          <DynamicToolsList tools={tools} />

          {/* Integration Tools Section */}
          <IntegrationToolsSection
            integrations={integrations}
            loading={dataLoading}
          />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`bg-${config.color}-500 p-3 rounded-lg`}>
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
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
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
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
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Resources</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
              </div>
            </div>
          </div>

          {config.features && config.features.length > 0 && (
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
          )}

          {/* Integration Tools Section */}
          <IntegrationToolsSection
            integrations={integrations}
            loading={dataLoading}
          />
        </>
      )}

      <DocumentActionsWidget
        category={department || ''}
        categoryTitle={config.title}
        color={config.color}
      />
    </div>
  )
}

export default DepartmentPage
