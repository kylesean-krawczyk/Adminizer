import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { VerticalId } from '../config/types'
import {
  StatCard,
  DepartmentFeature,
  DepartmentTool,
  DepartmentConfiguration,
  DepartmentIntegration,
  QuickAction
} from '../types/departmentLandingPage'
import { getDepartmentLandingData } from '../services/departmentLandingService'

interface UseDepartmentLandingDataOptions {
  departmentId: string
  verticalId: VerticalId
  organizationId?: string
  enabled?: boolean
}

interface UseDepartmentLandingDataReturn {
  config: DepartmentConfiguration | null
  statCards: StatCard[]
  features: DepartmentFeature[]
  tools: DepartmentTool[]
  integrations: DepartmentIntegration[]
  quickActions: QuickAction[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch complete department landing page data
 * Provides configuration, stat cards, features, and tools
 */
export function useDepartmentLandingData(
  options: UseDepartmentLandingDataOptions
): UseDepartmentLandingDataReturn {
  const { departmentId, verticalId, organizationId: propOrgId, enabled = true } = options
  const { user } = useAuth()

  const organizationId = propOrgId || user?.organizationId

  const [config, setConfig] = useState<DepartmentConfiguration | null>(null)
  const [statCards, setStatCards] = useState<StatCard[]>([])
  const [features, setFeatures] = useState<DepartmentFeature[]>([])
  const [tools, setTools] = useState<DepartmentTool[]>([])
  const [integrations, setIntegrations] = useState<DepartmentIntegration[]>([])
  const [quickActions, setQuickActions] = useState<QuickAction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load department landing page data
   */
  const loadData = useCallback(async () => {
    if (!organizationId || !enabled || !departmentId) {
      console.log('[useDepartmentLandingData] Missing required params:', {
        organizationId,
        enabled,
        departmentId
      })
      setLoading(false)
      return
    }

    try {
      console.log('[useDepartmentLandingData] 🚀 Loading data:', {
        organizationId,
        verticalId,
        departmentId
      })

      setLoading(true)
      setError(null)

      const data = await getDepartmentLandingData(
        organizationId,
        verticalId,
        departmentId
      )

      console.log('[useDepartmentLandingData] ✅ Stat cards:', data.statCards.length)
      console.log('[useDepartmentLandingData] ✅ Features:', data.features.length)
      console.log('[useDepartmentLandingData] ✅ Tools:', data.tools.length)
      console.log('[useDepartmentLandingData] 🔌 Integrations:', data.integrations.length)
      console.log('[useDepartmentLandingData] ⚡ Quick actions:', data.quickActions.length)

      setConfig(data.config)
      setStatCards(data.statCards)
      setFeatures(data.features)
      setTools(data.tools)
      setIntegrations(data.integrations)
      setQuickActions(data.quickActions)
      setError(null)
    } catch (err) {
      console.error('[useDepartmentLandingData] ❌ Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load department data')
      setConfig(null)
      setStatCards([])
      setFeatures([])
      setTools([])
      setIntegrations([])
      setQuickActions([])
    } finally {
      setLoading(false)
    }
  }, [organizationId, verticalId, departmentId, enabled])

  useEffect(() => {
    loadData()
  }, [loadData])

  const refetch = useCallback(async () => {
    await loadData()
  }, [loadData])

  return {
    config,
    statCards,
    features,
    tools,
    integrations,
    quickActions,
    loading,
    error,
    refetch
  }
}
