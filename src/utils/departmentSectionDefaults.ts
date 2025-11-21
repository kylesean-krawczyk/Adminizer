import { SectionId } from '../types/departmentAssignments'

/**
 * Maps department IDs to their default sections
 * This is used when no database assignment exists for a department
 */
const DEPARTMENT_SECTION_MAP: Record<string, SectionId> = {
  // Primary navigation items
  'documents': 'documents',

  // Core department items (mapped to 'departments' section)
  'human-resources': 'departments',
  'finance-accounting': 'departments',
  'sales': 'departments',
  'donor-relations': 'departments',
  'operations': 'departments',
  'member-care': 'departments',
  'customer-support': 'departments',
  'communications-marketing': 'departments',
  'marketing': 'departments',
  'it-technology': 'departments',
  'legal-compliance': 'departments',
  'procurement': 'departments',
  'project-management': 'departments',
  'research-development': 'departments',
  'quality-assurance': 'departments',

  // Operations items
  'workflows': 'operations',
  'hr': 'operations',
  'accounting': 'operations',
  'legal': 'operations',
  'branding': 'operations',
  'social-media': 'operations',
  'communications': 'operations',
  'volunteer-management': 'operations',
  'streaming': 'operations',
  'it': 'operations',

  // Admin items
  'users': 'admin',
  'oauth': 'admin',
  'ui-customization': 'admin'
}

/**
 * Returns the default section for a given department ID
 * Falls back to 'departments' if no mapping exists
 */
export function getDefaultSection(departmentId: string): SectionId {
  return DEPARTMENT_SECTION_MAP[departmentId] || 'departments'
}

/**
 * Default display order based on original config position
 * These preserve the original ordering when no DB override exists
 */
const DEPARTMENT_ORDER_MAP: Record<string, number> = {
  // Primary nav
  'documents': 0,

  // Core departments (in original order)
  'human-resources': 0,
  'finance-accounting': 1,
  'sales': 2,
  'donor-relations': 2,
  'operations': 3,
  'member-care': 4,
  'customer-support': 4,
  'communications-marketing': 5,
  'marketing': 5,
  'it-technology': 6,
  'legal-compliance': 7,
  'procurement': 8,
  'project-management': 9,
  'research-development': 10,
  'quality-assurance': 11,

  // Operations items
  'workflows': 0,
  'hr': 1,
  'accounting': 2,
  'legal': 3,
  'branding': 4,
  'social-media': 5,
  'communications': 6,
  'volunteer-management': 7,
  'streaming': 8,
  'it': 9,

  // Admin items
  'users': 0,
  'oauth': 1,
  'ui-customization': 2
}

/**
 * Returns the default display order for a department within its section
 * Falls back to 999 if no mapping exists (pushes to end)
 */
export function getDefaultOrder(departmentId: string): number {
  return DEPARTMENT_ORDER_MAP[departmentId] ?? 999
}
