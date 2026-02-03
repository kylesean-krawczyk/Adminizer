import { useVertical } from '../contexts/VerticalContext'
import { DashboardConfig, DepartmentButton, DashboardStatCard, NavigationItem } from '../config/types'
import { MergedDepartment } from '../utils/departmentMerger'
import { FileText } from 'lucide-react'

export interface UseVerticalDashboardReturn {
  dashboardConfig: DashboardConfig
  getDepartmentById: (id: string) => DepartmentButton | undefined
  getStatById: (id: string) => DashboardStatCard | undefined
  coreDepartments: DepartmentButton[]
  additionalDepartments: DepartmentButton[]
  operationsDepartments: DepartmentButton[]
  adminDepartments: DepartmentButton[]
  primaryNav: DepartmentButton[]
  stats: DashboardStatCard[]
  title: string
  subtitle: string
  coreSectionTitle: string
  additionalSectionTitle: string
}

/**
 * Helper to convert merged department to DepartmentButton format
 * Prioritizes custom names/descriptions from database over defaults
 */
const toDepartmentButton = (dept: MergedDepartment): DepartmentButton => ({
  id: dept.id,
  name: dept.customName || dept.name,
  description: dept.customDescription || dept.description || '',
  icon: dept.icon,
  color: dept.color || 'bg-gray-600 hover:bg-gray-700',
  textColor: dept.color ? `text-${dept.color}-600` : 'text-gray-600',
  bgColor: dept.color ? `bg-${dept.color}-50` : 'bg-gray-50',
  route: dept.route || `/department/${dept.id}`,
  requiredRole: dept.requiredRole,
  requiredFeature: dept.requiredFeature
})

/**
 * Helper to convert navigation item to DepartmentButton format
 */
const navToDepartmentButton = (item: NavigationItem): DepartmentButton => ({
  id: item.id,
  name: item.name,
  description: item.description || '',
  icon: item.icon || FileText,
  color: item.color || 'bg-gray-600 hover:bg-gray-700',
  textColor: item.color ? `text-${item.color}-600` : 'text-gray-600',
  bgColor: item.color ? `bg-${item.color}-50` : 'bg-gray-50',
  route: item.route || `/${item.id}`,
  requiredRole: item.requiredRole,
  requiredFeature: item.requiredFeature
})

export function useVerticalDashboard(): UseVerticalDashboardReturn {
  const { vertical, departmentStructure } = useVertical()
  const dashboardConfig = vertical.dashboardConfig

  console.log('[useVerticalDashboard] Department structure:', {
    hasStructure: !!departmentStructure,
    documents: departmentStructure?.documents?.length || 0,
    departments: departmentStructure?.departments?.length || 0,
    operations: departmentStructure?.operations?.length || 0,
    admin: departmentStructure?.admin?.length || 0
  })

  // Debug: Log custom names being applied
  if (departmentStructure?.departments) {
    const customizedDepts = departmentStructure.departments.filter(d => d.customName)
    if (customizedDepts.length > 0) {
      console.log('[useVerticalDashboard] Applying custom names to departments:',
        customizedDepts.map(d => ({
          id: d.id,
          defaultName: d.name,
          customName: d.customName,
          willDisplay: d.customName || d.name
        }))
      )
    }
  }

  if (departmentStructure?.operations) {
    const customizedOps = departmentStructure.operations.filter(d => d.customName)
    if (customizedOps.length > 0) {
      console.log('[useVerticalDashboard] Applying custom names to operations:',
        customizedOps.map(d => ({
          id: d.id,
          defaultName: d.name,
          customName: d.customName,
          willDisplay: d.customName || d.name
        }))
      )
    }
  }

  // Use database-driven structure if available, fall back to config
  // Convert all sections to DepartmentButton format for dashboard
  const primaryNav: DepartmentButton[] = departmentStructure?.documents
    ? departmentStructure.documents.map(toDepartmentButton)
    : (vertical.navigation.primaryNav || []).map(navToDepartmentButton)

  const coreDepartments: DepartmentButton[] = departmentStructure?.departments
    ? departmentStructure.departments.map(toDepartmentButton)
    : dashboardConfig.coreDepartments

  const operationsDepartments: DepartmentButton[] = departmentStructure?.operations
    ? departmentStructure.operations.map(toDepartmentButton)
    : (vertical.navigation.operationsNav || []).map(navToDepartmentButton)

  const adminDepartments: DepartmentButton[] = departmentStructure?.admin
    ? departmentStructure.admin.map(toDepartmentButton)
    : (vertical.navigation.adminNav || []).map(navToDepartmentButton)

  const getDepartmentById = (id: string): DepartmentButton | undefined => {
    const allDepartments = [
      ...primaryNav,
      ...coreDepartments,
      ...operationsDepartments,
      ...adminDepartments,
      ...dashboardConfig.additionalDepartments
    ]
    return allDepartments.find(dept => dept.id === id)
  }

  const getStatById = (id: string): DashboardStatCard | undefined => {
    return dashboardConfig.stats.find(stat => stat.id === id)
  }

  return {
    dashboardConfig,
    getDepartmentById,
    getStatById,
    primaryNav,
    coreDepartments,
    operationsDepartments,
    adminDepartments,
    additionalDepartments: dashboardConfig.additionalDepartments,
    stats: dashboardConfig.stats,
    title: dashboardConfig.title,
    subtitle: dashboardConfig.subtitle,
    coreSectionTitle: dashboardConfig.coreSectionTitle,
    additionalSectionTitle: dashboardConfig.additionalSectionTitle
  }
}
