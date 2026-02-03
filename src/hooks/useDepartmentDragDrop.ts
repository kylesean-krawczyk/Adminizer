import { useState, useEffect, useCallback, useRef } from 'react'
import { VerticalId } from '../config/types'
import {
  DepartmentSectionAssignment,
  DndDepartmentItem,
  SectionId,
  DepartmentMoveAction,
  UndoStackItem,
  SectionDepartments
} from '../types/departmentAssignments'
import {
  getDepartmentAssignments,
  moveDepartmentToSection,
  reorderWithinSection,
  resetDepartmentAssignments,
  saveDepartmentAssignment,
  TableMissingError
} from '../services/departmentAssignmentService'
import { migrateDepartmentCustomizations, initializeAssignments } from '../services/migrateDepartmentCustomizations'
import { useVertical } from '../contexts/VerticalContext'
import { supabase } from '../lib/supabase'

const UNDO_TIMEOUT_MS = 300000 // 5 minutes
const MAX_UNDO_STACK = 10

interface UseDepartmentDragDropOptions {
  organizationId: string
  verticalId: VerticalId
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
}

export const useDepartmentDragDrop = (options: UseDepartmentDragDropOptions) => {
  const { organizationId, verticalId, onSuccess, onError } = options
  const { vertical } = useVertical()

  const [assignments, setAssignments] = useState<DepartmentSectionAssignment[]>([])
  const [sections, setSections] = useState<SectionDepartments>({})
  const [dndItems, setDndItems] = useState<DndDepartmentItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [undoStack, setUndoStack] = useState<UndoStackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useFallbackMode, setUseFallbackMode] = useState(false)
  const [migrationWarning, setMigrationWarning] = useState<string | null>(null)

  // Store previous state for rollback on error
  const previousStateRef = useRef<DepartmentSectionAssignment[]>([])

  // Track fetch attempts to prevent infinite loop
  const fetchAttemptedRef = useRef(false)

  // Stable ref for onError callback to avoid dependency issues
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  /**
   * Loads department assignments from database
   */
  const loadAssignments = useCallback(async () => {
    if (!organizationId || !verticalId) {
      setLoading(false)
      return
    }

    // Check sessionStorage cache for table missing status
    const cacheKey = `dept_table_missing_${organizationId}_${verticalId}`
    const cached = sessionStorage.getItem(cacheKey)

    if (cached && fetchAttemptedRef.current) {
      console.log('[useDepartmentDragDrop] Table known to be missing (cached) - using fallback mode')
      setUseFallbackMode(true)
      setMigrationWarning('Database table is missing. If migration was applied, click "Check Again".')
      setAssignments([])
      setLoading(false)
      return
    }

    // Prevent repeated fetch attempts in fallback mode
    if (fetchAttemptedRef.current && useFallbackMode) {
      console.log('[useDepartmentDragDrop] Already in fallback mode - skipping fetch')
      setLoading(false)
      return
    }

    fetchAttemptedRef.current = true

    try {
      setLoading(true)
      setError(null)

      const data = await getDepartmentAssignments(organizationId, verticalId)

      console.log('[useDepartmentDragDrop] Loaded assignments:', data.length)

      // If no assignments exist, auto-initialize from old customizations or base config
      if (data.length === 0) {
        console.log('[useDepartmentDragDrop] No assignments found - attempting migration/initialization')

        // Try migrating old customizations first
        const migrationResult = await migrateDepartmentCustomizations(organizationId, verticalId)

        if (migrationResult.success && migrationResult.migratedCount > 0) {
          console.log('[useDepartmentDragDrop] Migration successful:', migrationResult.migratedCount, 'items migrated')
          // Reload assignments after migration
          const migratedData = await getDepartmentAssignments(organizationId, verticalId)
          setAssignments(migratedData)
          previousStateRef.current = [...migratedData]
        } else {
          // No old customizations to migrate, initialize from base config
          console.log('[useDepartmentDragDrop] No old customizations - initializing from base config')
          const initResult = await initializeAssignments(organizationId, verticalId)

          if (initResult.success && initResult.initializedCount > 0) {
            console.log('[useDepartmentDragDrop] Initialization successful:', initResult.initializedCount, 'items created')
            // Reload assignments after initialization
            const initializedData = await getDepartmentAssignments(organizationId, verticalId)
            setAssignments(initializedData)
            previousStateRef.current = [...initializedData]
          } else {
            // Still no data, use empty
            setAssignments([])
            previousStateRef.current = []
          }
        }
      } else {
        setAssignments(data)
        previousStateRef.current = [...data]
      }

      setUseFallbackMode(false)
      setMigrationWarning(null)

      // Clear cache if fetch succeeds
      sessionStorage.removeItem(cacheKey)
    } catch (err) {
      console.error('[useDepartmentDragDrop] Load error:', err)

      // Check if it's a table missing error
      if (err instanceof TableMissingError) {
        console.warn('[useDepartmentDragDrop] Table missing - entering fallback mode')
        setUseFallbackMode(true)
        setMigrationWarning('Database table not found. Drag-and-drop is disabled. Using default department layout.')
        setAssignments([])

        // Cache the table missing status
        sessionStorage.setItem(cacheKey, 'true')
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load assignments'
        setError(errorMessage)
        onErrorRef.current?.(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [organizationId, verticalId, useFallbackMode])

  /**
   * Retry loading assignments after migration is applied
   */
  const retryAfterMigration = useCallback(() => {
    const cacheKey = `dept_table_missing_${organizationId}_${verticalId}`
    console.log('[useDepartmentDragDrop] Retry requested - clearing cache and re-fetching')

    // Clear cache and reset state
    sessionStorage.removeItem(cacheKey)
    fetchAttemptedRef.current = false
    setUseFallbackMode(false)
    setMigrationWarning(null)
    setError(null)

    // Retry fetch
    loadAssignments()
  }, [organizationId, verticalId, loadAssignments])

  /**
   * Merges assignments with vertical config to create enriched DnD items
   */
  useEffect(() => {
    if (!vertical) return

    console.log('[useDepartmentDragDrop] Building department list from all navigation sources')

    // Get ALL navigation items (not just dashboard config)
    // This ensures UI Customization shows everything visible in the sidebar
    const allNavigationItems = [
      ...(vertical.navigation.primaryNav || []),
      ...(vertical.navigation.departmentNav || []),
      ...(vertical.navigation.operationsNav || []),
      ...(vertical.navigation.adminNav || [])
    ]

    console.log('[useDepartmentDragDrop] Total navigation items:', {
      primary: vertical.navigation.primaryNav?.length || 0,
      departments: vertical.navigation.departmentNav?.length || 0,
      operations: vertical.navigation.operationsNav?.length || 0,
      admin: vertical.navigation.adminNav?.length || 0,
      total: allNavigationItems.length
    })

    // Normalize navigation items to have all required properties
    const normalizedDepartments = allNavigationItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      icon: item.icon,
      route: item.route,
      color: item.color,
      textColor: item.color ? `text-${item.color}-600` : 'text-gray-600',
      bgColor: item.color ? `bg-${item.color}-50` : 'bg-gray-50',
      requiredRole: item.requiredRole,
      requiredFeature: item.requiredFeature
    }))

    // Merge with assignments
    const enriched: DndDepartmentItem[] = normalizedDepartments.map(dept => {
      const assignment = assignments.find(a => a.department_id === dept.id)

      if (assignment) {
        // Has custom assignment from database
        return {
          ...assignment,
          defaultName: dept.name,
          defaultDescription: dept.description,
          icon: dept.icon,
          color: dept.color,
          route: dept.route,
          requiredRole: dept.requiredRole,
          requiredFeature: dept.requiredFeature
        }
      } else {
        // Use default from config - determine section from navigation type
        const isInOpsNav = vertical.navigation.operationsNav?.some(d => d.id === dept.id)
        const isInAdminNav = vertical.navigation.adminNav?.some(d => d.id === dept.id)
        const isInPrimaryNav = vertical.navigation.primaryNav?.some(d => d.id === dept.id)

        let defaultSectionId: SectionId = 'departments'
        if (isInPrimaryNav) defaultSectionId = 'documents'
        else if (isInOpsNav) defaultSectionId = 'operations'
        else if (isInAdminNav) defaultSectionId = 'admin'

        return {
          id: `temp-${dept.id}`,
          organization_id: organizationId,
          vertical_id: verticalId,
          department_id: dept.id,
          department_key: dept.id,
          section_id: defaultSectionId,
          display_order: 0,
          is_visible: true,
          custom_name: null,
          custom_description: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: null,
          updated_by: null,
          defaultName: dept.name,
          defaultDescription: dept.description,
          icon: dept.icon,
          color: dept.color,
          route: dept.route,
          requiredRole: dept.requiredRole,
          requiredFeature: dept.requiredFeature
        }
      }
    })

    setDndItems(enriched)

    // Group by section
    const grouped: SectionDepartments = {
      documents: [],
      departments: [],
      operations: [],
      admin: []
    }

    enriched.forEach(item => {
      if (item.is_visible) {
        grouped[item.section_id].push(item)
      }
    })

    // Sort each section by display_order
    Object.keys(grouped).forEach(sectionId => {
      grouped[sectionId].sort((a, b) => a.display_order - b.display_order)
    })

    setSections(grouped)
  }, [assignments, vertical, organizationId, verticalId])

  /**
   * Handles drag start event
   */
  const handleDragStart = useCallback((departmentId: string) => {
    console.log('[useDepartmentDragDrop] Drag start:', departmentId)
    setActiveId(departmentId)
  }, [])

  /**
   * Handles drag over event
   */
  const handleDragOver = useCallback((overId: string | null) => {
    setOverId(overId)
  }, [])

  /**
   * Handles drag cancel event
   */
  const handleDragCancel = useCallback(() => {
    console.log('[useDepartmentDragDrop] Drag cancelled')
    setActiveId(null)
    setOverId(null)
  }, [])

  /**
   * Checks if current user has permission to modify department assignments
   */
  const checkUserPermissions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('[useDepartmentDragDrop] No authenticated user')
        return { hasPermission: false, reason: 'Not authenticated' }
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, is_active, organization_id')
        .eq('id', user.id)
        .single()

      console.log('[useDepartmentDragDrop] User profile:', {
        role: profile?.role,
        isActive: profile?.is_active,
        organizationId: profile?.organization_id
      })

      if (!profile) {
        return { hasPermission: false, reason: 'Profile not found' }
      }

      if (!profile.is_active) {
        return { hasPermission: false, reason: 'User account is not active' }
      }

      if (profile.role !== 'master_admin') {
        return {
          hasPermission: false,
          reason: `User role is '${profile.role}', but 'master_admin' is required to modify department assignments`
        }
      }

      return { hasPermission: true, profile }
    } catch (error) {
      console.error('[useDepartmentDragDrop] Error checking permissions:', error)
      return { hasPermission: false, reason: 'Error checking permissions' }
    }
  }, [])

  /**
   * Handles drag end event
   */
  const handleDragEnd = useCallback(
    async (departmentId: string, targetSectionId: SectionId, targetPosition: number) => {
      console.log('[useDepartmentDragDrop] Drag end:', {
        departmentId,
        targetSectionId,
        targetPosition,
        currentAssignmentsCount: assignments.length
      })

      // Check permissions before proceeding
      const permissionCheck = await checkUserPermissions()
      if (!permissionCheck.hasPermission) {
        console.error('[useDepartmentDragDrop] Permission denied:', permissionCheck.reason)
        onError?.(permissionCheck.reason || 'You do not have permission to modify department assignments')
        return
      }

      console.log('[useDepartmentDragDrop] ✓ User has permission to modify')

      setActiveId(null)
      setOverId(null)

      const item = dndItems.find(d => d.department_id === departmentId)
      if (!item) {
        console.error('[useDepartmentDragDrop] Department not found:', departmentId)
        return
      }

      const fromSectionId = item.section_id

      // Same section and position - no action needed
      if (fromSectionId === targetSectionId && item.display_order === targetPosition) {
        console.log('[useDepartmentDragDrop] No change, same position')
        return
      }

      console.log('[useDepartmentDragDrop] Move details:', {
        from: fromSectionId,
        to: targetSectionId,
        position: targetPosition,
        departmentName: item.custom_name || item.defaultName
      })

      // Store undo action
      const undoAction: DepartmentMoveAction = {
        id: `${Date.now()}-${departmentId}`,
        timestamp: Date.now(),
        department_id: departmentId,
        department_name: item.custom_name || item.defaultName,
        from_section_id: fromSectionId,
        from_position: item.display_order,
        to_section_id: targetSectionId,
        to_position: targetPosition,
        previous_state: [...assignments]
      }

      // Optimistic UI update - handle both existing and new assignments
      const existingAssignment = assignments.find(a => a.department_id === departmentId)

      let optimisticUpdate: DepartmentSectionAssignment[]

      if (existingAssignment) {
        // Update existing assignment
        console.log('[useDepartmentDragDrop] Updating existing assignment')
        optimisticUpdate = assignments.map(a =>
          a.department_id === departmentId
            ? { ...a, section_id: targetSectionId, display_order: targetPosition, updated_at: new Date().toISOString() }
            : a
        )
      } else {
        // Create new assignment from dndItem (table is empty or department not yet saved)
        console.log('[useDepartmentDragDrop] Creating new assignment (table was empty)')
        const newAssignment: DepartmentSectionAssignment = {
          id: `temp-${Date.now()}`,
          organization_id: organizationId,
          vertical_id: verticalId,
          department_id: departmentId,
          department_key: departmentId,
          section_id: targetSectionId,
          display_order: targetPosition,
          is_visible: true,
          custom_name: item.custom_name || null,
          custom_description: item.custom_description || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: null,
          updated_by: null
        }
        optimisticUpdate = [...assignments, newAssignment]
      }

      console.log('[useDepartmentDragDrop] Optimistic update created, new count:', optimisticUpdate.length)
      setAssignments(optimisticUpdate)
      previousStateRef.current = [...assignments]

      try {
        setSaving(true)

        let result: any

        if (fromSectionId === targetSectionId) {
          // Reorder within same section
          console.log('[useDepartmentDragDrop] Calling reorderWithinSection')
          result = await reorderWithinSection({
            organizationId,
            verticalId,
            sectionId: targetSectionId,
            departmentId,
            oldIndex: item.display_order,
            newIndex: targetPosition
          })
          console.log('[useDepartmentDragDrop] Reorder result:', result)
        } else {
          // Move to different section
          console.log('[useDepartmentDragDrop] Calling moveDepartmentToSection')
          result = await moveDepartmentToSection({
            organizationId,
            verticalId,
            departmentId,
            fromSectionId,
            toSectionId: targetSectionId,
            targetPosition
          })
          console.log('[useDepartmentDragDrop] Move result:', result)
        }

        // Validate that the operation actually affected rows
        const affectedRows = result?.affected_rows || 0
        console.log('[useDepartmentDragDrop] Database affected rows:', affectedRows)

        if (affectedRows === 0) {
          console.error('[useDepartmentDragDrop] CRITICAL: 0 rows affected - database write failed!')

          // Rollback optimistic update
          setAssignments(previousStateRef.current)

          const errorMsg = 'Failed to save department move. The database did not update any rows. You may need master_admin role.'
          setError(errorMsg)
          onError?.(errorMsg)
          return // Don't continue to success
        }

        console.log('[useDepartmentDragDrop] ✓ Database write successful')

        // Add to undo stack
        setUndoStack(prev => {
          const newStack = [
            { action: undoAction, expiresAt: Date.now() + UNDO_TIMEOUT_MS },
            ...prev.slice(0, MAX_UNDO_STACK - 1)
          ]
          return newStack
        })

        // Small delay before reload to ensure database propagation
        console.log('[useDepartmentDragDrop] Waiting 100ms before reload')
        await new Promise(resolve => setTimeout(resolve, 100))

        // Reload to get accurate state
        console.log('[useDepartmentDragDrop] Reloading assignments from database')
        await loadAssignments()

        // Verify the reload actually got data
        console.log('[useDepartmentDragDrop] Assignments after reload:', assignments.length)

        // Broadcast change to other components (sidebar, dashboard)
        console.log('[useDepartmentDragDrop] Broadcasting department structure change')
        window.dispatchEvent(new CustomEvent('departmentStructureChanged', {
          detail: { departmentId, sectionId: targetSectionId, affectedRows }
        }))

        onSuccess?.(
          `Moved ${item.custom_name || item.defaultName} to ${targetSectionId}`
        )
      } catch (err) {
        console.error('[useDepartmentDragDrop] Move error:', err)

        // Rollback optimistic update
        console.log('[useDepartmentDragDrop] Rolling back to previous state')
        setAssignments(previousStateRef.current)

        const errorMsg = err instanceof Error ? err.message : 'Failed to move department'
        setError(errorMsg)
        onError?.(errorMsg)
      } finally {
        setSaving(false)
      }
    },
    [
      dndItems,
      assignments,
      organizationId,
      verticalId,
      loadAssignments,
      onSuccess,
      onError
    ]
  )

  /**
   * Alternative method to move department via dropdown
   */
  const moveToSection = useCallback(
    async (departmentId: string, targetSectionId: SectionId) => {
      const item = dndItems.find(d => d.department_id === departmentId)
      if (!item) return

      // Get max order in target section
      const targetSectionItems = dndItems.filter(
        d => d.section_id === targetSectionId
      )
      const maxOrder = Math.max(...targetSectionItems.map(d => d.display_order), -1)

      await handleDragEnd(departmentId, targetSectionId, maxOrder + 1)
    },
    [dndItems, handleDragEnd]
  )

  /**
   * Undoes the last department move
   */
  const undoLastMove = useCallback(async () => {
    const now = Date.now()

    // Remove expired items
    const validStack = undoStack.filter(item => item.expiresAt > now)

    if (validStack.length === 0) {
      onError?.('No recent moves to undo')
      return
    }

    const lastMove = validStack[0]

    try {
      setSaving(true)

      // Restore the department to its previous position
      await moveDepartmentToSection({
        organizationId,
        verticalId,
        departmentId: lastMove.action.department_id,
        fromSectionId: lastMove.action.to_section_id,
        toSectionId: lastMove.action.from_section_id,
        targetPosition: lastMove.action.from_position
      })

      // Remove from undo stack
      setUndoStack(prev => prev.slice(1))

      await loadAssignments()

      onSuccess?.(`Undid move of ${lastMove.action.department_name}`)
    } catch (err) {
      console.error('[useDepartmentDragDrop] Undo error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to undo'
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setSaving(false)
    }
  }, [undoStack, organizationId, verticalId, loadAssignments, onSuccess, onError])

  /**
   * Resets all assignments to default
   */
  const resetToDefaults = useCallback(async () => {
    if (!window.confirm('Reset all department assignments to default? This cannot be undone.')) {
      return
    }

    try {
      setSaving(true)
      await resetDepartmentAssignments(organizationId, verticalId)
      await loadAssignments()
      onSuccess?.('Reset to default department layout')
    } catch (err) {
      console.error('[useDepartmentDragDrop] Reset error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to reset'
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setSaving(false)
    }
  }, [organizationId, verticalId, loadAssignments, onSuccess, onError])

  /**
   * Saves visibility toggle
   */
  const toggleVisibility = useCallback(
    async (departmentId: string) => {
      const item = dndItems.find(d => d.department_id === departmentId)
      if (!item) return

      try {
        await saveDepartmentAssignment({
          organizationId,
          verticalId,
          departmentId: item.department_id,
          departmentKey: item.department_key,
          sectionId: item.section_id,
          displayOrder: item.display_order,
          isVisible: !item.is_visible,
          customName: item.custom_name || undefined,
          customDescription: item.custom_description || undefined
        })

        await loadAssignments()
      } catch (err) {
        console.error('[useDepartmentDragDrop] Toggle visibility error:', err)
        onError?.(err instanceof Error ? err.message : 'Failed to toggle visibility')
      }
    },
    [dndItems, organizationId, verticalId, loadAssignments, onError]
  )

  // Load assignments on mount or when org/vertical changes
  useEffect(() => {
    if (!organizationId || !verticalId) return
    loadAssignments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, verticalId])

  // Clean up expired undo items
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setUndoStack(prev => prev.filter(item => item.expiresAt > now))
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  return {
    // State
    assignments,
    sections,
    dndItems,
    activeId,
    overId,
    undoStack,
    loading,
    saving,
    error,
    useFallbackMode,
    migrationWarning,

    // Actions
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    moveToSection,
    undoLastMove,
    resetToDefaults,
    toggleVisibility,
    reloadAssignments: loadAssignments,
    retryAfterMigration
  }
}
