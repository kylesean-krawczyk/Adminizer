import { useState, useCallback } from 'react'
import { VerticalId } from '../config/types'
import {
  SaveStatCardParams,
  SaveDepartmentFeatureParams,
  SaveDepartmentToolParams,
  StatCard,
  DepartmentFeature,
  DepartmentTool
} from '../types/departmentLandingPage'
import {
  saveStatCard,
  deleteStatCard,
  reorderStatCards,
  saveDepartmentFeature,
  deleteDepartmentFeature,
  reorderFeatures,
  saveDepartmentTool,
  deleteDepartmentTool,
  reorderTools,
  updateDepartmentVisualConfig
} from '../services/departmentLandingService'

interface UseDepartmentCustomizationOptions {
  organizationId: string
  verticalId: VerticalId
  departmentId: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

interface UseDepartmentCustomizationReturn {
  // Stat Cards
  saveStatCardData: (params: Omit<SaveStatCardParams, 'organizationId' | 'verticalId' | 'departmentId'>) => Promise<StatCard | null>
  deleteStatCardData: (id: string) => Promise<boolean>
  reorderStatCardsData: (updates: Array<{ id: string; display_order: number }>) => Promise<boolean>

  // Features
  saveFeatureData: (params: Omit<SaveDepartmentFeatureParams, 'organizationId' | 'verticalId' | 'departmentId'>) => Promise<DepartmentFeature | null>
  deleteFeatureData: (id: string) => Promise<boolean>
  reorderFeaturesData: (updates: Array<{ id: string; display_order: number }>) => Promise<boolean>

  // Tools
  saveToolData: (params: Omit<SaveDepartmentToolParams, 'organizationId' | 'verticalId' | 'departmentId'>) => Promise<DepartmentTool | null>
  deleteToolData: (id: string) => Promise<boolean>
  reorderToolsData: (updates: Array<{ id: string; display_order: number }>) => Promise<boolean>

  // Visual Config
  updateVisualConfig: (iconName?: string, emoji?: string, colorTheme?: string) => Promise<boolean>

  // State
  saving: boolean
  error: string | null
}

/**
 * Hook for customizing department landing pages
 * Provides CRUD operations for stat cards, features, and tools
 */
export function useDepartmentCustomization(
  options: UseDepartmentCustomizationOptions
): UseDepartmentCustomizationReturn {
  const { organizationId, verticalId, departmentId, onSuccess, onError } = options

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper to handle operations with state management
  const handleOperation = useCallback(
    async <T>(
      operation: () => Promise<T>,
      successMessage?: string
    ): Promise<T | null> => {
      try {
        setSaving(true)
        setError(null)

        const result = await operation()

        if (successMessage) {
          console.log(successMessage, result)
        }

        if (onSuccess) {
          onSuccess()
        }

        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Operation failed'
        console.error('[useDepartmentCustomization] Error:', errorMessage)
        setError(errorMessage)

        if (onError) {
          onError(errorMessage)
        }

        return null
      } finally {
        setSaving(false)
      }
    },
    [onSuccess, onError]
  )

  // Stat Card operations
  const saveStatCardData = useCallback(
    async (params: Omit<SaveStatCardParams, 'organizationId' | 'verticalId' | 'departmentId'>) => {
      return handleOperation(
        () => saveStatCard({
          ...params,
          organizationId,
          verticalId,
          departmentId
        }),
        '[useDepartmentCustomization] Stat card saved:'
      )
    },
    [organizationId, verticalId, departmentId, handleOperation]
  )

  const deleteStatCardData = useCallback(
    async (id: string) => {
      const result = await handleOperation(
        () => deleteStatCard(id),
        '[useDepartmentCustomization] Stat card deleted'
      )
      return result !== null ? result : false
    },
    [handleOperation]
  )

  const reorderStatCardsData = useCallback(
    async (updates: Array<{ id: string; display_order: number }>) => {
      const result = await handleOperation(
        () => reorderStatCards({
          organizationId,
          verticalId,
          departmentId,
          updates
        }),
        '[useDepartmentCustomization] Stat cards reordered'
      )
      return result !== null ? result : false
    },
    [organizationId, verticalId, departmentId, handleOperation]
  )

  // Feature operations
  const saveFeatureData = useCallback(
    async (params: Omit<SaveDepartmentFeatureParams, 'organizationId' | 'verticalId' | 'departmentId'>) => {
      return handleOperation(
        () => saveDepartmentFeature({
          ...params,
          organizationId,
          verticalId,
          departmentId
        }),
        '[useDepartmentCustomization] Feature saved:'
      )
    },
    [organizationId, verticalId, departmentId, handleOperation]
  )

  const deleteFeatureData = useCallback(
    async (id: string) => {
      const result = await handleOperation(
        () => deleteDepartmentFeature(id),
        '[useDepartmentCustomization] Feature deleted'
      )
      return result !== null ? result : false
    },
    [handleOperation]
  )

  const reorderFeaturesData = useCallback(
    async (updates: Array<{ id: string; display_order: number }>) => {
      const result = await handleOperation(
        () => reorderFeatures({
          organizationId,
          verticalId,
          departmentId,
          updates
        }),
        '[useDepartmentCustomization] Features reordered'
      )
      return result !== null ? result : false
    },
    [organizationId, verticalId, departmentId, handleOperation]
  )

  // Tool operations
  const saveToolData = useCallback(
    async (params: Omit<SaveDepartmentToolParams, 'organizationId' | 'verticalId' | 'departmentId'>) => {
      return handleOperation(
        () => saveDepartmentTool({
          ...params,
          organizationId,
          verticalId,
          departmentId
        }),
        '[useDepartmentCustomization] Tool saved:'
      )
    },
    [organizationId, verticalId, departmentId, handleOperation]
  )

  const deleteToolData = useCallback(
    async (id: string) => {
      const result = await handleOperation(
        () => deleteDepartmentTool(id),
        '[useDepartmentCustomization] Tool deleted'
      )
      return result !== null ? result : false
    },
    [handleOperation]
  )

  const reorderToolsData = useCallback(
    async (updates: Array<{ id: string; display_order: number }>) => {
      const result = await handleOperation(
        () => reorderTools({
          organizationId,
          verticalId,
          departmentId,
          updates
        }),
        '[useDepartmentCustomization] Tools reordered'
      )
      return result !== null ? result : false
    },
    [organizationId, verticalId, departmentId, handleOperation]
  )

  // Visual config operations
  const updateVisualConfig = useCallback(
    async (iconName?: string, emoji?: string, colorTheme?: string) => {
      const result = await handleOperation(
        () => updateDepartmentVisualConfig(
          organizationId,
          verticalId,
          departmentId,
          iconName,
          emoji,
          colorTheme
        ),
        '[useDepartmentCustomization] Visual config updated'
      )
      return result !== null ? result : false
    },
    [organizationId, verticalId, departmentId, handleOperation]
  )

  return {
    // Stat Cards
    saveStatCardData,
    deleteStatCardData,
    reorderStatCardsData,

    // Features
    saveFeatureData,
    deleteFeatureData,
    reorderFeaturesData,

    // Tools
    saveToolData,
    deleteToolData,
    reorderToolsData,

    // Visual Config
    updateVisualConfig,

    // State
    saving,
    error
  }
}
