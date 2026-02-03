import { VerticalId } from '../config/types'

export interface FeatureFlag {
  id: string
  name: string
  description: string
  enabled: boolean
  allowedVerticals: VerticalId[]
  requiredRole?: 'admin' | 'master_admin' | 'user'
  category?: string
  comingSoon?: boolean
  betaAccess?: boolean
  dependencies?: string[]
}

export interface FeatureFlagOverride {
  featureId: string
  enabled: boolean
  organizationId: string
  updatedBy: string
  updatedAt: string
}

export interface FeatureFlagAuditLog {
  id: string
  organization_id: string
  feature_id: string
  action: 'enabled' | 'disabled' | 'override_added' | 'override_removed'
  changed_by: string
  old_value: boolean
  new_value: boolean
  timestamp: string
  notes?: string
}

export interface FeatureAvailability {
  available: boolean
  reason?: 'vertical_restriction' | 'role_restriction' | 'coming_soon' | 'beta_only' | 'disabled'
  message?: string
}

export const FeatureIds = {
  DOCUMENT_MANAGEMENT: 'document-management',
  OAUTH_INTEGRATIONS: 'oauth-integrations',
  DONOR_ANALYTICS: 'donor-analytics',
  DONOR_MANAGEMENT: 'donor-management',
  FUNDRAISING_AI: 'fundraising-ai',
  CUSTOMER_ANALYTICS: 'customer-analytics',
  ASSET_ORGANIZATION: 'asset-organization',
  DIGITAL_ASSET_INVENTORY: 'digital-asset-inventory',
  BENEFICIARY_ACCESS: 'beneficiary-access',
  USER_MANAGEMENT: 'user-management'
} as const

export type FeatureId = typeof FeatureIds[keyof typeof FeatureIds]
