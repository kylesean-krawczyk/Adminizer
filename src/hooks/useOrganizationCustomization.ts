import { useState, useEffect, useCallback } from 'react'
import { VerticalId } from '../config/types'
import {
  OrganizationCustomization,
  CustomizationDraft,
  SaveCustomizationParams
} from '../types/organizationCustomization'
import {
  getCustomizationForVertical,
  saveCustomization,
  getCustomizationHistory,
  rollbackToVersion,
  copyFromVertical,
  exportCustomization,
  importCustomization,
  CopyCustomizationParams
} from '../services/organizationCustomizationService'

interface UseOrganizationCustomizationOptions {
  organizationId: string
  initialVerticalId: VerticalId
}

export const useOrganizationCustomization = (options: UseOrganizationCustomizationOptions) => {
  const { organizationId, initialVerticalId } = options

  const [selectedVertical, setSelectedVertical] = useState<VerticalId>(initialVerticalId)
  const [customization, setCustomization] = useState<OrganizationCustomization | null>(null)
  const [draft, setDraft] = useState<CustomizationDraft>({
    dashboard_config: {},
    navigation_config: {},
    branding_config: {},
    stats_config: {},
    department_config: {},
    hasChanges: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCustomization = useCallback(async (verticalId: VerticalId) => {
    // Skip loading if organizationId is empty
    if (!organizationId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const data = await getCustomizationForVertical(organizationId, verticalId)
      setCustomization(data)

      if (data) {
        setDraft({
          dashboard_config: data.dashboard_config || {},
          navigation_config: data.navigation_config || {},
          branding_config: data.branding_config || {},
          stats_config: data.stats_config || {},
          department_config: data.department_config || {},
          hasChanges: false,
          lastSaved: data.updated_at
        })
      } else {
        setDraft({
          dashboard_config: {},
          navigation_config: {},
          branding_config: {},
          stats_config: {},
          department_config: {},
          hasChanges: false
        })
      }
    } catch (err) {
      console.error('Error loading customization:', err)
      setError(err instanceof Error ? err.message : 'Failed to load customization')
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    loadCustomization(selectedVertical)
  }, [selectedVertical, loadCustomization])

  useEffect(() => {
    const savedDraft = localStorage.getItem(`customization-draft-${organizationId}-${selectedVertical}`)
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft)
        if (parsed.hasChanges) {
          setDraft(parsed)
        }
      } catch (error) {
        console.error('Error loading draft from localStorage:', error)
      }
    }
  }, [organizationId, selectedVertical])

  useEffect(() => {
    if (draft.hasChanges) {
      localStorage.setItem(
        `customization-draft-${organizationId}-${selectedVertical}`,
        JSON.stringify(draft)
      )
    } else {
      localStorage.removeItem(`customization-draft-${organizationId}-${selectedVertical}`)
    }
  }, [draft, organizationId, selectedVertical])

  const updateDraft = useCallback((
    section: keyof Pick<CustomizationDraft, 'dashboard_config' | 'navigation_config' | 'branding_config' | 'stats_config' | 'department_config'>,
    value: any
  ) => {
    setDraft(prev => ({
      ...prev,
      [section]: value,
      hasChanges: true
    }))
  }, [])

  const save = useCallback(async (changeDescription?: string, changeNote?: string) => {
    // Prevent save if no organization
    if (!organizationId) {
      throw new Error('No organization available')
    }

    try {
      setSaving(true)
      setError(null)

      const params: SaveCustomizationParams = {
        organizationId,
        verticalId: selectedVertical,
        customization: {
          dashboard_config: draft.dashboard_config,
          navigation_config: draft.navigation_config,
          branding_config: draft.branding_config,
          stats_config: draft.stats_config,
          department_config: draft.department_config
        },
        changeDescription,
        changeNote
      }

      const saved = await saveCustomization(params)
      setCustomization(saved)

      setDraft({
        dashboard_config: saved.dashboard_config || {},
        navigation_config: saved.navigation_config || {},
        branding_config: saved.branding_config || {},
        stats_config: saved.stats_config || {},
        department_config: saved.department_config || {},
        hasChanges: false,
        lastSaved: saved.updated_at
      })

      localStorage.removeItem(`customization-draft-${organizationId}-${selectedVertical}`)

      return saved
    } catch (err) {
      console.error('Error saving customization:', err)
      setError(err instanceof Error ? err.message : 'Failed to save customization')
      throw err
    } finally {
      setSaving(false)
    }
  }, [organizationId, selectedVertical, draft])

  const resetToDefaults = useCallback(async () => {
    setDraft({
      dashboard_config: {},
      navigation_config: {},
      branding_config: {},
      stats_config: {},
      department_config: {},
      hasChanges: true
    })
  }, [])

  const discardChanges = useCallback(() => {
    if (customization) {
      setDraft({
        dashboard_config: customization.dashboard_config || {},
        navigation_config: customization.navigation_config || {},
        branding_config: customization.branding_config || {},
        stats_config: customization.stats_config || {},
        department_config: customization.department_config || {},
        hasChanges: false,
        lastSaved: customization.updated_at
      })
    } else {
      setDraft({
        dashboard_config: {},
        navigation_config: {},
        branding_config: {},
        stats_config: {},
        department_config: {},
        hasChanges: false
      })
    }
    localStorage.removeItem(`customization-draft-${organizationId}-${selectedVertical}`)
  }, [customization, organizationId, selectedVertical])

  const switchVertical = useCallback((newVerticalId: VerticalId) => {
    if (draft.hasChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Do you want to discard them and switch verticals?'
      )
      if (!confirmed) {
        return false
      }
    }
    setSelectedVertical(newVerticalId)
    return true
  }, [draft.hasChanges])

  const loadHistory = useCallback(async (options?: { limit?: number; offset?: number }) => {
    if (!organizationId) return []

    try {
      return await getCustomizationHistory(organizationId, selectedVertical, options)
    } catch (err) {
      console.error('Error loading history:', err)
      return []
    }
  }, [organizationId, selectedVertical])

  const rollback = useCallback(async (historyId: string) => {
    if (!organizationId) {
      throw new Error('No organization available')
    }

    try {
      setSaving(true)
      const restored = await rollbackToVersion(historyId, organizationId, selectedVertical)
      setCustomization(restored)
      setDraft({
        dashboard_config: restored.dashboard_config || {},
        navigation_config: restored.navigation_config || {},
        branding_config: restored.branding_config || {},
        stats_config: restored.stats_config || {},
        department_config: restored.department_config || {},
        hasChanges: false,
        lastSaved: restored.updated_at
      })
      return restored
    } catch (err) {
      console.error('Error rolling back:', err)
      throw err
    } finally {
      setSaving(false)
    }
  }, [organizationId, selectedVertical])

  const copyFrom = useCallback(async (params: Omit<CopyCustomizationParams, 'organizationId' | 'targetVerticalId'>) => {
    if (!organizationId) {
      throw new Error('No organization available')
    }

    try {
      setSaving(true)
      const copied = await copyFromVertical({
        ...params,
        organizationId,
        targetVerticalId: selectedVertical
      })
      setCustomization(copied)
      setDraft({
        dashboard_config: copied.dashboard_config || {},
        navigation_config: copied.navigation_config || {},
        branding_config: copied.branding_config || {},
        stats_config: copied.stats_config || {},
        department_config: copied.department_config || {},
        hasChanges: false,
        lastSaved: copied.updated_at
      })
      return copied
    } catch (err) {
      console.error('Error copying from vertical:', err)
      throw err
    } finally {
      setSaving(false)
    }
  }, [organizationId, selectedVertical])

  const exportConfig = useCallback(async () => {
    if (!organizationId) {
      throw new Error('No organization available')
    }

    try {
      return await exportCustomization(organizationId, selectedVertical)
    } catch (err) {
      console.error('Error exporting customization:', err)
      throw err
    }
  }, [organizationId, selectedVertical])

  const importConfig = useCallback(async (jsonData: string) => {
    if (!organizationId) {
      throw new Error('No organization available')
    }

    try {
      setSaving(true)
      const imported = await importCustomization(organizationId, selectedVertical, jsonData)
      setCustomization(imported)
      setDraft({
        dashboard_config: imported.dashboard_config || {},
        navigation_config: imported.navigation_config || {},
        branding_config: imported.branding_config || {},
        stats_config: imported.stats_config || {},
        department_config: imported.department_config || {},
        hasChanges: false,
        lastSaved: imported.updated_at
      })
      return imported
    } catch (err) {
      console.error('Error importing customization:', err)
      throw err
    } finally {
      setSaving(false)
    }
  }, [organizationId, selectedVertical])

  return {
    selectedVertical,
    customization,
    draft,
    loading,
    saving,
    error,
    hasUnsavedChanges: draft.hasChanges,
    updateDraft,
    save,
    resetToDefaults,
    discardChanges,
    switchVertical,
    loadHistory,
    rollback,
    copyFrom,
    exportConfig,
    importConfig,
    refresh: () => loadCustomization(selectedVertical)
  }
}
