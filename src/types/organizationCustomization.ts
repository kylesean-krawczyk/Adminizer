import { VerticalId, ThemeColors, DashboardStatCard, DepartmentButton } from '../config/types'

export interface LogoUploadConfig {
  allowedFormats: ['image/svg+xml', 'image/png', 'image/jpeg']
  maxFileSize: number
  minDimensions: { width: number; height: number }
  recommendedFormat: 'SVG'
  recommendations: {
    svg: string
    png: string
    jpg: string
  }
}

export interface LogoMetadata {
  url: string
  format: 'image/svg+xml' | 'image/png' | 'image/jpeg'
  fileSize: number
  dimensions?: { width: number; height: number }
  uploadedAt: string
}

export interface LogoValidationResult {
  valid: boolean
  error?: string
  warning?: string
}

export interface DashboardCustomization {
  title?: string
  subtitle?: string
  coreSectionTitle?: string
  additionalSectionTitle?: string
}

export interface NavigationCustomization {
  items?: Array<{
    id: string
    name?: string
    icon?: string
    visible?: boolean
    order?: number
  }>
}

export interface BrandingCustomization {
  colors?: Partial<ThemeColors>
  organizationName?: string
  logoUrl?: string
  logoFormat?: 'image/svg+xml' | 'image/png' | 'image/jpeg'
  logoFileSize?: number
  logoUploadedAt?: string
}

export interface StatsCustomization {
  cards?: Array<Partial<DashboardStatCard> & { visible?: boolean; order?: number }>
}

export interface DepartmentCustomization {
  departments?: Array<Partial<DepartmentButton> & { visible?: boolean; order?: number }>
  coreSectionTitle?: string
  additionalSectionTitle?: string
}

export interface OrganizationCustomization {
  id: string
  organization_id: string
  vertical_id: VerticalId
  dashboard_config: DashboardCustomization
  navigation_config: NavigationCustomization
  branding_config: BrandingCustomization
  stats_config: StatsCustomization
  department_config: DepartmentCustomization
  logo_url?: string
  logo_format?: 'image/svg+xml' | 'image/png' | 'image/jpeg'
  logo_file_size?: number
  logo_uploaded_at?: string
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface CustomizationHistory {
  id: string
  customization_id: string
  organization_id: string
  vertical_id: VerticalId
  config_snapshot: Omit<OrganizationCustomization, 'id' | 'created_at' | 'updated_at'>
  changed_by?: string
  changed_by_profile?: {
    id: string
    email: string
    full_name: string | null
  }
  change_description?: string
  change_note?: string
  is_milestone: boolean
  milestone_name?: string
  version_number: number
  created_at: string
}

export interface CustomizationDiffData {
  field: string
  oldValue: any
  newValue: any
  category: 'dashboard' | 'navigation' | 'branding' | 'stats' | 'departments'
}

export interface RetentionSummary {
  vertical_id: VerticalId
  total_versions: number
  milestone_versions: number
  last_90_days_versions: number
  top_20_versions: number
  eligible_for_cleanup: number
}

export interface SaveCustomizationParams {
  organizationId: string
  verticalId: VerticalId
  customization: Partial<OrganizationCustomization>
  changeDescription?: string
  changeNote?: string
}

export interface MarkMilestoneParams {
  historyId: string
  milestoneName: string
  notes?: string
}

export interface CopyCustomizationParams {
  sourceVerticalId: VerticalId
  targetVerticalId: VerticalId
  organizationId: string
  includeOptions: {
    dashboard: boolean
    navigation: boolean
    branding: boolean
    stats: boolean
    departments: boolean
  }
}

export interface CustomizationDraft {
  dashboard_config: DashboardCustomization
  navigation_config: NavigationCustomization
  branding_config: BrandingCustomization
  stats_config: StatsCustomization
  department_config: DepartmentCustomization
  hasChanges: boolean
  lastSaved?: string
}
