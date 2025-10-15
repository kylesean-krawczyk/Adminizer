import { LogOut, User, Bell } from 'lucide-react'
import { useAuth } from '../contexts/DemoAuthContext'
import { useUserManagement, useTheme, useTerminology } from '../hooks'
import { useRequestNotifications } from '../hooks/useRequestNotifications'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LogoUpload from './Navigation/LogoUpload'
import CustomLogo from './Navigation/CustomLogo'
import NotificationCenter from './Notifications/NotificationCenter'

const Navigation = () => {
  const { user, signOut } = useAuth()
  const { userProfile, isAdmin } = useUserManagement()
  const { term } = useTerminology()
  const { colors } = useTheme()
  const { notifications, hasPendingRequests } = useRequestNotifications()
  const navigate = useNavigate()
  const [customLogo, setCustomLogo] = useState<string | null>(null)
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)

  // Load custom logo from localStorage on component mount
  useEffect(() => {
    const savedLogo = localStorage.getItem('custom-logo')
    if (savedLogo) {
      setCustomLogo(savedLogo)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleLogoChange = (logoUrl: string | null) => {
    setCustomLogo(logoUrl)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'master_admin':
        return { text: `Master ${term('admin', { capitalize: 'first' })}`, color: 'bg-purple-100 text-purple-800' }
      case 'admin':
        return { text: term('admin', { capitalize: 'first' }), color: 'bg-blue-100 text-blue-800' }
      default:
        return { text: term('user', { capitalize: 'first' }), color: 'bg-gray-100 text-gray-800' }
    }
  }

  const roleBadge = userProfile ? getRoleBadge(userProfile.role) : null

  return (
    <nav style={{ backgroundColor: colors.surface, borderColor: colors.borders }} className="shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CustomLogo logoUrl={customLogo || ''} />
                <LogoUpload 
                  currentLogo={customLogo || undefined}
                  onLogoChange={handleLogoChange}
                  isAdmin={isAdmin}
                />
              </div>
              
              {/* Version Indicator */}
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                v2.1.0
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationCenter />

            {isAdmin && hasPendingRequests && (
              <div className="relative">
                <button
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="View pending access requests"
                >
                  <Bell className="h-5 w-5" />
                  <span className={`absolute -top-1 -right-1 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold ${
                    notifications.badgeColor === 'red' ? 'bg-red-500' :
                    notifications.badgeColor === 'orange' ? 'bg-orange-500' :
                    notifications.badgeColor === 'blue' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`}>
                    {notifications.badgeText}
                  </span>
                </button>

                {showNotificationDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowNotificationDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Pending Access Requests</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {notifications.total} request{notifications.total !== 1 ? 's' : ''} waiting for review
                        </p>
                      </div>
                      <div className="p-4 space-y-3">
                        {notifications.urgent > 0 && (
                          <div className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-100">
                            <div>
                              <p className="text-sm font-medium text-red-900">Urgent Priority</p>
                              <p className="text-xs text-red-600">{notifications.urgent} request{notifications.urgent !== 1 ? 's' : ''}</p>
                            </div>
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                              {notifications.urgent}
                            </span>
                          </div>
                        )}
                        {notifications.high > 0 && (
                          <div className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-100">
                            <div>
                              <p className="text-sm font-medium text-orange-900">High Priority</p>
                              <p className="text-xs text-orange-600">{notifications.high} request{notifications.high !== 1 ? 's' : ''}</p>
                            </div>
                            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                              {notifications.high}
                            </span>
                          </div>
                        )}
                        {notifications.normal > 0 && (
                          <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-100">
                            <div>
                              <p className="text-sm font-medium text-blue-900">Normal Priority</p>
                              <p className="text-xs text-blue-600">{notifications.normal} request{notifications.normal !== 1 ? 's' : ''}</p>
                            </div>
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                              {notifications.normal}
                            </span>
                          </div>
                        )}
                        {notifications.low > 0 && (
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Low Priority</p>
                              <p className="text-xs text-gray-600">{notifications.low} request{notifications.low !== 1 ? 's' : ''}</p>
                            </div>
                            <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                              {notifications.low}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setShowNotificationDropdown(false)
                            navigate('/user-management')
                          }}
                          className="w-full px-3 py-2 text-sm text-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        >
                          View All Requests
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <User size={16} />
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    {userProfile?.full_name || user?.email}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">{user?.email}</span>
                    {roleBadge && (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${roleBadge.color}`}>
                        {roleBadge.text}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation