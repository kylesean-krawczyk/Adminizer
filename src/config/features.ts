import { FeatureFlag, FeatureIds } from '../types/features'

export const FEATURE_REGISTRY: Record<string, FeatureFlag> = {
  [FeatureIds.DOCUMENT_MANAGEMENT]: {
    id: FeatureIds.DOCUMENT_MANAGEMENT,
    name: 'Document Management',
    description: 'Upload, organize, and manage documents',
    enabled: true,
    allowedVerticals: ['church', 'business', 'estate'],
    category: 'core'
  },
  [FeatureIds.OAUTH_INTEGRATIONS]: {
    id: FeatureIds.OAUTH_INTEGRATIONS,
    name: 'OAuth Integrations',
    description: 'Connect to third-party services via OAuth',
    enabled: true,
    allowedVerticals: ['church', 'business', 'estate'],
    category: 'integrations'
  },
  [FeatureIds.USER_MANAGEMENT]: {
    id: FeatureIds.USER_MANAGEMENT,
    name: 'User Management',
    description: 'Manage users, roles, and permissions',
    enabled: true,
    allowedVerticals: ['church', 'business', 'estate'],
    requiredRole: 'admin',
    category: 'administration'
  },
  [FeatureIds.DONOR_ANALYTICS]: {
    id: FeatureIds.DONOR_ANALYTICS,
    name: 'Donor Analytics',
    description: 'AI-powered insights into giving patterns and donor behavior',
    enabled: true,
    allowedVerticals: ['church'],
    category: 'analytics',
    requiredRole: 'admin'
  },
  [FeatureIds.DONOR_MANAGEMENT]: {
    id: FeatureIds.DONOR_MANAGEMENT,
    name: 'Donor Management',
    description: 'Comprehensive donor database and relationship management',
    enabled: true,
    allowedVerticals: ['church'],
    category: 'fundraising',
    dependencies: [FeatureIds.DONOR_ANALYTICS]
  },
  [FeatureIds.FUNDRAISING_AI]: {
    id: FeatureIds.FUNDRAISING_AI,
    name: 'Fundraising AI Assistant',
    description: 'AI-powered fundraising recommendations and campaign optimization',
    enabled: true,
    allowedVerticals: ['church'],
    category: 'fundraising',
    requiredRole: 'admin',
    dependencies: [FeatureIds.DONOR_ANALYTICS]
  },
  [FeatureIds.CUSTOMER_ANALYTICS]: {
    id: FeatureIds.CUSTOMER_ANALYTICS,
    name: 'Customer Analytics',
    description: 'AI-powered insights into customer behavior and sales patterns',
    enabled: true,
    allowedVerticals: ['business'],
    category: 'analytics',
    requiredRole: 'admin',
    comingSoon: true
  },
  [FeatureIds.ASSET_ORGANIZATION]: {
    id: FeatureIds.ASSET_ORGANIZATION,
    name: 'Asset Organization Assistant',
    description: 'AI-powered suggestions for categorizing and organizing assets',
    enabled: true,
    allowedVerticals: ['estate'],
    category: 'organization'
  },
  [FeatureIds.DIGITAL_ASSET_INVENTORY]: {
    id: FeatureIds.DIGITAL_ASSET_INVENTORY,
    name: 'Digital Asset Inventory',
    description: 'Catalog and organize digital assets, accounts, and subscriptions',
    enabled: true,
    allowedVerticals: ['estate'],
    category: 'inventory'
  },
  [FeatureIds.BENEFICIARY_ACCESS]: {
    id: FeatureIds.BENEFICIARY_ACCESS,
    name: 'Beneficiary Access Controls',
    description: 'Manage who can access what and when in your estate',
    enabled: true,
    allowedVerticals: ['estate'],
    category: 'security'
  }
}

export function getFeature(featureId: string): FeatureFlag | undefined {
  return FEATURE_REGISTRY[featureId]
}

export function getAllFeatures(): FeatureFlag[] {
  return Object.values(FEATURE_REGISTRY)
}

export function getFeaturesByCategory(category: string): FeatureFlag[] {
  return getAllFeatures().filter(f => f.category === category)
}

export function getFeaturesByVertical(verticalId: string): FeatureFlag[] {
  return getAllFeatures().filter(f =>
    f.allowedVerticals.includes(verticalId as any)
  )
}

export function getAnalyticsFeatureIdForVertical(verticalId: string): string | undefined {
  if (verticalId === 'church') {
    return FeatureIds.DONOR_ANALYTICS
  } else if (verticalId === 'business') {
    return FeatureIds.CUSTOMER_ANALYTICS
  } else if (verticalId === 'estate') {
    return FeatureIds.ASSET_ORGANIZATION
  }
  return undefined
}
