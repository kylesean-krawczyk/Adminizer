import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { StatCard, CalculatedMetrics, MetricType } from '../types/departmentLandingPage'
import { calculateAllMetrics } from '../services/metricCalculationService'

interface UseStatCardMetricsOptions {
  statCards: StatCard[]
  departmentId: string
  organizationId?: string
  enabled?: boolean
}

interface UseStatCardMetricsReturn {
  metrics: CalculatedMetrics
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to calculate metrics for stat cards
 * Fetches real-time values for each metric type
 */
export function useStatCardMetrics(
  options: UseStatCardMetricsOptions
): UseStatCardMetricsReturn {
  const { statCards, departmentId, organizationId: propOrgId, enabled = true } = options
  const { user } = useAuth()

  const organizationId = propOrgId || user?.organizationId

  const [metrics, setMetrics] = useState<CalculatedMetrics>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Calculate all metrics for the stat cards
   */
  const calculateMetrics = useCallback(async () => {
    if (!organizationId || !enabled || !departmentId || statCards.length === 0) {
      console.log('[useStatCardMetrics] Missing required params or no stat cards:', {
        organizationId,
        enabled,
        departmentId,
        statCardsCount: statCards.length
      })
      setLoading(false)
      setMetrics({})
      return
    }

    try {
      console.log('[useStatCardMetrics] Calculating metrics for', statCards.length, 'cards')

      setLoading(true)
      setError(null)

      // Extract unique metric types from stat cards
      const metricTypes = [...new Set(statCards.map(card => card.metric_type))] as MetricType[]

      console.log('[useStatCardMetrics] Metric types to calculate:', metricTypes)

      const calculatedMetrics = await calculateAllMetrics(
        metricTypes,
        organizationId,
        departmentId
      )

      console.log('[useStatCardMetrics] Calculated metrics:', calculatedMetrics)

      setMetrics(calculatedMetrics)
      setError(null)
    } catch (err) {
      console.error('[useStatCardMetrics] Error calculating metrics:', err)
      setError(err instanceof Error ? err.message : 'Failed to calculate metrics')
      setMetrics({})
    } finally {
      setLoading(false)
    }
  }, [organizationId, departmentId, statCards, enabled])

  useEffect(() => {
    calculateMetrics()
  }, [calculateMetrics])

  const refetch = useCallback(async () => {
    await calculateMetrics()
  }, [calculateMetrics])

  return {
    metrics,
    loading,
    error,
    refetch
  }
}
