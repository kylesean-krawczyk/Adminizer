import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings, FileText, Lock, TrendingUp, BarChart3, Brain } from 'lucide-react'
import { useDocuments } from '../../hooks'
import { useUserManagement } from '../../hooks'
import { useTerminology } from '../../hooks'
import { useFeature } from '../../contexts/FeatureFlagContext'
import { useVertical } from '../../contexts/VerticalContext'
import DocumentActionsWidget from '../Operations/DocumentActionsWidget'
import SalesAnalyticsPlatform from '../SalesAnalytics/SalesAnalyticsPlatform'
import { getVerticalFeatureMetadata, getVerticalAnalyticsFeatureId, getVerticalComingSoonMessage, getVerticalAccessRestrictedMessage } from '../../utils/verticalFeatures'

const SalesDepartmentPage = () => {
  const navigate = useNavigate()
  const { documents } = useDocuments()
  const { isAdmin } = useUserManagement()
  const { term } = useTerminology()
  const { verticalId } = useVertical()

  const analyticsFeatureId = getVerticalAnalyticsFeatureId(verticalId)
  const hasAnalytics = useFeature(analyticsFeatureId || '')
  const metadata = getVerticalFeatureMetadata(verticalId)

  const departmentConfig = {
    title: metadata.departmentName,
    description: metadata.description,
    color: 'emerald',
    icon: '📈',
    features: [
      `AI-powered ${term('analytics', { fallback: 'analytics' })} and insights`,
      `${term('revenue', { fallback: 'Revenue', capitalize: 'first' })} trend analysis and forecasting`,
      `${term('customer', { fallback: 'Customer', capitalize: 'first' })} retention and ${term('segmentation', { fallback: 'segmentation' })}`,
      'Economic correlation analysis',
      `${term('campaigns', { fallback: 'Campaign', capitalize: 'first' })} optimization recommendations`,
      `Real-time ${term('analytics', { fallback: 'analytics' })} dashboards`,
      `${term('customer', { fallback: 'Customer', capitalize: 'first' })} database management`,
      'Lead and opportunity tracking'
    ]
  }

  const hasAccess = isAdmin && hasAnalytics

  // Filter documents by sales category
  const salesDocuments = documents.filter(doc => 
    doc.category.toLowerCase().includes('sales') ||
    doc.category.toLowerCase().includes('customer') ||
    doc.tags.some(tag => 
      tag.toLowerCase().includes('customer') ||
      tag.toLowerCase().includes('sales') ||
      tag.toLowerCase().includes('revenue')
    )
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
            <h1 className="text-3xl font-bold text-gray-900">{departmentConfig.title}</h1>
            <p className="text-gray-600 mt-1">{departmentConfig.description}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="bg-red-100 rounded-full p-6 mx-auto w-24 h-24 flex items-center justify-center mb-6">
            <Lock className="h-12 w-12 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {!hasAnalytics ? 'Feature Coming Soon' : 'Access Restricted'}
          </h3>
          <p className="text-gray-600 mb-6">
            {!hasAnalytics
              ? getVerticalComingSoonMessage(metadata.name, verticalId)
              : getVerticalAccessRestrictedMessage(departmentConfig.title, verticalId)
            }
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
              <span className="text-2xl">{departmentConfig.icon}</span>
              <span>{departmentConfig.title}</span>
            </h1>
            <p className="text-gray-600 mt-1">{departmentConfig.description}</p>
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
            <div className={`bg-${departmentConfig.color}-500 p-3 rounded-lg`}>
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{departmentConfig.title} Documents</p>
              <p className="text-2xl font-bold text-gray-900">{salesDocuments.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`bg-${departmentConfig.color}-500 p-3 rounded-lg`}>
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">AI Analytics</p>
              <p className="text-2xl font-bold text-gray-900">Active</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`bg-${departmentConfig.color}-500 p-3 rounded-lg`}>
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Forecasting</p>
              <p className="text-2xl font-bold text-gray-900">Enabled</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`bg-${departmentConfig.color}-500 p-3 rounded-lg`}>
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">AI Insights</p>
              <p className="text-2xl font-bold text-gray-900">Ready</p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Features */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{departmentConfig.title} & {metadata.name} Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departmentConfig.features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 bg-${departmentConfig.color}-500 rounded-full`}></div>
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI-Powered Sales Analytics Platform */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Brain className="h-6 w-6 text-purple-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI-Powered {metadata.name}</h2>
            <p className="text-gray-600">Advanced {term('analytics', { fallback: 'analytics' })} platform with AI insights and economic correlation analysis</p>
          </div>
        </div>
        
        {/* Embedded Sales Analytics Platform */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <SalesAnalyticsPlatform />
        </div>
      </div>

      {/* Document Management for Sales */}
      <DocumentActionsWidget 
        category="sales"
        categoryTitle={departmentConfig.title}
        color={departmentConfig.color}
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
            <span className="text-gray-600 font-medium">Upload {departmentConfig.title} Documents</span>
          </button>
          
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            <span className="text-gray-600 font-medium">Generate Reports</span>
          </button>
          
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors">
            <Settings className="h-5 w-5 text-gray-600" />
            <span className="text-gray-600 font-medium">Analytics Settings</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default SalesDepartmentPage