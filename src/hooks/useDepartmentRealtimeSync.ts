import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { VerticalId } from '../config/types'
import { DepartmentAssignmentUpdate } from '../types/departmentAssignments'

interface UseDepartmentRealtimeSyncOptions {
  organizationId: string
  verticalId: VerticalId
  onUpdate: () => void
  enabled?: boolean
}

/**
 * Hook to sync department assignments in real-time across multiple sessions
 */
export const useDepartmentRealtimeSync = (options: UseDepartmentRealtimeSyncOptions) => {
  const { organizationId, verticalId, onUpdate, enabled = true } = options
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Debounced update handler to prevent rapid successive updates
   */
  const debouncedUpdate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      console.log('[useDepartmentRealtimeSync] Triggering debounced update')
      onUpdate()
    }, 500)
  }, [onUpdate])

  useEffect(() => {
    if (!enabled || !organizationId || !verticalId) {
      console.log('[useDepartmentRealtimeSync] Sync disabled or missing params')
      return
    }

    console.log('[useDepartmentRealtimeSync] Setting up real-time subscription:', {
      organizationId,
      verticalId
    })

    // Create a channel for this organization and vertical
    const channel = supabase.channel(`department_assignments:${organizationId}:${verticalId}`)

    // Subscribe to changes on department_section_assignments table
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'department_section_assignments',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          console.log('[useDepartmentRealtimeSync] Received update:', payload)

          // Only process updates for our vertical
          const record = payload.new as any
          if (record && record.vertical_id === verticalId) {
            const update: DepartmentAssignmentUpdate = {
              type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              assignment: record,
              organization_id: organizationId,
              vertical_id: verticalId
            }

            console.log('[useDepartmentRealtimeSync] Processing update:', update.type)
            debouncedUpdate()
          }
        }
      )
      .subscribe((status) => {
        console.log('[useDepartmentRealtimeSync] Subscription status:', status)

        if (status === 'SUBSCRIBED') {
          console.log('[useDepartmentRealtimeSync] Successfully subscribed')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useDepartmentRealtimeSync] Channel error')
        } else if (status === 'TIMED_OUT') {
          console.error('[useDepartmentRealtimeSync] Subscription timed out')
        }
      })

    channelRef.current = channel

    // Cleanup function
    return () => {
      console.log('[useDepartmentRealtimeSync] Cleaning up subscription')

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [organizationId, verticalId, enabled, debouncedUpdate])

  /**
   * Manually broadcasts a change to other sessions
   */
  const broadcastChange = useCallback(
    (action: string, departmentId: string) => {
      if (!channelRef.current) return

      console.log('[useDepartmentRealtimeSync] Broadcasting change:', { action, departmentId })

      channelRef.current.send({
        type: 'broadcast',
        event: 'department_change',
        payload: {
          action,
          department_id: departmentId,
          organization_id: organizationId,
          vertical_id: verticalId,
          timestamp: Date.now()
        }
      })
    },
    [organizationId, verticalId]
  )

  return {
    broadcastChange,
    isConnected: !!channelRef.current
  }
}
