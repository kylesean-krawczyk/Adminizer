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
  saveDepartmentAssignment
} from '../services/departmentAssignmentService'
import { useVertical } from '../contexts/VerticalContext'

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

  /**
   * Loads department assignments from database
   */
  const loadAssignments = useCallback(async () => {
    if (!organizationId || !verticalId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      setUseFallbackMode(false)
      setMigrationWarning(null)

      const data = await getDepartmentAssignments(organizationId, verticalId)

      console.log('[useDepartmentDragDrop] Loaded assignments:', data.length)
      setAssignments(data)
      previousStateRef.current = [...data]

      // Check if we're in fallback mode (table doesn't exist or schema cache issue)
      if (data.length === 0) {
        // Empty could mean:
        // 1. Table exists but no assignments yet (normal)
        // 2. Table doesn't exist (fallback mode)
        // The service layer handles this gracefully by returning []
        console.log('[useDepartmentDragDrop] No assignments found - will use vertical config defaults')
      }
    } catch (err) {
      console.error('[useDepartmentDragDrop] Load error:', err)

      // Check if it's a table missing error
      const errorMessage = err instanceof Error ? err.message : 'Failed to load assignments'

      if (errorMessage.includes('PGRST205') || errorMessage.includes('schema cache')) {
        console.warn('[useDepartmentDragDrop] Entering fallback mode due to missing table')
        setUseFallbackMode(true)
        setMigrationWarning('Database migration pending. Drag-and-drop is disabled. Using default department layout.')
        setAssignments([])
      } else {
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [organizationId, verticalId, onError])

  /**
   * Merges assignments with vertical config to create enriched DnD items
   */
  useEffect(() => {
    if (!vertical) return

    // Get all departments from vertical config
    const allDepartments = [
      ...vertical.dashboardConfig.coreDepartments,
      ...vertical.dashboardConfig.additionalDepartments
    ]

    // Merge with assignments
    const enriched: DndDepartmentItem[] = allDepartments.map(dept => {
      const assignment = assignments.find(a => a.department_id === dept.id)

      if (assignment) {
        // Has custom assignment
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
        // Use default from config (determine section from navigation)
        const isInOpsNav = vertical.navigation.operationsNav?.some(d => d.id === dept.id)
        const isInAdminNav = vertical.navigation.adminNav?.some(d => d.id === dept.id)

        let defaultSectionId: SectionId = 'departments'
        if (isInOpsNav) defaultSectionId = 'operations'
        else if (isInAdminNav) defaultSectionId = 'admin'
        else if (dept.id === 'documents') defaultSectionId = 'documents'

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
   * Handles drag end event
   */
  const handleDragEnd = useCallback(
    async (departmentId: string, targetSectionId: SectionId, targetPosition: number) => {
      console.log('[useDepartmentDragDrop] Drag end:', {
        departmentId,
        targetSectionId,
        targetPosition
      })

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

      // Optimistic UI update
      const optimisticUpdate = assignments.map(a =>
        a.department_id === departmentId
          ? { ...a, section_id: targetSectionId, display_order: targetPosition }
          : a
      )
      setAssignments(optimisticUpdate)

      try {
        setSaving(true)

        if (fromSectionId === targetSectionId) {
          // Reorder within same section
          await reorderWithinSection({
            organizationId,
            verticalId,
            sectionId: targetSectionId,
            departmentId,
            oldIndex: item.display_order,
            newIndex: targetPosition
          })
        } else {
          // Move to different section
          await moveDepartmentToSection({
            organizationId,
            verticalId,
            departmentId,
            fromSectionId,
            toSectionId: targetSectionId,
            targetPosition
          })
        }

        // Add to undo stack
        setUndoStack(prev => {
          const newStack = [
            { action: undoAction, expiresAt: Date.now() + UNDO_TIMEOUT_MS },
            ...prev.slice(0, MAX_UNDO_STACK - 1)
          ]
          return newStack
        })

        // Reload to get accurate state
        await loadAssignments()

        onSuccess?.(
          `Moved ${item.custom_name || item.defaultName} to ${targetSectionId}`
        )
      } catch (err) {
        console.error('[useDepartmentDragDrop] Move error:', err)

        // Rollback optimistic update
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

  // Load assignments on mount
  useEffect(() => {
    loadAssignments()
  }, [loadAssignments])

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
    reloadAssignments: loadAssignments
  }
}
