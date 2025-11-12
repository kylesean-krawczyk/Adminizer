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
  const { vertical } = useVertical()
  const dashboardConfig = vertical.dashboardConfig

  const getDepartmentById = (id: string): DepartmentButton | undefined => {
    const allDepartments = [
      ...dashboardConfig.coreDepartments,
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
    coreDepartments: dashboardConfig.coreDepartments,
    additionalDepartments: dashboardConfig.additionalDepartments,
    stats: dashboardConfig.stats,
    title: dashboardConfig.title,
    subtitle: dashboardConfig.subtitle,
    coreSectionTitle: dashboardConfig.coreSectionTitle,
    additionalSectionTitle: dashboardConfig.additionalSectionTitle
  }
}
