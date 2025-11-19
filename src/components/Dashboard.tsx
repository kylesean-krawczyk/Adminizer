import { Settings, Building2, Info, GitBranch, Shield, FileText, Clock, Users, CheckCircle } from 'lucide-react'
import { useDocuments } from '../hooks'
import { useUserManagement } from '../hooks'
import { useVerticalDashboard } from '../hooks'
import { useTerminology } from '../hooks'
import { usePageContext } from '../contexts/PageContextContext'
import { format, isAfter, isBefore, addDays } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { APP_VERSION, getVersionInfo } from '../lib/version'
import { useVertical } from '../contexts/VerticalContext'
import { useEffect } from 'react'
import ProfileLoadingCard from './UserManagement/ProfileLoadingCard'
import ProfileErrorCard from './UserManagement/ProfileErrorCard'
import SuperAdminVerticalSwitcher from './Admin/SuperAdminVerticalSwitcher'

const Dashboard = () => {
  const { documents, loading: documentsLoading } = useDocuments()
  const {
    userProfile,
    organization,
    loading: userLoading,
    loadingMessage,
    recoveryState,
    isAdmin,
    createProfileManually,
    refetch
  } = useUserManagement()
  const {
    title: dashboardTitle,
    subtitle: dashboardSubtitle,
    stats: dashboardStats,
    coreDepartments,
    additionalDepartments
  } = useVerticalDashboard()
  const { term } = useTerminology()
  const navigate = useNavigate()
  const { vertical, customizationLoaded } = useVertical()
  const { updateContext } = usePageContext()

  const loading = documentsLoading || userLoading
  const versionInfo = getVersionInfo()

  // Debug logging for customization state
  useEffect(() => {
    if (customizationLoaded) {
      console.log('[Dashboard] Customization loaded. Dashboard config:', {
        title: dashboardTitle,
        subtitle: dashboardSubtitle,
        statsCount: dashboardStats.length,
        coreDepartmentsCount: coreDepartments.length,
        additionalDepartmentsCount: additionalDepartments.length
      })
    }
  }, [customizationLoaded, dashboardTitle, dashboardSubtitle, dashboardStats, coreDepartments, additionalDepartments])

  // Show loading card with retry progress
  if (userLoading && recoveryState.isRecovering) {
    return (
      <ProfileLoadingCard
        currentAttempt={recoveryState.currentAttempt}
        maxAttempts={recoveryState.maxAttempts}
        message={loadingMessage}
        showRetryIndicator={recoveryState.currentAttempt > 1}
      />
    )
  }

  // Show error card if profile recovery failed
  if (!userLoading && recoveryState.lastError && !userProfile) {
    return (
      <ProfileErrorCard
        error={recoveryState.lastError}
        onRetry={refetch}
        onManualSetup={createProfileManually}
        isRetrying={recoveryState.isRecovering}
      />
    )
  }

  // Calculate metrics based on document data
  const calculateMetricValue = (metricType: string): number => {
    switch (metricType) {
      case 'documents':
        return documents.length
      case 'expiring':
        return documents.filter(doc => {
          if (!doc.expiry_date) return false
          const expiryDate = new Date(doc.expiry_date)
          const thirtyDaysFromNow = addDays(new Date(), 30)
          return isAfter(expiryDate, new Date()) && isBefore(expiryDate, thirtyDaysFromNow)
        }).length
      case 'overdue':
        return documents.filter(doc => {
          if (!doc.expiry_date) return false
          return isBefore(new Date(doc.expiry_date), new Date())
        }).length
      case 'categories':
        return new Set(documents.map(d => d.category)).size
      case 'custom':
        return 0
      default:
        return 0
    }
  }

  const stats = dashboardStats.map(statConfig => ({
    label: statConfig.label,
    value: calculateMetricValue(statConfig.metricType).toString(),
    icon: statConfig.icon,
    color: statConfig.color
  }))

  useEffect(() => {
    updateContext({
      pageType: 'dashboard',
      route: '/',
      stats: {
        totalDocuments: calculateMetricValue('documents'),
        expiringSoon: calculateMetricValue('expiring'),
        overdue: calculateMetricValue('overdue'),
        categories: calculateMetricValue('categories')
      },
      recentActions: ['viewed_dashboard', 'checked_stats']
    })
  }, [documents, updateContext])

  // Combine all departments from vertical configuration
  const allDepartments = [...coreDepartments, ...additionalDepartments]

  // Get recent documents (last 5)
  const recentDocuments = documents.slice(0, 5)

  // Get upcoming renewals
  const upcomingRenewals = documents
    .filter(doc => doc.expiry_date)
    .sort((a, b) => new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime())
    .slice(0, 5)

  const handleDepartmentClick = (route: string) => {
    navigate(route)
  }

  const handleOperationsClick = () => {
    navigate('/operations')
  }

  // Show organization setup if user doesn't have one
  if (!loading && userProfile && !userProfile.organization_id) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome to Adminizer</h2>
          <p className="text-gray-600 mt-2">Let's get you set up with your organization</p>
        </div>

        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="bg-blue-100 rounded-full p-6 mx-auto w-24 h-24 flex items-center justify-center mb-6">
            <Users className="h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Set up your organization
          </h3>
          <p className="text-gray-600 mb-6">
            Create or join an organization to start managing documents and collaborating with your team.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/users')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Set Up Organization
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">Welcome to your organization dashboard</p>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow p-8">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Admin Role Badge - Show for admins */}
      {userProfile && userProfile.role === 'master_admin' && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Super Administrator Access</h3>
                <p className="text-purple-100 text-sm">
                  You have full administrative privileges across all features
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <SuperAdminVerticalSwitcher />
              <div className="flex items-center space-x-2 border-l border-white/30 pl-4">
                <span className="bg-white/20 px-3 py-1 rounded-full text-white text-sm font-medium">
                  {userProfile.email}
                </span>
                <CheckCircle className="h-5 w-5 text-green-300" />
              </div>
            </div>
          </div>
        </div>
      )}

      {userProfile && userProfile.role === 'admin' && (
        <div className="bg-blue-600 rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Administrator Access</h3>
                <p className="text-blue-100 text-sm">
                  You have administrative privileges for your organization
                </p>
              </div>
            </div>
            <span className="bg-white/20 px-3 py-1 rounded-full text-white text-sm font-medium">
              {userProfile.email}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-2">
            {term('welcomeMessage', { capitalize: 'first' })}
            {organization && (
              <span className="block text-sm text-blue-600 mt-1">
                {organization.name}
              </span>
            )}
            {userProfile && userProfile.full_name && (
              <span className="block text-sm text-gray-500 mt-1">
                Welcome back, {userProfile.full_name}
              </span>
            )}
          </p>
        </div>

        {/* Version Info */}
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Info className="h-4 w-4" />
          <span>v{APP_VERSION}</span>
          <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
            {versionInfo.environment}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Business Departments */}
      <div className="bg-white rounded-lg shadow p-8">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900">{dashboardTitle}</h3>
          <p className="text-gray-600 mt-2">{dashboardSubtitle}</p>
        </div>

        <div className="department-card-grid">
          {allDepartments.map((department) => (
            <button
              key={department.id}
              onClick={() => handleDepartmentClick(department.route)}
              className="department-card"
              style={{
                '--card-border-color': vertical.branding.colors.borders,
                '--card-hover-border-color': vertical.branding.colors.primary,
                '--card-icon-color': vertical.branding.colors.accent,
                '--card-hover-icon-color': vertical.branding.colors.primary,
                '--card-hover-title-color': vertical.branding.colors.primary,
                '--card-description-color': vertical.branding.colors.text.secondary
              } as React.CSSProperties}
              aria-label={`Navigate to ${department.name}: ${department.description}`}
            >
              <div className="department-card-icon">
                <department.icon className="h-12 w-12" />
              </div>
              <h4 className="department-card-title">
                {department.name}
              </h4>
              <p className="department-card-description">
                {department.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Operations Access */}
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{term('businessOperations', { capitalize: 'title' })}</h3>
            <p className="text-gray-600 mt-2">Access administrative and operational tools</p>
          </div>
          <button
            onClick={handleOperationsClick}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-white transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="flex items-center space-x-3">
              <Building2 className="h-6 w-6" />
              <span className="text-lg font-semibold">Operations Center</span>
            </div>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-blue-900 mb-2">{term('operations', { capitalize: 'title' })} Center</h4>
                <p className="text-blue-800 mb-4">
                  Access HR, Accounting, Legal, IT, and other administrative functions.
                  Manage integrations, compliance, and {term('organization')} {term('operations')}.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm">HR Management</span>
                  <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm">Financial Operations</span>
                  <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm">Legal Compliance</span>
                  <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm">IT & Technology</span>
                </div>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-green-50 rounded-lg p-6 border-2 border-green-100">
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 rounded-lg p-3">
                  <GitBranch className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-green-900 mb-2">{term('employee', { capitalize: 'first' })} Onboarding Workflows</h4>
                  <p className="text-green-800 mb-4">
                    Automate your onboarding process with AI-guided workflows. Collect information, get approvals, and set up new {term('employees')} systematically.
                  </p>
                  <button
                    onClick={() => navigate('/workflows')}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <GitBranch className="h-4 w-4" />
                    <span>Manage Workflows</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Documents</h3>
            <button 
              onClick={() => navigate('/documents')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all
            </button>
          </div>
          <div className="space-y-3">
            {recentDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm mb-4">No documents uploaded yet</p>
                <button
                  onClick={() => navigate('/upload')}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Upload your first document
                </button>
              </div>
            ) : (
              recentDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                    <p className="text-sm text-gray-600">{doc.category}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(new Date(doc.created_at), 'MMM dd')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Renewals</h3>
            <button 
              onClick={() => navigate('/documents')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Manage
            </button>
          </div>
          <div className="space-y-3">
            {upcomingRenewals.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm mb-4">No documents with expiry dates</p>
                <button
                  onClick={() => navigate('/upload')}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Add documents with expiry dates
                </button>
              </div>
            ) : (
              upcomingRenewals.map((doc) => {
                const expiryDate = new Date(doc.expiry_date!)
                const isOverdue = isBefore(expiryDate, new Date())
                const isExpiringSoon = !isOverdue && isBefore(expiryDate, addDays(new Date(), 30))
                
                return (
                  <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <p className="text-sm text-gray-600">
                        Expires: {format(expiryDate, 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      isOverdue ? 'bg-red-100 text-red-800' :
                      isExpiringSoon ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {isOverdue ? 'overdue' : isExpiringSoon ? 'soon' : 'ok'}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard