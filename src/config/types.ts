import { LucideIcon } from 'lucide-react'

export type VerticalId = 'church' | 'business' | 'estate'

export type UserModel = 'organizational' | 'personal'

export interface TerminologyMap {
  members?: string
  employees?: string
  customers?: string
  revenue?: string
  departments?: string
  team?: string
  organization?: string
  admin?: string
  user?: string
  documents?: string
  operations?: string
  [key: string]: string | undefined
}

export interface NavigationItem {
  id: string
  name: string
  icon?: LucideIcon
  route?: string
  children?: NavigationItem[]
  description?: string
  color?: string
  category?: string
  visible?: boolean
  requiredRole?: 'admin' | 'master_admin' | 'user'
  requiredFeature?: string
  visibleInVerticals?: VerticalId[]
}

export interface NavigationConfig {
  primaryNav: NavigationItem[]
  departmentNav: NavigationItem[]
  additionalDepartments: NavigationItem[]
  operationsNav: NavigationItem[]
  adminNav: NavigationItem[]
}

export interface IntegrationConfig {
  name: string
  description: string
  url: string
  category: string
  supportsOAuth?: boolean
  note?: string
  vertical?: VerticalId[]
}

export interface FeatureConfig {
  id: string
  name: string
  description: string
  enabled: boolean
  requiredRole?: string
  category?: string
}

export interface AICapability {
  id: string
  name: string
  description: string
  category: string
  enabled: boolean
  features: string[]
}

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: {
    primary: string
    secondary: string
    disabled: string
  }
  status: {
    success: string
    warning: string
    error: string
    info: string
  }
  borders: string
}

export interface VerticalBranding {
  colors: ThemeColors
}

export interface VerticalConfig {
  id: VerticalId
  name: string
  displayName: string
  description: string
  userModel: UserModel
  terminology: TerminologyMap
  navigation: NavigationConfig
  features: FeatureConfig[]
  integrations: {
    [category: string]: IntegrationConfig[]
  }
  aiCapabilities: AICapability[]
  departmentColors: {
    [departmentId: string]: string
  }
  branding: VerticalBranding
}

export interface VerticalChangeRequest {
  id: string
  organization_id: string
  requested_by_user_id: string
  current_vertical: VerticalId
  requested_vertical: VerticalId
  reason: string
  status: 'pending' | 'approved' | 'denied'
  created_at: string
  reviewed_at?: string
  reviewed_by_user_id?: string
  notes?: string
}
