import { VerticalId } from '../config/types'
import { DepartmentSectionAssignment } from './departmentAssignments'

/**
 * Supported metric types for statistics cards
 */
export type MetricType =
  | 'documents'
  | 'team_members'
  | 'active_projects'
  | 'resources'
  | 'custom'

/**
 * Tool type for department tools
 */
export type ToolType =
  | 'internal_route'
  | 'external_link'
  | 'integration'

/**
 * Common Lucide icon names supported in the system
 */
export type IconName =
  | 'FileText'
  | 'Users'
  | 'Settings'
  | 'Plus'
  | 'Heart'
  | 'Calendar'
  | 'Clock'
  | 'TrendingUp'
  | 'BarChart'
  | 'PieChart'
  | 'Activity'
  | 'Award'
  | 'Briefcase'
  | 'Building'
  | 'Building2'
  | 'Calculator'
  | 'CheckCircle'
  | 'Clipboard'
  | 'Cog'
  | 'DollarSign'
  | 'Download'
  | 'Edit'
  | 'Eye'
  | 'Folder'
  | 'Gift'
  | 'Globe'
  | 'Headphones'
  | 'Home'
  | 'Inbox'
  | 'Mail'
  | 'MapPin'
  | 'Megaphone'
  | 'MessageCircle'
  | 'Monitor'
  | 'Package'
  | 'Palette'
  | 'Phone'
  | 'Play'
  | 'Printer'
  | 'Save'
  | 'Search'
  | 'Share'
  | 'Shield'
  | 'ShoppingCart'
  | 'Star'
  | 'Tag'
  | 'Target'
  | 'ThumbsUp'
  | 'TrendingDown'
  | 'Upload'
  | 'Video'
  | 'Zap'
  | 'Wrench'

/**
 * Statistics card configuration for department landing pages
 */
export interface StatCard {
  id: string
  organization_id: string
  vertical_id: VerticalId
  department_id: string
  label: string
  icon_name: IconName
  metric_type: MetricType
  display_order: number
  is_visible: boolean
  custom_metric_query?: string | null
  custom_metric_value?: number | null
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

/**
 * Department feature/capability item
 */
export interface DepartmentFeature {
  id: string
  organization_id: string
  vertical_id: VerticalId
  department_id: string
  title: string
  description?: string | null
  display_order: number
  is_visible: boolean
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

/**
 * Department tool/resource item
 */
export interface DepartmentTool {
  id: string
  organization_id: string
  vertical_id: VerticalId
  department_id: string
  tool_name: string
  tool_description?: string | null
  tool_url?: string | null
  tool_type: ToolType
  integration_config?: Record<string, any>
  display_order: number
  is_visible: boolean
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

/**
 * Extended department configuration with visual settings
 */
export interface DepartmentConfiguration extends DepartmentSectionAssignment {
  icon_name?: string | null
  emoji?: string | null
  color_theme?: string | null
}

/**
 * Complete department landing page data
 */
export interface CompleteDepartmentData {
  config: DepartmentConfiguration
  statCards: StatCard[]
  features: DepartmentFeature[]
  tools: DepartmentTool[]
}

/**
 * Calculated metrics for stat cards
 */
export interface CalculatedMetrics {
  [metricType: string]: number
}

/**
 * Parameters for saving a stat card
 */
export interface SaveStatCardParams {
  organizationId: string
  verticalId: VerticalId
  departmentId: string
  label: string
  iconName: IconName
  metricType: MetricType
  displayOrder: number
  isVisible?: boolean
}

/**
 * Parameters for saving a department feature
 */
export interface SaveDepartmentFeatureParams {
  organizationId: string
  verticalId: VerticalId
  departmentId: string
  title: string
  description?: string
  displayOrder: number
  isVisible?: boolean
}

/**
 * Parameters for saving a department tool
 */
export interface SaveDepartmentToolParams {
  organizationId: string
  verticalId: VerticalId
  departmentId: string
  toolName: string
  toolDescription?: string
  toolUrl?: string
  toolType: ToolType
  integrationConfig?: Record<string, any>
  displayOrder: number
  isVisible?: boolean
}

/**
 * Parameters for reordering items
 */
export interface ReorderParams {
  organizationId: string
  verticalId: VerticalId
  departmentId: string
  updates: Array<{
    id: string
    display_order: number
  }>
}

/**
 * Default stat card template
 */
export interface DefaultStatCardTemplate {
  label: string
  iconName: IconName
  metricType: MetricType
  displayOrder: number
}

/**
 * Default feature template
 */
export interface DefaultFeatureTemplate {
  title: string
  description?: string
  displayOrder: number
}
