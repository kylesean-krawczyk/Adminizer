import { VerticalConfig, NavigationItem } from '../config/types'
import { DepartmentSectionAssignment, SectionId } from '../types/departmentAssignments'
import { getDefaultSection, getDefaultOrder } from './departmentSectionDefaults'

export interface MergedDepartment {
  // Base properties from config (immutable)
  id: string
  defaultName: string
  defaultDescription?: string
  icon: any
  route?: string
  color?: string
  requiredRole?: 'user' | 'admin' | 'master_admin'
  requiredFeature?: string

  // Database overrides (customizable)
  name: string
  description?: string
  sectionId: SectionId
  displayOrder: number
  isVisible: boolean

  // Metadata
  hasCustomization: boolean
  customName?: string | null
  customDescription?: string | null
  updatedAt?: string
}

export interface SectionedDepartments {
  documents: MergedDepartment[]
  departments: MergedDepartment[]
  operations: MergedDepartment[]
  admin: MergedDepartment[]
}

/**
 * Merges base vertical configuration with database assignments
 * Database assignments override default names, descriptions, visibility, and section placement
 * Base config provides icons, routes, colors that cannot be overridden
 */
export function mergeDepartmentsWithAssignments(
  baseConfig: VerticalConfig,
  assignments: DepartmentSectionAssignment[]
): SectionedDepartments {
  console.log('[departmentMerger] Merging base config with assignments:', {
    assignmentsCount: assignments.length,
    assignments: assignments.map(a => ({
      id: a.department_id,
      section: a.section_id,
      customName: a.custom_name,
      visible: a.is_visible
    }))
  })

  // 1. Create lookup map of assignments for O(1) access
  const assignmentMap = new Map(
    assignments.map(a => [a.department_id, a])
  )

  // 2. Collect all department definitions from base config
  const allBaseDepartments: NavigationItem[] = [
    ...(baseConfig.navigation.primaryNav || []),
    ...(baseConfig.navigation.departmentNav || []),
    ...(baseConfig.navigation.additionalDepartments || []),
    ...(baseConfig.navigation.operationsNav || []),
    ...(baseConfig.navigation.adminNav || [])
  ]

  console.log('[departmentMerger] Base departments:', {
    total: allBaseDepartments.length,
    departments: allBaseDepartments.map(d => ({ id: d.id, name: d.name }))
  })

  // 3. Merge each department with its assignment (if exists)
  const merged: MergedDepartment[] = allBaseDepartments.map(baseDept => {
    const assignment = assignmentMap.get(baseDept.id)
    const defaultSection = getDefaultSection(baseDept.id)
    const defaultDisplayOrder = getDefaultOrder(baseDept.id)

    const mergedDept: MergedDepartment = {
      // Base properties (never change)
      id: baseDept.id,
      icon: baseDept.icon,
      route: baseDept.route,
      color: baseDept.color,
      requiredRole: baseDept.requiredRole,
      requiredFeature: baseDept.requiredFeature,
      defaultName: baseDept.name,
      defaultDescription: baseDept.description,

      // Database overrides (can be customized)
      name: assignment?.custom_name || baseDept.name,
      description: assignment?.custom_description || baseDept.description,
      sectionId: (assignment?.section_id as SectionId) || defaultSection,
      displayOrder: assignment?.display_order ?? defaultDisplayOrder,
      isVisible: assignment?.is_visible ?? true,

      // Metadata
      hasCustomization: !!assignment,
      customName: assignment?.custom_name,
      customDescription: assignment?.custom_description,
      updatedAt: assignment?.updated_at
    }

    return mergedDept
  })

  console.log('[departmentMerger] Merged departments:', {
    total: merged.length,
    customized: merged.filter(d => d.hasCustomization).length,
    visible: merged.filter(d => d.isVisible).length,
    merged: merged.map(d => ({
      id: d.id,
      name: d.name,
      section: d.sectionId,
      order: d.displayOrder,
      visible: d.isVisible,
      customized: d.hasCustomization
    }))
  })

  // 4. Group by section
  const sections: SectionedDepartments = {
    documents: [],
    departments: [],
    operations: [],
    admin: []
  }

  merged.forEach(dept => {
    // Only include visible departments
    if (dept.isVisible && sections[dept.sectionId]) {
      sections[dept.sectionId].push(dept)
    }
  })

  // 5. Sort by displayOrder within each section
  Object.keys(sections).forEach(sectionKey => {
    const sectionId = sectionKey as SectionId
    sections[sectionId].sort((a, b) => a.displayOrder - b.displayOrder)
  })

  console.log('[departmentMerger] Sectioned departments:', {
    documents: sections.documents.length,
    departments: sections.departments.length,
    operations: sections.operations.length,
    admin: sections.admin.length
  })

  return sections
}

/**
 * Extracts just the navigation items from merged departments
 * Useful for components that expect NavigationItem[] format
 */
export function toNavigationItems(departments: MergedDepartment[]): NavigationItem[] {
  return departments.map(dept => ({
    id: dept.id,
    name: dept.name,
    description: dept.description || '',
    icon: dept.icon,
    route: dept.route,
    color: dept.color,
    requiredRole: dept.requiredRole as 'user' | 'admin' | 'master_admin' | undefined,
    requiredFeature: dept.requiredFeature
  }))
}
