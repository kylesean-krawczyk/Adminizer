import { VerticalId } from '../config/types'
import { getVerticalConfig } from '../config'
import { getFeature, getAnalyticsFeatureIdForVertical } from '../config/features'

export interface VerticalFeatureMetadata {
  name: string
  description: string
  comingSoonMessage: string
  accessRestrictedMessage: string
  featureUnavailableMessage: string
  patterns: string
  campaigns: string
  departmentName: string
  departmentDescription: string
}

export function getVerticalFeatureMetadata(verticalId: VerticalId): VerticalFeatureMetadata {
  const config = getVerticalConfig(verticalId)
  const terminology = config.terminology

  return {
    name: terminology.analyticsFeature || terminology.analytics || 'Analytics',
    description: terminology.analyticsDescription || 'AI-powered analytics and insights',
    comingSoonMessage: terminology.comingSoonMessage || 'is coming soon for your organization.',
    accessRestrictedMessage: terminology.accessRestrictedMessage || 'This area requires administrator privileges.',
    featureUnavailableMessage: terminology.featureUnavailableMessage || 'is not available at this time.',
    patterns: terminology.patterns || 'patterns',
    campaigns: terminology.campaigns || 'campaigns',
    departmentName: terminology.salesDepartmentName || 'Sales',
    departmentDescription: terminology.salesDepartmentDescription || 'Analytics and management platform'
  }
}

export function getVerticalAnalyticsFeatureId(verticalId: VerticalId): string | undefined {
  return getAnalyticsFeatureIdForVertical(verticalId)
}

export function getVerticalFeatureName(featureId: string, verticalId: VerticalId): string {
  const config = getVerticalConfig(verticalId)
  const feature = getFeature(featureId)

  if (!feature) {
    return featureId
  }

  if (featureId.includes('analytics') || featureId.includes('donor') || featureId.includes('customer')) {
    return config.terminology.analyticsFeature || feature.name
  }

  return feature.name
}

export function getVerticalFeatureDescription(featureId: string, verticalId: VerticalId): string {
  const config = getVerticalConfig(verticalId)
  const feature = getFeature(featureId)

  if (!feature) {
    return ''
  }

  if (featureId.includes('analytics') || featureId.includes('donor') || featureId.includes('customer')) {
    return config.terminology.analyticsDescription || feature.description
  }

  return feature.description
}

export function getVerticalComingSoonMessage(featureName: string, verticalId: VerticalId): string {
  const metadata = getVerticalFeatureMetadata(verticalId)
  return `${featureName} ${metadata.comingSoonMessage}`
}

export function getVerticalAccessRestrictedMessage(departmentName: string, verticalId: VerticalId): string {
  const metadata = getVerticalFeatureMetadata(verticalId)
  return `You don't have access to the ${departmentName} department. ${metadata.accessRestrictedMessage}`
}

export function interpolateVerticalMessage(template: string, verticalId: VerticalId, replacements?: Record<string, string>): string {
  const config = getVerticalConfig(verticalId)
  const terminology = config.terminology

  let result = template

  const defaultReplacements = {
    analytics: terminology.analyticsFeature || terminology.analytics || 'Analytics',
    patterns: terminology.patterns || 'patterns',
    campaigns: terminology.campaigns || 'campaigns',
    relationships: terminology.relationships || 'relationships',
    ...replacements
  }

  Object.entries(defaultReplacements).forEach(([key, value]) => {
    const placeholder = new RegExp(`\\{${key}\\}`, 'g')
    result = result.replace(placeholder, value)
  })

  return result
}
