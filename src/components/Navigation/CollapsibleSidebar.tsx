import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  ChevronDown,
  ChevronRight,
  Building2,
  Settings,
  Plus,
  Eye,
  Shield,
  Flag
} from 'lucide-react'
import { useUserManagement } from '../../hooks'
import { useDepartmentSettings } from '../../hooks/useDepartmentSettings'
import { useVertical } from '../../contexts/VerticalContext'
import DepartmentVisibilityModal from '../Settings/DepartmentVisibilityModal'

const CollapsibleSidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAdmin, userProfile } = useUserManagement()
  const { isDepartmentVisible } = useDepartmentSettings()
  const { vertical } = useVertical()
  
  // Load initial state from sessionStorage, default to expanded
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = sessionStorage.getItem('sidebar-expanded')
    return saved !== null ? JSON.parse(saved) : true
  })
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['departments', 'more-departments']))
  const [isMobileOverlay, setIsMobileOverlay] = useState(false)
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false)

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('sidebar-expanded', JSON.stringify(isExpanded))
  }, [isExpanded])

  // Close mobile overlay when route changes
  useEffect(() => {
    setIsMobileOverlay(false)
  }, [location.pathname])

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded)
    setIsMobileOverlay(false)
  }

  const toggleMobileOverlay = () => {
    setIsMobileOverlay(!isMobileOverlay)
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const primaryNav = vertical.navigation.primaryNav || []
  const coreDepartments = vertical.navigation.departmentNav || []
  const moreDepartments = vertical.navigation.additionalDepartments || []
  const operationsCategories = vertical.navigation.operationsNav || []
  const adminItems = vertical.navigation.adminNav || []

  const visibleMoreDepartments = moreDepartments.filter(dept => isDepartmentVisible(dept.id))

  const hasRoleAccess = (requiredRole?: string): boolean => {
    if (!requiredRole) return true
    if (!userProfile) return false

    if (requiredRole === 'admin') {
      return userProfile.role === 'admin' || userProfile.role === 'master_admin'
    }
    if (requiredRole === 'master_admin') {
      return userProfile.role === 'master_admin'
    }
    return true
  }

  const isActive = (route: string) => {
    return location.pathname === route || 
           (route !== '/' && location.pathname.startsWith(route))
  }

  const handleNavigation = (route: string) => {
    navigate(route)
    if (window.innerWidth < 768) {
      setIsMobileOverlay(false)
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-2">
          {/* Primary Navigation */}
          {primaryNav.map((item) => {
            if (!hasRoleAccess(item.requiredRole)) return null
            const Icon = item.icon
            return (
              <div key={item.id} className="px-4">
                <button
                  onClick={() => item.route && handleNavigation(item.route)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    item.route && isActive(item.route)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-600'
                  }`}
                  title={!isExpanded ? item.name : undefined}
                >
                  {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
                  {isExpanded && <span className="font-medium">{item.name}</span>}
                </button>
              </div>
            )
          })}

          {/* Core Business Departments */}
          <div className="px-4">
            <button
              onClick={() => isExpanded && toggleSection('departments')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                location.pathname.startsWith('/department')
                  ? 'bg-gray-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-600'
              }`}
              title={!isExpanded ? 'Core Departments' : undefined}
            >
              <div className="flex items-center space-x-3">
                <Building2 className="h-5 w-5 flex-shrink-0" />
                {isExpanded && <span className="font-medium">Core Departments</span>}
              </div>
              {isExpanded && (
                expandedSections.has('departments') 
                  ? <ChevronDown className="h-4 w-4" />
                  : <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            {isExpanded && expandedSections.has('departments') && (
              <div className="mt-2 ml-6 space-y-1">
                {coreDepartments.map((dept) => {
                  if (!hasRoleAccess(dept.requiredRole)) return null
                  const DeptIcon = dept.icon
                  return (
                    <button
                      key={dept.id}
                      onClick={() => dept.route && handleNavigation(dept.route)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        dept.route && isActive(dept.route)
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-600'
                      }`}
                    >
                      {DeptIcon && <DeptIcon className="h-4 w-4 flex-shrink-0" />}
                      <span className="truncate">{dept.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* More Departments */}
          {(visibleMoreDepartments.length > 0 || isAdmin) && (
            <div className="px-4">
              <button
                onClick={() => isExpanded && toggleSection('more-departments')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  visibleMoreDepartments.some(dept => dept.route && isActive(dept.route))
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
                title={!isExpanded ? 'More Departments' : undefined}
              >
                <div className="flex items-center space-x-3">
                  <Plus className="h-5 w-5 flex-shrink-0" />
                  {isExpanded && <span className="font-medium">More Departments</span>}
                </div>
                {isExpanded && (
                  expandedSections.has('more-departments') 
                    ? <ChevronDown className="h-4 w-4" />
                    : <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {isExpanded && expandedSections.has('more-departments') && (
                <div className="mt-2 ml-6 space-y-1">
                  {visibleMoreDepartments.map((dept) => {
                    if (!hasRoleAccess(dept.requiredRole)) return null
                    const DeptIcon = dept.icon
                    return (
                      <button
                        key={dept.id}
                        onClick={() => dept.route && handleNavigation(dept.route)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          dept.route && isActive(dept.route)
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-600'
                        }`}
                      >
                        {DeptIcon && <DeptIcon className="h-4 w-4 flex-shrink-0" />}
                        <span className="truncate">{dept.name}</span>
                      </button>
                    )
                  })}
                  
                  {/* Department Settings Button (Admin Only) */}
                  {isAdmin && (
                    <button
                      onClick={() => setDepartmentModalOpen(true)}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors text-gray-400 hover:text-white hover:bg-gray-600"
                    >
                      <Eye className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">Manage Departments</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Operations Center */}
          <div className="px-4">
            <button
              onClick={() => isExpanded ? toggleSection('operations') : handleNavigation('/operations')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                location.pathname.startsWith('/operations')
                  ? 'bg-gray-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-600'
              }`}
              title={!isExpanded ? 'Operations Center' : undefined}
            >
              <div className="flex items-center space-x-3">
                <Settings className="h-5 w-5 flex-shrink-0" />
                {isExpanded && <span className="font-medium">Operations Center</span>}
              </div>
              {isExpanded && (
                expandedSections.has('operations') 
                  ? <ChevronDown className="h-4 w-4" />
                  : <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            {isExpanded && expandedSections.has('operations') && (
              <div className="mt-2 ml-6 space-y-1">
                {operationsCategories.map((op) => {
                  if (!hasRoleAccess(op.requiredRole)) return null
                  const OpIcon = op.icon
                  return (
                    <button
                      key={op.id}
                      onClick={() => op.route && handleNavigation(op.route)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        op.route && isActive(op.route)
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-600'
                      }`}
                    >
                      {OpIcon && <OpIcon className="h-4 w-4 flex-shrink-0" />}
                      <span className="truncate">{op.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Admin Section */}
          {isAdmin && (
            <div className="px-4">
              <button
                onClick={() => isExpanded && toggleSection('admin')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === '/users' || location.pathname === '/oauth'
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
                title={!isExpanded ? 'Admin' : undefined}
              >
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 flex-shrink-0" />
                  {isExpanded && <span className="font-medium">Admin</span>}
                </div>
                {isExpanded && (
                  expandedSections.has('admin') 
                    ? <ChevronDown className="h-4 w-4" />
                    : <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {isExpanded && expandedSections.has('admin') && (
                <div className="mt-2 ml-6 space-y-1">
                  {adminItems.map((item) => {
                    if (!hasRoleAccess(item.requiredRole)) return null
                    const ItemIcon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => item.route && handleNavigation(item.route)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          item.route && isActive(item.route)
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-600'
                        }`}
                      >
                        {ItemIcon && <ItemIcon className="h-4 w-4 flex-shrink-0" />}
                        <span className="truncate">{item.name}</span>
                      </button>
                    )
                  })}

                  {/* Feature Flags (Master Admin Only) */}
                  {userProfile?.role === 'master_admin' && (
                    <button
                      onClick={() => handleNavigation('/settings/features')}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive('/settings/features')
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-600'
                      }`}
                    >
                      <Flag className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">Feature Flags</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </nav>
      </div>

      {/* Department Visibility Modal */}
      <DepartmentVisibilityModal
        isOpen={departmentModalOpen}
        onClose={() => setDepartmentModalOpen(false)}
      />
    </div>
  )

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={toggleMobileOverlay}
        className="md:hidden fixed top-20 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg shadow-lg"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOverlay && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={toggleMobileOverlay} />
          <div className="relative w-80 h-full bg-gray-800 shadow-xl">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div 
        className={`hidden md:flex flex-col bg-gray-800 border-r border-gray-600 transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-64' : 'w-16'
        }`}
        style={{ height: 'calc(100vh - 4rem)' }} // Account for top navigation height
      >
        {/* Toggle Button */}
        <div className="p-4 border-b border-gray-600">
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <SidebarContent />
      </div>
    </>
  )
}

export default CollapsibleSidebar