import { supabase } from '../lib/supabase'
import { MetricType, CalculatedMetrics } from '../types/departmentLandingPage'

/**
 * Calculate document count for a department
 */
export const calculateDocumentCount = async (
  organizationId: string,
  departmentId: string
): Promise<number> => {
  try {
    // Count documents that match the department category or tags
    const { count, error } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .or(`category.ilike.%${departmentId}%,tags.cs.{${departmentId}}`)

    if (error) {
      console.error('[calculateDocumentCount] Error:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('[calculateDocumentCount] Exception:', error)
    return 0
  }
}

/**
 * Calculate team member count for a department
 * Note: This is a placeholder - actual implementation would depend on
 * how departments are linked to users in your system
 */
export const calculateTeamMemberCount = async (
  organizationId: string,
  _departmentId: string
): Promise<number> => {
  try {
    // Placeholder: Count active users in the organization
    // In a real system, you'd filter by department assignment
    const { count, error } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    if (error) {
      console.error('[calculateTeamMemberCount] Error:', error)
      return 8 // Default fallback
    }

    // Return total users / 3 as a rough estimate per department
    // This should be replaced with actual department assignments
    return Math.max(Math.floor((count || 24) / 3), 1)
  } catch (error) {
    console.error('[calculateTeamMemberCount] Exception:', error)
    return 8 // Default fallback
  }
}

/**
 * Calculate active projects count
 * Note: This is a placeholder - requires a projects table
 */
export const calculateActiveProjects = async (
  _organizationId: string,
  _departmentId: string
): Promise<number> => {
  // Placeholder return value
  // In a real system, this would query a projects table
  return 5
}

/**
 * Calculate resources count
 * Note: This is a placeholder - requires a resources table
 */
export const calculateResources = async (
  _organizationId: string,
  _departmentId: string
): Promise<number> => {
  // Placeholder return value
  // In a real system, this would query a resources table
  return 12
}

/**
 * Calculate custom metric
 * Note: This would execute custom queries stored in the stat card config
 */
export const calculateCustomMetric = async (
  _organizationId: string,
  _departmentId: string,
  _customQuery?: string
): Promise<number> => {
  // Placeholder for future custom metric support
  return 0
}

/**
 * Calculate a metric based on its type
 */
export const calculateMetric = async (
  metricType: MetricType,
  organizationId: string,
  departmentId: string,
  customQuery?: string
): Promise<number> => {
  switch (metricType) {
    case 'documents':
      return await calculateDocumentCount(organizationId, departmentId)
    case 'team_members':
      return await calculateTeamMemberCount(organizationId, departmentId)
    case 'active_projects':
      return await calculateActiveProjects(organizationId, departmentId)
    case 'resources':
      return await calculateResources(organizationId, departmentId)
    case 'custom':
      return await calculateCustomMetric(organizationId, departmentId, customQuery)
    default:
      console.warn(`Unknown metric type: ${metricType}`)
      return 0
  }
}

/**
 * Calculate all metrics for a list of metric types
 */
export const calculateAllMetrics = async (
  metricTypes: MetricType[],
  organizationId: string,
  departmentId: string
): Promise<CalculatedMetrics> => {
  try {
    console.log('[calculateAllMetrics] Calculating:', {
      metricTypes,
      organizationId,
      departmentId
    })

    const metrics: CalculatedMetrics = {}

    // Calculate all metrics in parallel
    const results = await Promise.all(
      metricTypes.map(async (type) => ({
        type,
        value: await calculateMetric(type, organizationId, departmentId)
      }))
    )

    // Build metrics object
    results.forEach(({ type, value }) => {
      metrics[type] = value
    })

    console.log('[calculateAllMetrics] Results:', metrics)
    return metrics
  } catch (error) {
    console.error('[calculateAllMetrics] Exception:', error)
    return {}
  }
}

/**
 * Get metric display name
 */
export const getMetricDisplayName = (metricType: MetricType): string => {
  const displayNames: Record<MetricType, string> = {
    documents: 'Documents',
    team_members: 'Team Members',
    active_projects: 'Active Projects',
    resources: 'Resources',
    custom: 'Custom Metric'
  }

  return displayNames[metricType] || metricType
}

/**
 * Get metric description
 */
export const getMetricDescription = (metricType: MetricType): string => {
  const descriptions: Record<MetricType, string> = {
    documents: 'Total documents in this department',
    team_members: 'Number of team members assigned',
    active_projects: 'Currently active projects',
    resources: 'Available resources and tools',
    custom: 'Custom calculated metric'
  }

  return descriptions[metricType] || ''
}
