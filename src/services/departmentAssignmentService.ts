import { supabase } from '../lib/supabase'
import {
  DepartmentSectionAssignment,
  SaveDepartmentAssignmentParams,
  MoveDepartmentParams,
  ReorderWithinSectionParams,
  BulkOrderUpdate,
  BulkOrderUpdateResponse,
  DepartmentMoveResult,
  InitializeAssignmentsParams,
  SectionId
} from '../types/departmentAssignments'
import { VerticalId } from '../config/types'

/**
 * Custom error class for when the table doesn't exist
 */
export class TableMissingError extends Error {
  code = 'PGRST205'
  tableName = 'department_section_assignments'

  constructor(message: string = 'Table not found in schema cache') {
    super(message)
    this.name = 'TableMissingError'
  }
}

/**
 * Checks if an error is a table-not-found error (PGRST205)
 */
export function isTableMissingError(error: any): boolean {
  return (
    error instanceof TableMissingError ||
    error?.code === 'PGRST205' ||
    error?.message?.toLowerCase().includes('could not find the table') ||
    error?.message?.toLowerCase().includes('department_section_assignments')
  )
}

/**
 * Checks if an error is a schema cache issue
 */
export function isSchemaCacheError(error: any): boolean {
  return (
    error?.code === 'PGRST205' ||
    error?.message?.toLowerCase().includes('schema cache')
  )
}

/**
 * Checks if the department_section_assignments table exists
 */
export async function checkTableExists(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('department_section_assignments')
      .select('id')
      .limit(1)

    if (error) {
      if (isTableMissingError(error)) {
        console.warn('[checkTableExists] Table does not exist:', error)
        return false
      }
      console.error('[checkTableExists] Unexpected error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[checkTableExists] Exception:', error)
    return false
  }
}

/**
 * Fetches all department-section assignments for an organization and vertical
 * @throws {TableMissingError} when the table doesn't exist
 */
export const getDepartmentAssignments = async (
  organizationId: string,
  verticalId: VerticalId
): Promise<DepartmentSectionAssignment[]> => {
  try {
    console.log('[getDepartmentAssignments] Fetching assignments:', {
      organizationId,
      verticalId,
      timestamp: new Date().toISOString()
    })

    const { data, error } = await supabase
      .from('department_section_assignments')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('vertical_id', verticalId)
      .order('section_id', { ascending: true })
      .order('display_order', { ascending: true })

    if (error) {
      if (isTableMissingError(error)) {
        console.warn('[getDepartmentAssignments] Table not found - throwing TableMissingError')
        throw new TableMissingError(error.message || 'department_section_assignments table not found')
      }
      console.error('[getDepartmentAssignments] Error:', error)
      throw error
    }

    console.log('[getDepartmentAssignments] Found assignments:', data?.length || 0)
    return data || []
  } catch (error) {
    // Re-throw TableMissingError or other typed errors
    if (error instanceof TableMissingError || isTableMissingError(error)) {
      throw error instanceof TableMissingError ? error : new TableMissingError('Table not found')
    }
    console.error('[getDepartmentAssignments] Exception:', error)
    throw error
  }
}

/**
 * Saves or updates a single department assignment
 */
export const saveDepartmentAssignment = async (
  params: SaveDepartmentAssignmentParams
): Promise<DepartmentSectionAssignment> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    console.log('[saveDepartmentAssignment] Saving:', params)

    const assignmentData = {
      organization_id: params.organizationId,
      vertical_id: params.verticalId,
      department_id: params.departmentId,
      department_key: params.departmentKey,
      section_id: params.sectionId,
      display_order: params.displayOrder,
      is_visible: params.isVisible ?? true,
      custom_name: params.customName || null,
      custom_description: params.customDescription || null,
      updated_by: user.id
    }

    const { data, error } = await supabase
      .from('department_section_assignments')
      .upsert(assignmentData, {
        onConflict: 'organization_id,vertical_id,department_id'
      })
      .select()
      .single()

    if (error) {
      console.error('[saveDepartmentAssignment] Error:', error)
      throw error
    }

    console.log('[saveDepartmentAssignment] Success:', data.id)
    return data
  } catch (error) {
    console.error('[saveDepartmentAssignment] Exception:', error)
    throw error
  }
}

/**
 * Bulk updates department display order within a section
 */
export const bulkUpdateDepartmentOrder = async (
  organizationId: string,
  verticalId: VerticalId,
  sectionId: SectionId,
  updates: BulkOrderUpdate[]
): Promise<BulkOrderUpdateResponse> => {
  try {
    console.log('[bulkUpdateDepartmentOrder] Updating:', {
      organizationId,
      verticalId,
      sectionId,
      updateCount: updates.length
    })

    const { data, error } = await supabase.rpc('bulk_update_department_order', {
      p_organization_id: organizationId,
      p_vertical_id: verticalId,
      p_section_id: sectionId,
      p_updates: updates
    })

    if (error) {
      console.error('[bulkUpdateDepartmentOrder] Error:', error)
      throw error
    }

    console.log('[bulkUpdateDepartmentOrder] Response:', data)
    return data as BulkOrderUpdateResponse
  } catch (error) {
    console.error('[bulkUpdateDepartmentOrder] Exception:', error)
    throw error
  }
}

/**
 * Moves a department from one section to another
 */
export const moveDepartmentToSection = async (
  params: MoveDepartmentParams
): Promise<DepartmentMoveResult> => {
  try {
    console.log('[moveDepartmentToSection] Moving department:', params)

    const { data, error } = await supabase.rpc('move_department_to_section', {
      p_organization_id: params.organizationId,
      p_vertical_id: params.verticalId,
      p_department_id: params.departmentId,
      p_from_section_id: params.fromSectionId,
      p_to_section_id: params.toSectionId,
      p_target_position: params.targetPosition
    })

    if (error) {
      console.error('[moveDepartmentToSection] Error:', error)
      throw error
    }

    console.log('[moveDepartmentToSection] Response:', data)
    return data as DepartmentMoveResult
  } catch (error) {
    console.error('[moveDepartmentToSection] Exception:', error)
    throw error
  }
}

/**
 * Reorders a department within the same section
 */
export const reorderWithinSection = async (
  params: ReorderWithinSectionParams
): Promise<boolean> => {
  try {
    console.log('[reorderWithinSection] Reordering:', params)

    // Get all departments in the section
    const assignments = await getDepartmentAssignments(
      params.organizationId,
      params.verticalId
    )

    const sectionDepartments = assignments
      .filter(a => a.section_id === params.sectionId)
      .sort((a, b) => a.display_order - b.display_order)

    // Find the department to move
    const deptIndex = sectionDepartments.findIndex(
      d => d.department_id === params.departmentId
    )

    if (deptIndex === -1) {
      throw new Error('Department not found in section')
    }

    // Reorder the array
    const [removed] = sectionDepartments.splice(params.oldIndex, 1)
    sectionDepartments.splice(params.newIndex, 0, removed)

    // Create bulk update payload
    const updates: BulkOrderUpdate[] = sectionDepartments.map((dept, index) => ({
      department_id: dept.department_id,
      display_order: index
    }))

    // Execute bulk update
    const result = await bulkUpdateDepartmentOrder(
      params.organizationId,
      params.verticalId,
      params.sectionId,
      updates
    )

    return result.success
  } catch (error) {
    console.error('[reorderWithinSection] Exception:', error)
    throw error
  }
}

/**
 * Deletes a department assignment (resets to default)
 */
export const deleteDepartmentAssignment = async (
  organizationId: string,
  verticalId: VerticalId,
  departmentId: string
): Promise<boolean> => {
  try {
    console.log('[deleteDepartmentAssignment] Deleting:', {
      organizationId,
      verticalId,
      departmentId
    })

    const { error } = await supabase
      .from('department_section_assignments')
      .delete()
      .eq('organization_id', organizationId)
      .eq('vertical_id', verticalId)
      .eq('department_id', departmentId)

    if (error) {
      console.error('[deleteDepartmentAssignment] Error:', error)
      throw error
    }

    console.log('[deleteDepartmentAssignment] Success')
    return true
  } catch (error) {
    console.error('[deleteDepartmentAssignment] Exception:', error)
    return false
  }
}

/**
 * Deletes all department assignments for an organization/vertical
 * (resets to default configuration)
 */
export const resetDepartmentAssignments = async (
  organizationId: string,
  verticalId: VerticalId
): Promise<boolean> => {
  try {
    console.log('[resetDepartmentAssignments] Resetting all assignments:', {
      organizationId,
      verticalId
    })

    const { error } = await supabase
      .from('department_section_assignments')
      .delete()
      .eq('organization_id', organizationId)
      .eq('vertical_id', verticalId)

    if (error) {
      console.error('[resetDepartmentAssignments] Error:', error)
      throw error
    }

    console.log('[resetDepartmentAssignments] Success')
    return true
  } catch (error) {
    console.error('[resetDepartmentAssignments] Exception:', error)
    return false
  }
}

/**
 * Initializes default department assignments from vertical config
 */
export const initializeDefaultAssignments = async (
  params: InitializeAssignmentsParams
): Promise<boolean> => {
  try {
    console.log('[initializeDefaultAssignments] Initializing:', {
      organizationId: params.organizationId,
      verticalId: params.verticalId,
      departmentCount: params.departments.length
    })

    // Check if assignments already exist
    const existing = await getDepartmentAssignments(
      params.organizationId,
      params.verticalId
    )

    if (existing.length > 0) {
      console.log('[initializeDefaultAssignments] Assignments already exist, skipping')
      return true
    }

    // Insert all default assignments
    const { data: { user } } = await supabase.auth.getUser()

    const assignments = params.departments.map(dept => ({
      organization_id: params.organizationId,
      vertical_id: params.verticalId,
      department_id: dept.id,
      department_key: dept.key,
      section_id: dept.sectionId,
      display_order: dept.order,
      is_visible: true,
      custom_name: null,
      custom_description: null,
      created_by: user?.id || null,
      updated_by: user?.id || null
    }))

    const { error } = await supabase
      .from('department_section_assignments')
      .insert(assignments)

    if (error) {
      console.error('[initializeDefaultAssignments] Error:', error)
      throw error
    }

    console.log('[initializeDefaultAssignments] Success:', assignments.length)
    return true
  } catch (error) {
    console.error('[initializeDefaultAssignments] Exception:', error)
    return false
  }
}

/**
 * Gets departments grouped by section
 */
export const getDepartmentsBySection = async (
  organizationId: string,
  verticalId: VerticalId
): Promise<Record<SectionId, DepartmentSectionAssignment[]>> => {
  try {
    const assignments = await getDepartmentAssignments(organizationId, verticalId)

    const grouped: Record<string, DepartmentSectionAssignment[]> = {
      documents: [],
      departments: [],
      operations: [],
      admin: []
    }

    assignments.forEach(assignment => {
      if (!grouped[assignment.section_id]) {
        grouped[assignment.section_id] = []
      }
      grouped[assignment.section_id].push(assignment)
    })

    // Sort each section by display_order
    Object.keys(grouped).forEach(sectionId => {
      grouped[sectionId].sort((a, b) => a.display_order - b.display_order)
    })

    return grouped as Record<SectionId, DepartmentSectionAssignment[]>
  } catch (error) {
    console.error('[getDepartmentsBySection] Exception:', error)
    return {
      documents: [],
      departments: [],
      operations: [],
      admin: []
    }
  }
}

/**
 * Creates default department assignments from a vertical configuration
 * Used for initialization or after reset
 */
export const createDefaultAssignmentsFromVertical = async (
  organizationId: string,
  verticalId: VerticalId,
  verticalConfig: any
): Promise<number> => {
  try {
    console.log('[createDefaultAssignmentsFromVertical] Creating defaults:', {
      organizationId,
      verticalId
    })

    // Check if assignments already exist
    const existing = await getDepartmentAssignments(organizationId, verticalId)
    if (existing.length > 0) {
      console.log('[createDefaultAssignmentsFromVertical] Assignments already exist, skipping')
      return existing.length
    }

    // Extract all departments from vertical config
    const allDepartments = [
      ...(verticalConfig.dashboardConfig?.coreDepartments || []),
      ...(verticalConfig.dashboardConfig?.additionalDepartments || [])
    ]

    console.log('[createDefaultAssignmentsFromVertical] Found departments:', allDepartments.length)

    const { data: { user } } = await supabase.auth.getUser()

    // Map each department to its default section based on navigation
    const assignments = allDepartments.map((dept, index) => {
      let sectionId: SectionId = 'departments' // default

      // Determine section from navigation config
      if (dept.id === 'documents') {
        sectionId = 'documents'
      } else if (verticalConfig.navigation?.operationsNav?.some((d: any) => d.id === dept.id)) {
        sectionId = 'operations'
      } else if (verticalConfig.navigation?.adminNav?.some((d: any) => d.id === dept.id)) {
        sectionId = 'admin'
      } else if (verticalConfig.navigation?.departmentNav?.some((d: any) => d.id === dept.id)) {
        sectionId = 'departments'
      }

      return {
        organization_id: organizationId,
        vertical_id: verticalId,
        department_id: dept.id,
        department_key: dept.id,
        section_id: sectionId,
        display_order: index,
        is_visible: true,
        custom_name: null,
        custom_description: null,
        created_by: user?.id || null,
        updated_by: user?.id || null
      }
    })

    console.log('[createDefaultAssignmentsFromVertical] Inserting assignments:', assignments.length)

    const { error } = await supabase
      .from('department_section_assignments')
      .insert(assignments)

    if (error) {
      console.error('[createDefaultAssignmentsFromVertical] Error:', error)
      throw error
    }

    console.log('[createDefaultAssignmentsFromVertical] Success!')
    return assignments.length
  } catch (error) {
    console.error('[createDefaultAssignmentsFromVertical] Exception:', error)
    throw error
  }
}
