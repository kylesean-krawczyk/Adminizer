import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { VerticalId } from '../config/types'
import { isDemoMode } from '../lib/demo'

export interface VerticalSwitcherState {
  loading: boolean
  error: string | null
  success: boolean
}

export interface UseVerticalSwitcherReturn {
  switchVertical: (verticalId: VerticalId) => Promise<void>
  getEnabledVerticals: () => Promise<VerticalId[]>
  isVerticalEnabled: (verticalId: VerticalId, enabledList: VerticalId[]) => boolean
  state: VerticalSwitcherState
}

export function useVerticalSwitcher(): UseVerticalSwitcherReturn {
  const [state, setState] = useState<VerticalSwitcherState>({
    loading: false,
    error: null,
    success: false
  })

  const getEnabledVerticals = useCallback(async (): Promise<VerticalId[]> => {
    if (isDemoMode) {
      return ['church', 'business', 'estate']
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.organization_id) {
        return ['church', 'business', 'estate']
      }

      const { data: org } = await supabase
        .from('organizations')
        .select('enabled_verticals')
        .eq('id', profile.organization_id)
        .maybeSingle()

      return (org?.enabled_verticals as VerticalId[]) || ['church', 'business', 'estate']
    } catch (error) {
      console.error('Error fetching enabled verticals:', error)
      return ['church', 'business', 'estate']
    }
  }, [])

  const isVerticalEnabled = useCallback(
    (verticalId: VerticalId, enabledList: VerticalId[]): boolean => {
      return enabledList.includes(verticalId)
    },
    []
  )

  const switchVertical = useCallback(async (verticalId: VerticalId): Promise<void> => {
    setState({ loading: true, error: null, success: false })

    try {
      if (isDemoMode) {
        localStorage.setItem('demo_vertical', verticalId)
        setState({ loading: false, error: null, success: true })
        window.location.reload()
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const enabledVerticals = await getEnabledVerticals()
      if (!isVerticalEnabled(verticalId, enabledVerticals)) {
        throw new Error('This vertical is not enabled for your organization')
      }

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ active_vertical: verticalId })
        .eq('id', user.id)

      if (updateError) throw updateError

      setState({ loading: false, error: null, success: true })

      window.location.reload()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch vertical'
      setState({ loading: false, error: errorMessage, success: false })
      throw error
    }
  }, [getEnabledVerticals, isVerticalEnabled])

  return {
    switchVertical,
    getEnabledVerticals,
    isVerticalEnabled,
    state
  }
}
