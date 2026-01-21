import { supabase } from '../lib/supabase'
import { getVerticalConfig } from '../config'
import { VerticalId } from '../config/types'
import { DepartmentSectionAssignment } from '../types/departmentAssignments'
import { getDefaultSection, getDefaultOrder } from '../utils/departmentSectionDefaults'

interface OldDepartmentCustomization {
  id: string
  name?: string
  description?: string
  visible?: boolean
}

interface OldDepartmentConfig {
  departments?: OldDepartmentCustomization[]
}

/**
 * Migrates old department customizations from organization_customizations.department_config
 * to the new department_section_assignments table
 */
export async function migrateDepartmentCustomizations(
  organizationId: string,
  verticalId: VerticalId
): Promise<{ success: boolean; migratedCount: number; error?: string }> {
  try {
    console.log('[migrateDepartmentCustomizations] Starting migration:', {
      organizationId,
      verticalId
    })

    // 1. Check if assignments already exist (skip if already migrated)
    const { data: existingAssignments, error: checkError } = await supabase
      .from('department_section_assignments')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('vertical_id', verticalId)

    if (checkError) {
      console.error('[migrateDepartmentCustomizations] Error checking existing assignments:', checkError)
      return { success: false, migratedCount: 0, error: checkError.message }
    }

    if (existingAssignments && existingAssignments.length > 0) {
      console.log('[migrateDepartmentCustomizations] Assignments already exist, skipping migration:', {
        count: existingAssignments.length
      })
      return { success: true, migratedCount: 0 }
    }

    // 2. Fetch old customizations
    const { data: customization, error: fetchError } = await supabase
      .from('organization_ui_customizations')
      .select('department_config')
      .eq('organization_id', organizationId)
      .eq('vertical_id', verticalId)
      .maybeSingle()

    if (fetchError) {
      console.error('[migrateDepartmentCustomizations] Error fetching customizations:', fetchError)
      return { success: false, migratedCount: 0, error: fetchError.message }
    }

    // 3. Get base config for all departments
    const config = getVerticalConfig(verticalId)
    const allNavigationItems = [
      ...(config.navigation.primaryNav || []),
      ...(config.navigation.departmentNav || []),
      ...(config.navigation.additionalDepartments || []),
      ...(config.navigation.operationsNav || []),
      ...(config.navigation.adminNav || [])
    ]

    console.log('[migrateDepartmentCustomizations] Found navigation items:', {
      total: allNavigationItems.length,
      primaryNav: config.navigation.primaryNav?.length || 0,
      departmentNav: config.navigation.departmentNav?.length || 0,
      operationsNav: config.navigation.operationsNav?.length || 0,
      adminNav: config.navigation.adminNav?.length || 0
    })

    // 4. Build assignment records for ALL items
    const assignments: Partial<DepartmentSectionAssignment>[] = []
    const oldCustomizations = (customization?.department_config as OldDepartmentConfig)?.departments || []

    // Create map of old customizations for quick lookup
    const customizationMap = new Map<string, OldDepartmentCustomization>(
      oldCustomizations.map((c: OldDepartmentCustomization) => [c.id, c])
    )

    console.log('[migrateDepartmentCustomizations] Old customizations found:', {
      count: oldCustomizations.length,
      ids: oldCustomizations.map((c: OldDepartmentCustomization) => c.id)
    })

    // Process each navigation item
    allNavigationItems.forEach((item) => {
      const oldCustomization = customizationMap.get(item.id)
      const defaultSection = getDefaultSection(item.id)
      const defaultOrder = getDefaultOrder(item.id)

      const assignment: Partial<DepartmentSectionAssignment> = {
        organization_id: organizationId,
        vertical_id: verticalId,
        department_id: item.id,
        section_id: defaultSection,
        display_order: defaultOrder,
        is_visible: oldCustomization ? (oldCustomization.visible !== false) : true, // Default to visible
        custom_name: oldCustomization?.name || null,
        custom_description: oldCustomization?.description || null
      }

      assignments.push(assignment)

      if (oldCustomization) {
        console.log('[migrateDepartmentCustomizations] Migrating customized item:', {
          id: item.id,
          oldName: item.name,
          customName: oldCustomization.name,
          visible: assignment.is_visible
        })
      }
    })

    // 5. Insert all assignments in batch
    if (assignments.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('department_section_assignments')
        .insert(assignments)
        .select()

      if (insertError) {
        console.error('[migrateDepartmentCustomizations] Error inserting assignments:', insertError)
        return { success: false, migratedCount: 0, error: insertError.message }
      }

      console.log('[migrateDepartmentCustomizations] Migration complete:', {
        totalInserted: inserted?.length || 0,
        customizedItems: assignments.filter(a => a.custom_name || a.custom_description).length,
        hiddenItems: assignments.filter(a => !a.is_visible).length
      })

      return { success: true, migratedCount: inserted?.length || 0 }
    }

    return { success: true, migratedCount: 0 }

  } catch (error) {
    console.error('[migrateDepartmentCustomizations] Unexpected error:', error)
    return {
      success: false,
      migratedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Auto-initialize assignments if none exist for an organization
 * Creates default assignments for all navigation items
 */
export async function initializeAssignments(
  organizationId: string,
  verticalId: VerticalId
): Promise<{ success: boolean; initializedCount: number; error?: string }> {
  try {
    console.log('[initializeAssignments] Initializing assignments:', {
      organizationId,
      verticalId
    })

    // Check if assignments already exist
    const { data: existingAssignments, error: checkError } = await supabase
      .from('department_section_assignments')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('vertical_id', verticalId)

    if (checkError) {
      console.error('[initializeAssignments] Error checking existing assignments:', checkError)
      return { success: false, initializedCount: 0, error: checkError.message }
    }

    if (existingAssignments && existingAssignments.length > 0) {
      console.log('[initializeAssignments] Assignments already exist, skipping initialization')
      return { success: true, initializedCount: 0 }
    }

    // Get base config
    const config = getVerticalConfig(verticalId)
    const allNavigationItems = [
      ...(config.navigation.primaryNav || []),
      ...(config.navigation.departmentNav || []),
      ...(config.navigation.additionalDepartments || []),
      ...(config.navigation.operationsNav || []),
      ...(config.navigation.adminNav || [])
    ]

    // Create default assignments for all items
    const assignments: Partial<DepartmentSectionAssignment>[] = allNavigationItems.map(item => ({
      organization_id: organizationId,
      vertical_id: verticalId,
      department_id: item.id,
      section_id: getDefaultSection(item.id),
      display_order: getDefaultOrder(item.id),
      is_visible: true,
      custom_name: null,
      custom_description: null
    }))

    // Insert all assignments
    const { data: inserted, error: insertError } = await supabase
      .from('department_section_assignments')
      .insert(assignments)
      .select()

    if (insertError) {
      console.error('[initializeAssignments] Error inserting assignments:', insertError)
      return { success: false, initializedCount: 0, error: insertError.message }
    }

    console.log('[initializeAssignments] Initialization complete:', {
      totalInserted: inserted?.length || 0
    })

    return { success: true, initializedCount: inserted?.length || 0 }

  } catch (error) {
    console.error('[initializeAssignments] Unexpected error:', error)
    return {
      success: false,
      initializedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
