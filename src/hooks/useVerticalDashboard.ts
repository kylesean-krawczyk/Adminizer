import { useVertical } from '../contexts/VerticalContext'
import { DashboardConfig, DepartmentButton, DashboardStatCard } from '../config/types'

export interface UseVerticalDashboardReturn {
  dashboardConfig: DashboardConfig
  getDepartmentById: (id: string) => DepartmentButton | undefined
  getStatById: (id: string) => DashboardStatCard | undefined
  coreDepartments: DepartmentButton[]
  additionalDepartments: DepartmentButton[]
  stats: DashboardStatCard[]
  title: string
  subtitle: string
  coreSectionTitle: string
  additionalSectionTitle: string
}

export function useVerticalDashboard(): UseVerticalDashboardReturn {
  const { vertical, departmentStructure } = useVertical()
  const dashboardConfig = vertical.dashboardConfig

  // Use database-driven structure if available, fall back to config
  // Convert merged departments to DepartmentButton format for dashboard
  const coreDepartments: DepartmentButton[] = departmentStructure?.departments
    ? departmentStructure.departments.map(dept => ({
        id: dept.id,
        name: dept.name,
        description: dept.description || '',
        icon: dept.icon,
        color: dept.color || 'bg-gray-600 hover:bg-gray-700',
        textColor: dept.color ? `text-${dept.color}-600` : 'text-gray-600',
        bgColor: dept.color ? `bg-${dept.color}-50` : 'bg-gray-50',
        route: dept.route || `/department/${dept.id}`,
        requiredFeature: dept.requiredFeature
      }))
    : dashboardConfig.coreDepartments

  const getDepartmentById = (id: string): DepartmentButton | undefined => {
    const allDepartments = [
      ...coreDepartments,
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
    coreDepartments,
    additionalDepartments: dashboardConfig.additionalDepartments,
    stats: dashboardConfig.stats,
    title: dashboardConfig.title,
    subtitle: dashboardConfig.subtitle,
    coreSectionTitle: dashboardConfig.coreSectionTitle,
    additionalSectionTitle: dashboardConfig.additionalSectionTitle
  }
}
