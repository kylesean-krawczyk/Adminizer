import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { VerticalConfig, VerticalId, getVerticalConfig, initializeVerticalConfigs } from '../config'
import { supabase } from '../lib/supabase'
import { isDemoMode } from '../lib/demo'

interface VerticalContextType {
  vertical: VerticalConfig
  verticalId: VerticalId
  loading: boolean
  error: string | null
  getTerm: (key: string, fallback?: string) => string
  hasFeature: (featureId: string) => boolean
  refreshVertical: () => Promise<void>
}

const VerticalContext = createContext<VerticalContextType | undefined>(undefined)

interface VerticalProviderProps {
  children: ReactNode
}

export const VerticalProvider: React.FC<VerticalProviderProps> = ({ children }) => {
  const [verticalId, setVerticalId] = useState<VerticalId>('church')
  const [vertical, setVertical] = useState<VerticalConfig>(getVerticalConfig('church'))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadVerticalFromOrganization = async () => {
    try {
      setLoading(true)
      setError(null)

      if (isDemoMode) {
        const storedVertical = localStorage.getItem('demo_vertical') as VerticalId
        const demoVertical = storedVertical && ['church', 'business', 'estate'].includes(storedVertical)
          ? storedVertical
          : 'church'
        const config = getVerticalConfig(demoVertical)
        setVerticalId(demoVertical)
        setVertical(config)
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        const defaultVertical = (import.meta.env.VITE_DEFAULT_VERTICAL as VerticalId) || 'church'
        const config = getVerticalConfig(defaultVertical)
        setVerticalId(defaultVertical)
        setVertical(config)
        setLoading(false)
        return
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('active_vertical, organization_id')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        const defaultVertical = (import.meta.env.VITE_DEFAULT_VERTICAL as VerticalId) || 'church'
        const config = getVerticalConfig(defaultVertical)
        setVerticalId(defaultVertical)
        setVertical(config)
        setLoading(false)
        return
      }

      if (!userProfile) {
        const defaultVertical = (import.meta.env.VITE_DEFAULT_VERTICAL as VerticalId) || 'church'
        const config = getVerticalConfig(defaultVertical)
        setVerticalId(defaultVertical)
        setVertical(config)
        setLoading(false)
        return
      }

      let userVertical = (userProfile.active_vertical as VerticalId) || 'church'

      if (userProfile.organization_id) {
        const { data: organization } = await supabase
          .from('organizations')
          .select('enabled_verticals, vertical')
          .eq('id', userProfile.organization_id)
          .maybeSingle()

        if (organization?.enabled_verticals) {
          const enabledVerticals = organization.enabled_verticals as VerticalId[]
          if (!enabledVerticals.includes(userVertical)) {
            userVertical = enabledVerticals[0] || 'church'

            await supabase
              .from('user_profiles')
              .update({ active_vertical: userVertical })
              .eq('id', user.id)
          }
        }
      }

      const config = getVerticalConfig(userVertical)
      setVerticalId(userVertical)
      setVertical(config)
      setLoading(false)
    } catch (err) {
      console.error('Error loading vertical configuration:', err)
      setError('Failed to load configuration')
      const fallbackConfig = getVerticalConfig('church')
      setVerticalId('church')
      setVertical(fallbackConfig)
      setLoading(false)
    }
  }

  useEffect(() => {
    const isValid = initializeVerticalConfigs()
    if (!isValid) {
      setError('Configuration validation failed')
    }
    loadVerticalFromOrganization()
  }, [])

  const getTerm = (key: string, fallback?: string): string => {
    const term = vertical.terminology[key]
    return term || fallback || key
  }

  const hasFeature = (featureId: string): boolean => {
    return vertical.features.some(feature => feature.id === featureId && feature.enabled)
  }

  const refreshVertical = async () => {
    await loadVerticalFromOrganization()
  }

  const value: VerticalContextType = {
    vertical,
    verticalId,
    loading,
    error,
    getTerm,
    hasFeature,
    refreshVertical
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <VerticalContext.Provider value={value}>
      {children}
    </VerticalContext.Provider>
  )
}

export const useVertical = (): VerticalContextType => {
  const context = useContext(VerticalContext)
  if (!context) {
    throw new Error('useVertical must be used within a VerticalProvider')
  }
  return context
}

export const useTerminology = (key: string, fallback?: string): string => {
  const { getTerm } = useVertical()
  return getTerm(key, fallback)
}

export const useVerticalConfig = () => {
  const { vertical } = useVertical()
  return vertical
}

export const useVerticalFeature = (featureId: string): boolean => {
  const { hasFeature } = useVertical()
  return hasFeature(featureId)
}
