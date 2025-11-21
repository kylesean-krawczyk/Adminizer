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
 * Fetches all department-section assignments for an organization and vertical
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
      console.error('[getDepartmentAssignments] Error:', error)
      throw error
    }

    console.log('[getDepartmentAssignments] Found assignments:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('[getDepartmentAssignments] Exception:', error)
    return []
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
