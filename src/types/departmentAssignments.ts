import { VerticalId } from '../config/types'

/**
 * Section identifiers for the sidebar
 */
export type SectionId = 'documents' | 'departments' | 'operations' | 'admin'

/**
 * Database model for department-to-section assignments
 */
export interface DepartmentSectionAssignment {
  id: string
  organization_id: string
  vertical_id: VerticalId
  department_id: string
  department_key: string
  section_id: SectionId
  display_order: number
  is_visible: boolean
  custom_name?: string | null
  custom_description?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

/**
 * Tracks a department move action for undo functionality
 */
export interface DepartmentMoveAction {
  id: string
  timestamp: number
  department_id: string
  department_name: string
  from_section_id: SectionId
  from_position: number
  to_section_id: SectionId
  to_position: number
  previous_state: DepartmentSectionAssignment[]
}

/**
 * Extended department item with DnD properties
 */
export interface DndDepartmentItem extends DepartmentSectionAssignment {
  // Original config data
  defaultName: string
  defaultDescription: string
  icon?: any
  color?: string
  route?: string
  requiredRole?: string
  requiredFeature?: string
}

/**
 * Configuration for a section drop zone
 */
export interface SectionDropzone {
  id: SectionId
  name: string
  icon: any
  maxDepartments?: number
  acceptedTypes?: string[]
  expandable?: boolean
  requiredRole?: string
}

/**
 * Result from a department move operation
 */
export interface DepartmentMoveResult {
  success: boolean
  department_id: string
  from_section: SectionId
  to_section: SectionId
  position: number
  affected_rows?: number
  operation?: string
  error?: string
}

/**
 * Undo stack item with expiration
 */
export interface UndoStackItem {
  action: DepartmentMoveAction
  expiresAt: number
}

/**
 * Bulk update payload for department order
 */
export interface BulkOrderUpdate {
  department_id: string
  display_order: number
}

/**
 * Parameters for moving a department to a section
 */
export interface MoveDepartmentParams {
  organizationId: string
  verticalId: VerticalId
  departmentId: string
  fromSectionId: SectionId
  toSectionId: SectionId
  targetPosition: number
}

/**
 * Parameters for reordering within a section
 */
export interface ReorderWithinSectionParams {
  organizationId: string
  verticalId: VerticalId
  sectionId: SectionId
  departmentId: string
  oldIndex: number
  newIndex: number
}

/**
 * Parameters for saving a department assignment
 */
export interface SaveDepartmentAssignmentParams {
  organizationId: string
  verticalId: VerticalId
  departmentId: string
  departmentKey: string
  sectionId: SectionId
  displayOrder: number
  isVisible?: boolean
  customName?: string
  customDescription?: string
}

/**
 * Response from bulk order update RPC function
 */
export interface BulkOrderUpdateResponse {
  success: boolean
  updated_count: number
  affected_rows?: number
  updated_rows: DepartmentSectionAssignment[]
  error?: string
}

/**
 * Parameters for initializing default assignments
 */
export interface InitializeAssignmentsParams {
  organizationId: string
  verticalId: VerticalId
  departments: Array<{
    id: string
    key: string
    sectionId: SectionId
    order: number
    defaultName: string
    defaultDescription: string
  }>
}

/**
 * Grouped departments by section for rendering
 */
export interface SectionDepartments {
  [sectionId: string]: DndDepartmentItem[]
}

/**
 * Real-time update payload
 */
export interface DepartmentAssignmentUpdate {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  assignment: DepartmentSectionAssignment
  organization_id: string
  vertical_id: VerticalId
}
