import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  ChevronDown,
  ChevronRight,
  Building2,
  Settings,
  Shield,
  Flag,
  LayoutGrid
} from 'lucide-react'
import { useUserManagement } from '../../hooks'
import { useVerticalDashboard } from '../../hooks'
import { useVertical } from '../../contexts/VerticalContext'

const CollapsibleSidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAdmin, userProfile } = useUserManagement()
  const { coreSectionTitle } = useVerticalDashboard()
  const { vertical } = useVertical()
  
  // Load initial state from sessionStorage, default to expanded
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = sessionStorage.getItem('sidebar-expanded')
    return saved !== null ? JSON.parse(saved) : true
  })
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['departments', 'operations']))
  const [isMobileOverlay, setIsMobileOverlay] = useState(false)

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

  const { departmentStructure, departmentStructureLoading } = useVertical()

  // Use database-driven structure if available, fall back to config
  const primaryNav = departmentStructure?.documents || vertical.navigation.primaryNav || []
  const coreDepartments = departmentStructure?.departments || vertical.navigation.departmentNav || []
  const operationsCategories = departmentStructure?.operations || vertical.navigation.operationsNav || []
  const adminItems = departmentStructure?.admin || vertical.navigation.adminNav || []

  // Debug logging to verify department structure from database
  useEffect(() => {
    console.log('[CollapsibleSidebar] Department structure:', {
      usingDatabase: !!departmentStructure,
      loading: departmentStructureLoading,
      primaryNav: primaryNav.map(d => ({ id: d.id, name: d.name, customName: (d as any).customName })),
      departments: coreDepartments.map(d => ({ id: d.id, name: d.name, customName: (d as any).customName, displayName: (d as any).customName || d.name })),
      operations: operationsCategories.map(d => ({ id: d.id, name: d.name, customName: (d as any).customName, displayName: (d as any).customName || d.name })),
      admin: adminItems.map(d => ({ id: d.id, name: d.name, customName: (d as any).customName }))
    })
  }, [departmentStructure, departmentStructureLoading, primaryNav, coreDepartments, operationsCategories, adminItems])

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
        <nav className="space-y-1">
          {/* Primary Navigation */}
          {primaryNav.map((item) => {
            if (!hasRoleAccess(item.requiredRole)) return null
            const Icon = item.icon
            return (
              <div key={item.id} className="px-3">
                <button
                  onClick={() => item.route && handleNavigation(item.route)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                    item.route && isActive(item.route)
                      ? 'text-purple-600 bg-purple-50 font-medium'
                      : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                  }`}
                  title={!isExpanded ? ((item as any).customName || item.name) : undefined}
                >
                  {Icon && <Icon className={`h-5 w-5 flex-shrink-0 ${item.route && isActive(item.route) ? 'text-purple-600' : 'text-gray-500'}`} />}
                  {isExpanded && <span className="text-sm">{(item as any).customName || item.name}</span>}
                </button>
              </div>
            )
          })}

          {/* Core Business Departments */}
          <div className="px-3 mt-4">
            <button
              onClick={() => isExpanded && toggleSection('departments')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors duration-200 ${
                location.pathname.startsWith('/department')
                  ? 'text-purple-600 bg-purple-50 font-medium'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
              title={!isExpanded ? coreSectionTitle : undefined}
            >
              <div className="flex items-center gap-3">
                <Building2 className={`h-5 w-5 flex-shrink-0 ${location.pathname.startsWith('/department') ? 'text-purple-600' : 'text-gray-500'}`} />
                {isExpanded && <span className="text-sm font-medium">{coreSectionTitle}</span>}
              </div>
              {isExpanded && (
                expandedSections.has('departments')
                  ? <ChevronDown className="h-4 w-4" />
                  : <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            {isExpanded && expandedSections.has('departments') && (
              <div className="mt-1 ml-4 space-y-1">
                {coreDepartments.map((dept) => {
                  if (!hasRoleAccess(dept.requiredRole)) return null
                  const DeptIcon = dept.icon
                  return (
                    <button
                      key={dept.id}
                      onClick={() => dept.route && handleNavigation(dept.route)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors duration-200 ${
                        dept.route && isActive(dept.route)
                          ? 'text-purple-600 bg-purple-50 font-medium'
                          : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                      }`}
                      title={(dept as any).customName || dept.name}
                    >
                      {DeptIcon && <DeptIcon className={`h-4 w-4 flex-shrink-0 ${dept.route && isActive(dept.route) ? 'text-purple-600' : 'text-gray-500'}`} />}
                      <span className="truncate">{(dept as any).customName || dept.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>


          {/* Operations Center */}
          <div className="px-3 mt-2">
            <button
              onClick={() => isExpanded ? toggleSection('operations') : handleNavigation('/operations')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors duration-200 ${
                location.pathname.startsWith('/operations')
                  ? 'text-purple-600 bg-purple-50 font-medium'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
              title={!isExpanded ? 'Operations Center' : undefined}
            >
              <div className="flex items-center gap-3">
                <Settings className={`h-5 w-5 flex-shrink-0 ${location.pathname.startsWith('/operations') ? 'text-purple-600' : 'text-gray-500'}`} />
                {isExpanded && <span className="text-sm font-medium">Operations Center</span>}
              </div>
              {isExpanded && (
                expandedSections.has('operations')
                  ? <ChevronDown className="h-4 w-4" />
                  : <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            {isExpanded && expandedSections.has('operations') && (
              <div className="mt-1 ml-4 space-y-1">
                {operationsCategories.map((op) => {
                  if (!hasRoleAccess(op.requiredRole)) return null
                  const OpIcon = op.icon
                  return (
                    <button
                      key={op.id}
                      onClick={() => op.route && handleNavigation(op.route)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors duration-200 ${
                        op.route && isActive(op.route)
                          ? 'text-purple-600 bg-purple-50 font-medium'
                          : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                      }`}
                      title={(op as any).customName || op.name}
                    >
                      {OpIcon && <OpIcon className={`h-4 w-4 flex-shrink-0 ${op.route && isActive(op.route) ? 'text-purple-600' : 'text-gray-500'}`} />}
                      <span className="truncate">{(op as any).customName || op.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Admin Section */}
          {isAdmin && (
            <div className="px-3 mt-2">
              <button
                onClick={() => isExpanded && toggleSection('admin')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors duration-200 ${
                  location.pathname === '/users' || location.pathname === '/oauth' || location.pathname.startsWith('/settings/organization-customization')
                    ? 'text-purple-600 bg-purple-50 font-medium'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
                title={!isExpanded ? 'Admin' : undefined}
              >
                <div className="flex items-center gap-3">
                  <Shield className={`h-5 w-5 flex-shrink-0 ${(location.pathname === '/users' || location.pathname === '/oauth' || location.pathname.startsWith('/settings/organization-customization')) ? 'text-purple-600' : 'text-gray-500'}`} />
                  {isExpanded && <span className="text-sm font-medium">Admin</span>}
                </div>
                {isExpanded && (
                  expandedSections.has('admin')
                    ? <ChevronDown className="h-4 w-4" />
                    : <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {isExpanded && expandedSections.has('admin') && (
                <div className="mt-1 ml-4 space-y-1">
                  {adminItems.map((item) => {
                    if (!hasRoleAccess(item.requiredRole)) return null
                    const ItemIcon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => item.route && handleNavigation(item.route)}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors duration-200 ${
                          item.route && isActive(item.route)
                            ? 'text-purple-600 bg-purple-50 font-medium'
                            : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                        }`}
                        title={(item as any).customName || item.name}
                      >
                        {ItemIcon && <ItemIcon className={`h-4 w-4 flex-shrink-0 ${item.route && isActive(item.route) ? 'text-purple-600' : 'text-gray-500'}`} />}
                        <span className="truncate">{(item as any).customName || item.name}</span>
                      </button>
                    )
                  })}

                  {/* Feature Flags (Master Admin Only) */}
                  {userProfile?.role === 'master_admin' && (
                    <>
                      <button
                        onClick={() => handleNavigation('/settings/features')}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors duration-200 ${
                          isActive('/settings/features')
                            ? 'text-purple-600 bg-purple-50 font-medium'
                            : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                        }`}
                      >
                        <Flag className={`h-4 w-4 flex-shrink-0 ${isActive('/settings/features') ? 'text-purple-600' : 'text-gray-500'}`} />
                        <span className="truncate">Feature Flags</span>
                      </button>
                      <button
                        onClick={() => handleNavigation('/settings/vertical')}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors duration-200 ${
                          isActive('/settings/vertical')
                            ? 'text-purple-600 bg-purple-50 font-medium'
                            : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                        }`}
                      >
                        <LayoutGrid className={`h-4 w-4 flex-shrink-0 ${isActive('/settings/vertical') ? 'text-purple-600' : 'text-gray-500'}`} />
                        <span className="truncate">Vertical Configuration</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={toggleMobileOverlay}
        className="md:hidden fixed top-20 left-4 z-50 p-2 bg-white text-gray-600 rounded-lg shadow-lg border border-gray-200"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOverlay && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={toggleMobileOverlay} />
          <div className="relative w-80 h-full bg-white shadow-xl">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div
        className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-64' : 'w-16'
        }`}
        style={{ height: 'calc(100vh - 4rem)' }}
      >
        {/* Toggle Button */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200"
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