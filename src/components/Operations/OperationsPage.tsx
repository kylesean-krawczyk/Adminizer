import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings, FileText, BarChart3, Plus } from 'lucide-react'
import { useDocuments } from '../../hooks'
import { useUserManagement } from '../../hooks'
import OAuthIntegrationCard from './OAuthIntegrationCard'
import IntegrationEditModal from './IntegrationEditModal'
import CorporateStatusWidget from './CorporateStatusWidget'
import DocumentActionsWidget from './DocumentActionsWidget'
import { useState, useEffect } from 'react'

const OperationsPage = () => {
  const { category } = useParams<{ category: string }>()
  const navigate = useNavigate()
  const { documents } = useDocuments()
  const { isMasterAdmin } = useUserManagement()
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null)
  const [customIntegrations, setCustomIntegrations] = useState<any[]>([])

  const operationsConfig = {
    'hr': {
      title: 'Human Resources',
      description: 'Manage your team, payroll, and HR processes',
      color: 'blue',
      integrations: [
        {
          name: 'HR Ministry Solutions',
          description: 'Complete HR management platform for ministries with API integration capabilities',
          url: 'https://online.hrministrysolutions.com/hc/en-us',
          category: 'HRIS',
          supportsOAuth: false,
          note: 'Contact provider for API access and integration options'
        },
        {
          name: 'Ministry Safe',
          description: 'Background screening and safety solutions with limited API access',
          url: 'https://safetysystem.ministrysafe.com/auth/sign_in',
          category: 'Safety',
          supportsOAuth: false,
          note: 'API access available for enterprise customers'
        },
        {
          name: 'Gusto',
          description: 'Payroll, benefits, and HR with OAuth 2.0 API integration',
          url: 'https://gusto.com',
          category: 'Payroll',
          supportsOAuth: true,
          note: 'Full OAuth 2.0 support with comprehensive API'
        },
        {
          name: 'GuideStone',
          description: 'Retirement and benefits administration for ministry workers',
          url: 'https://login.guidestone.org/',
          category: 'Benefits',
          supportsOAuth: false,
          note: 'Specialized retirement and insurance benefits for ministry professionals'
        },
        {
          name: 'The Standard',
          description: 'Group insurance and employee benefits platform',
          url: 'https://login.standard.com/',
          category: 'Insurance',
          supportsOAuth: false,
          note: 'Comprehensive group insurance and disability coverage'
        }
      ]
    },
    'accounting': {
      title: 'Accounting & Finance',
      description: 'Manage your finances, invoicing, and accounting',
      color: 'green',
      integrations: [
        {
          name: 'QuickBooks Online',
          description: 'Complete accounting software with OAuth integration',
          url: 'https://quickbooks.intuit.com',
          category: 'Accounting'
        },
        {
          name: 'Bill.com',
          description: 'Accounts payable and receivable automation platform',
          url: 'https://www.bill.com',
          category: 'Accounting',
          supportsOAuth: false,
          note: 'API access available for business plans'
        },
        {
          name: 'Pushpay',
          description: 'Digital giving and donor management platform for churches',
          url: 'https://pushpay.com',
          category: 'Donations',
          supportsOAuth: false,
          note: 'Specialized giving platform with church management features'
        },
        {
          name: 'Live Your Parable',
          description: 'Financial planning and stewardship education platform',
          url: 'https://liveyourparable.com/',
          category: 'Financial Planning',
          supportsOAuth: false,
          note: 'Faith-based financial education and planning tools'
        },
        {
          name: 'National Bank of Arizona',
          description: 'Personal and business banking services',
          url: 'https://www.nbarizona.com/personal/',
          category: 'Banking',
          supportsOAuth: false,
          note: 'Local banking partner with business account management'
        }
      ]
    },
    'communications': {
      title: 'Communications',
      description: 'Manage internal and external communications',
      color: 'indigo',
      integrations: [
        {
          name: 'Slack',
          description: 'Team communication with OAuth integration',
          url: 'https://slack.com',
          category: 'Internal'
        },
        {
          name: 'Mailchimp',
          description: 'Email marketing with OAuth integration',
          url: 'https://mailchimp.com',
          category: 'Email Marketing'
        },
        {
          name: 'Zoom',
          description: 'Video conferencing and webinars',
          url: 'https://zoom.us',
          category: 'Video'
        }
      ]
    },
    'legal': {
      title: 'Legal Affairs & Compliance',
      description: 'Manage legal documents, contracts, and compliance',
      color: 'gray',
      integrations: [
        {
          name: 'DocuSign',
          description: 'Electronic signature and document management',
          url: 'https://www.docusign.com',
          category: 'E-Signature'
        },
        {
          name: 'E-Verify',
          description: 'Employment eligibility verification system',
          url: 'https://www.e-verify.gov',
          category: 'Compliance',
          supportsOAuth: false,
          note: 'Government system for verifying employee work authorization'
        },
        {
          name: 'Arizona Corporate Commission',
          description: 'State corporate filing and compliance portal',
          url: 'https://ecorp.azcc.gov/',
          category: 'Corporate Compliance',
          supportsOAuth: false,
          note: 'Official state portal for corporate filings, annual reports, and entity searches'
        }
      ]
    },
    'branding': {
      title: 'Branding & Design',
      description: 'Create and manage your brand identity',
      color: 'purple',
      integrations: [
        {
          name: 'Canva',
          description: 'Design platform for creating visual content',
          url: 'https://www.canva.com',
          category: 'Design'
        }
      ]
    },
    'social-media': {
      title: 'Social Media Management',
      description: 'Manage your social media presence and engagement',
      color: 'pink',
      integrations: [
        {
          name: 'Instagram',
          description: 'Photo and video sharing platform for visual storytelling',
          url: 'https://www.instagram.com',
          category: 'Social Platform',
          supportsOAuth: false,
          note: 'Direct access to Instagram for content creation and community engagement'
        },
        {
          name: 'Facebook',
          description: 'Social networking platform for community building and events',
          url: 'https://www.facebook.com',
          category: 'Social Platform',
          supportsOAuth: false,
          note: 'Connect with your community through posts, events, and messaging'
        },
        {
          name: 'Meta for Business',
          description: 'Business tools for Facebook and Instagram advertising and analytics',
          url: 'https://business.facebook.com',
          category: 'Business Tools',
          supportsOAuth: false,
          note: 'Manage ads, analyze performance, and grow your social media presence'
        },
        {
          name: 'Linktree',
          description: 'Link-in-bio tool to share multiple links from social media profiles',
          url: 'https://linktr.ee',
          category: 'Link Management',
          supportsOAuth: false,
          note: 'Create a custom landing page to share multiple important links'
        }
      ]
    },
    'volunteer-management': {
      title: 'Volunteer & People Management',
      description: 'Coordinate and manage volunteers and team members',
      color: 'orange',
      integrations: [
        {
          name: 'Planning Center',
          description: 'Church management software for planning and volunteer coordination',
          url: 'https://login.planningcenteronline.com/',
          category: 'Church Management',
          supportsOAuth: false,
          note: 'Comprehensive church management with volunteer scheduling and event planning'
        },
        {
          name: 'ChMS (Church Community Builder)',
          description: 'Complete church management system for member and volunteer coordination',
          url: 'https://redemptionflagstaff.ccbchurch.com/',
          category: 'Church Management',
          supportsOAuth: false,
          note: 'Full-featured church management with member database and volunteer tracking'
        },
        {
          name: 'Wufoo',
          description: 'Online form builder for volunteer registration and event sign-ups',
          url: 'https://secure.wufoo.com/login/',
          category: 'Forms & Registration',
          supportsOAuth: false,
          note: 'Easy-to-use form builder for collecting volunteer information and event registrations'
        }
      ]
    },
    'streaming': {
      title: 'Streaming: Video & Podcast',
      description: 'Create, manage, and distribute video and audio content',
      color: 'red',
      integrations: [
        {
          name: 'YouTube',
          description: 'Video hosting and management platform with OAuth integration',
          url: 'https://www.youtube.com',
          category: 'Video Platform',
          supportsOAuth: true,
          note: 'Full OAuth support for channel management, video uploads, and analytics'
        },
        {
          name: 'Transistor.fm',
          description: 'Professional podcast hosting and analytics platform',
          url: 'https://transistor.fm',
          category: 'Podcast Hosting',
          supportsOAuth: false,
          note: 'Comprehensive podcast hosting with detailed analytics and distribution'
        }
      ]
    },
    'it': {
      title: 'IT & Technology',
      description: 'Technology infrastructure and digital tools management',
      color: 'cyan',
      integrations: [
        {
          name: 'Google Workspace',
          description: 'Access Gmail, Drive, Calendar, and other Google services with OAuth',
          url: 'https://workspace.google.com',
          category: 'Productivity'
        },
        {
          name: 'Google Search Console',
          description: 'Monitor and optimize your website\'s search performance with OAuth',
          url: 'https://search.google.com/search-console',
          category: 'Analytics'
        },
        {
          name: 'Squarespace',
          description: 'Website builder and hosting platform for creating professional websites',
          url: 'https://www.squarespace.com',
          category: 'Website Management',
          supportsOAuth: false,
          note: 'All-in-one platform for building, hosting, and managing your organization\'s website'
        }
      ]
    }
  }

  // Load custom integrations from localStorage
  useEffect(() => {
    const savedCustomIntegrations = localStorage.getItem(`custom-integrations-${category}`)
    if (savedCustomIntegrations) {
      setCustomIntegrations(JSON.parse(savedCustomIntegrations))
    }
  }, [category])

  // Load customized integrations from localStorage
  const loadCustomizedIntegrations = () => {
    const config = operationsConfig[category as keyof typeof operationsConfig]
    if (!config) return []

    return config.integrations.map(integration => {
      const savedCustomization = localStorage.getItem(`integration-customization-${integration.name.toLowerCase().replace(/\s+/g, '-')}`)
      if (savedCustomization) {
        return { ...integration, ...JSON.parse(savedCustomization) }
      }
      return integration
    })
  }

  const config = operationsConfig[category as keyof typeof operationsConfig]
  
  if (!config) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h2>
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Return to Dashboard
        </button>
      </div>
    )
  }

  // Filter documents by category
  const categoryDocuments = documents.filter(doc => 
    doc.category.toLowerCase().includes(category?.toLowerCase() || '') ||
    doc.tags.some(tag => tag.toLowerCase().includes(category?.toLowerCase() || ''))
  )

  const customizedIntegrations = loadCustomizedIntegrations()
  const allIntegrations = [...customizedIntegrations, ...customIntegrations]

  const handleEditIntegration = (integration: any) => {
    setSelectedIntegration(integration)
    setEditModalOpen(true)
  }

  const handleSaveIntegration = (updatedIntegration: any) => {
    // Check if this is a default integration or custom one
    const isDefaultIntegration = config.integrations.some(int => int.name === updatedIntegration.name)
    
    if (isDefaultIntegration) {
      // Save customization for default integration
      localStorage.setItem(
        `integration-customization-${updatedIntegration.name.toLowerCase().replace(/\s+/g, '-')}`,
        JSON.stringify(updatedIntegration)
      )
    } else {
      // Update custom integration
      const updatedCustomIntegrations = customIntegrations.map(int =>
        int.name === selectedIntegration?.name ? updatedIntegration : int
      )
      setCustomIntegrations(updatedCustomIntegrations)
      localStorage.setItem(`custom-integrations-${category}`, JSON.stringify(updatedCustomIntegrations))
    }
  }

  const handleAddCustomIntegration = () => {
    const newIntegration = {
      name: 'New Integration',
      description: 'Custom integration for your organization',
      url: 'https://example.com',
      category: 'Custom'
    }
    setSelectedIntegration(newIntegration)
    setEditModalOpen(true)
  }

  const handleSaveNewIntegration = (newIntegration: any) => {
    const updatedCustomIntegrations = [...customIntegrations, newIntegration]
    setCustomIntegrations(updatedCustomIntegrations)
    localStorage.setItem(`custom-integrations-${category}`, JSON.stringify(updatedCustomIntegrations))
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
            <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
            <p className="text-gray-600 mt-1">{config.description}</p>
          </div>
        </div>
        
        {isMasterAdmin && (
          <button
            onClick={handleAddCustomIntegration}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Integration</span>
          </button>
        )}
      </div>

      {/* Corporate Status Widget for Legal Category */}
      {category === 'legal' && (
        <CorporateStatusWidget />
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`bg-${config.color}-500 p-3 rounded-lg`}>
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Related Documents</p>
              <p className="text-2xl font-bold text-gray-900">{categoryDocuments.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`bg-${config.color}-500 p-3 rounded-lg`}>
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available Tools</p>
              <p className="text-2xl font-bold text-gray-900">{allIntegrations.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`bg-${config.color}-500 p-3 rounded-lg`}>
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">OAuth Ready</p>
              <p className="text-2xl font-bold text-gray-900">
                {allIntegrations.filter(int => 
                  ['Google Workspace', 'Google Search Console', 'QuickBooks Online', 'Slack', 'Mailchimp', 'Gusto', 'YouTube'].includes(int.name)
                ).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`bg-${config.color}-500 p-3 rounded-lg`}>
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Contacts</p>
              <p className="text-2xl font-bold text-gray-900">
                {allIntegrations.filter(integration => {
                  const savedContact = localStorage.getItem(`integration-contact-${integration.name.toLowerCase().replace(/\s+/g, '-')}`)
                  return savedContact && JSON.parse(savedContact).name
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Document Actions Widget */}
      <DocumentActionsWidget 
        category={category || ''}
        categoryTitle={config.title}
        color={config.color}
      />

      {/* Integration Tools with OAuth Support */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Integration Tools & OAuth Connections</h2>
            <p className="text-sm text-gray-600 mt-1">
              Secure OAuth integration available for supported services
            </p>
          </div>
          {isMasterAdmin && (
            <div className="text-sm text-blue-600">
              <Settings className="inline h-4 w-4 mr-1" />
              Master Admin: Click settings icon on cards to customize
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allIntegrations.map((integration, index) => (
            <OAuthIntegrationCard
              key={`${integration.name}-${index}`}
              integration={integration}
              color={config.color}
              onEditIntegration={isMasterAdmin ? handleEditIntegration : undefined}
            />
          ))}
        </div>
      </div>

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
          
          <button
            onClick={() => navigate('/oauth')}
            className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-5 w-5 text-gray-600" />
            <span className="text-gray-600 font-medium">Manage OAuth</span>
          </button>
          
          <button
            onClick={() => navigate('/documents')}
            className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="h-5 w-5 text-gray-600" />
            <span className="text-gray-600 font-medium">View Reports</span>
          </button>
        </div>
      </div>

      <IntegrationEditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setSelectedIntegration(null)
        }}
        integration={selectedIntegration}
        onSave={(updatedIntegration) => {
          if (customIntegrations.some(int => int.name === selectedIntegration?.name) || 
              selectedIntegration?.name === 'New Integration') {
            // This is a custom integration or new integration
            if (selectedIntegration?.name === 'New Integration') {
              handleSaveNewIntegration(updatedIntegration)
            } else {
              handleSaveIntegration(updatedIntegration)
            }
          } else {
            // This is a default integration being customized
            handleSaveIntegration(updatedIntegration)
          }
        }}
      />
    </div>
  )
}

export default OperationsPage