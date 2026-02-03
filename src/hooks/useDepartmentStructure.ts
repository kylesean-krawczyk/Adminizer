import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { VerticalConfig, VerticalId } from '../config/types'
import { DepartmentSectionAssignment } from '../types/departmentAssignments'
import { mergeDepartmentsWithAssignments, SectionedDepartments } from '../utils/departmentMerger'

interface UseDepartmentStructureOptions {
  organizationId?: string
  verticalId: VerticalId
  baseConfig: VerticalConfig
  enabled?: boolean
}

interface UseDepartmentStructureReturn {
  structure: SectionedDepartments | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch and merge department assignments with base vertical configuration
 * Provides a unified department structure that respects database customizations
 */
export function useDepartmentStructure(
  options: UseDepartmentStructureOptions
): UseDepartmentStructureReturn {
  const { organizationId, verticalId, baseConfig, enabled = true } = options

  const [structure, setStructure] = useState<SectionedDepartments | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetches assignments from database and merges with base config
   */
  const loadStructure = useCallback(async () => {
    console.log('[useDepartmentStructure] Loading structure:', {
      organizationId,
      verticalId,
      enabled
    })

    // If no organization ID, use base config only
    if (!organizationId || !enabled) {
      console.log('[useDepartmentStructure] No org ID or disabled, using base config only')
      const emptyStructure = mergeDepartmentsWithAssignments(baseConfig, [])
      setStructure(emptyStructure)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch assignments from database
      const { data: assignments, error: fetchError } = await supabase
        .from('department_section_assignments')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('vertical_id', verticalId)

      if (fetchError) {
        // If table doesn't exist or RLS blocks, fall back to base config
        if (fetchError.code === '42P01' || fetchError.code === '42501') {
          console.warn('[useDepartmentStructure] Table not accessible, using base config:', fetchError.message)
          const fallbackStructure = mergeDepartmentsWithAssignments(baseConfig, [])
          setStructure(fallbackStructure)
          setLoading(false)
          return
        }

        throw fetchError
      }

      console.log('[useDepartmentStructure] Fetched assignments:', {
        count: assignments?.length || 0,
        assignments: assignments?.map(a => ({
          dept: a.department_id,
          section: a.section_id,
          order: a.display_order,
          visible: a.is_visible
        }))
      })

      // Merge assignments with base config
      const mergedStructure = mergeDepartmentsWithAssignments(
        baseConfig,
        (assignments as DepartmentSectionAssignment[]) || []
      )

      setStructure(mergedStructure)
      console.log('[useDepartmentStructure] Structure loaded successfully')

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load department structure'
      console.error('[useDepartmentStructure] Error loading structure:', err)
      setError(errorMessage)

      // Fall back to base config on error
      const fallbackStructure = mergeDepartmentsWithAssignments(baseConfig, [])
      setStructure(fallbackStructure)

    } finally {
      setLoading(false)
    }
  }, [organizationId, verticalId, baseConfig, enabled])

  // Load structure on mount and when dependencies change
  useEffect(() => {
    loadStructure()
  }, [loadStructure])

  return {
    structure,
    loading,
    error,
    refetch: loadStructure
  }
}
