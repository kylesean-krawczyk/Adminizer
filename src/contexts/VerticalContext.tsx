import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { VerticalConfig, VerticalId, getVerticalConfig, initializeVerticalConfigs } from '../config'
import { supabase } from '../lib/supabase'
import { isDemoMode } from '../lib/demo'
import { getCustomizationForVertical, applyCustomizationToVerticalConfig } from '../services/organizationCustomizationService'

interface VerticalContextType {
  vertical: VerticalConfig
  verticalId: VerticalId
  loading: boolean
  error: string | null
  getTerm: (key: string, fallback?: string) => string
  hasFeature: (featureId: string) => boolean
  refreshVertical: () => Promise<void>
  customizationLoaded: boolean
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
  const [customizationLoaded, setCustomizationLoaded] = useState(false)

  const applyCustomizations = async (
    baseConfig: VerticalConfig,
    organizationId: string | null,
    verticalIdToLoad: VerticalId
  ): Promise<VerticalConfig> => {
    if (!organizationId) {
      return baseConfig
    }

    try {
      const customization = await getCustomizationForVertical(organizationId, verticalIdToLoad)

      if (!customization) {
        console.log(`[VerticalContext] No customization found for ${verticalIdToLoad}, using defaults`)
        return baseConfig
      }

      console.log(`[VerticalContext] Applying customizations for ${verticalIdToLoad}:`, {
        dashboard_config: customization.dashboard_config,
        stats_config: customization.stats_config,
        department_config: customization.department_config,
        branding_config: customization.branding_config
      })

      const customizedConfig = { ...baseConfig }

      if (customization.dashboard_config && Object.keys(customization.dashboard_config).length > 0) {
        customizedConfig.dashboardConfig = applyCustomizationToVerticalConfig(
          baseConfig.dashboardConfig,
          customization.dashboard_config
        )
        console.log(`[VerticalContext] Dashboard config after customization:`, customizedConfig.dashboardConfig)
      }

      if (customization.branding_config && Object.keys(customization.branding_config).length > 0) {
        customizedConfig.branding = applyCustomizationToVerticalConfig(
          baseConfig.branding,
          customization.branding_config
        )
      }

      if (customization.stats_config?.cards && customization.stats_config.cards.length > 0) {
        console.log(`[VerticalContext] Applying stats customizations:`, customization.stats_config.cards)

        customizedConfig.dashboardConfig = {
          ...customizedConfig.dashboardConfig,
          stats: customizedConfig.dashboardConfig.stats.map(stat => {
            const customCard = customization.stats_config.cards?.find(c => c.id === stat.id)
            if (customCard) {
              return {
                ...stat,
                ...(customCard.label ? { label: customCard.label } : {})
              }
            }
            return stat
          }).filter(stat => {
            const customCard = customization.stats_config.cards?.find(c => c.id === stat.id)
            // Keep stat card if:
            // - No customization exists for this stat (default visible)
            // - Customization exists but visible is not explicitly false
            const shouldShow = !customCard || customCard.visible !== false
            if (!shouldShow) {
              console.log(`[VerticalContext] Hiding stat card: ${stat.id}`)
            }
            return shouldShow
          })
        }
        console.log(`[VerticalContext] Stats after customization:`, customizedConfig.dashboardConfig.stats)
      }

      if (customization.department_config?.departments && customization.department_config.departments.length > 0) {
        console.log(`[VerticalContext] Applying department customizations:`, customization.department_config.departments)

        customizedConfig.dashboardConfig = {
          ...customizedConfig.dashboardConfig,
          coreDepartments: customizedConfig.dashboardConfig.coreDepartments.map(dept => {
            const customDept = customization.department_config.departments?.find(d => d.id === dept.id)
            if (customDept) {
              console.log(`[VerticalContext] Customizing core department ${dept.id}:`, {
                originalName: dept.name,
                customName: customDept.name || dept.name,
                originalDesc: dept.description,
                customDesc: customDept.description || dept.description
              })
              return {
                ...dept,
                ...(customDept.name ? { name: customDept.name } : {}),
                ...(customDept.description ? { description: customDept.description } : {})
              }
            }
            return dept
          }).filter(dept => {
            const customDept = customization.department_config.departments?.find(d => d.id === dept.id)
            // Keep department if:
            // - No customization exists for this department (default visible)
            // - Customization exists but visible is not explicitly false
            const shouldShow = !customDept || customDept.visible !== false
            if (!shouldShow) {
              console.log(`[VerticalContext] Hiding core department: ${dept.id} (${dept.name})`)
            }
            return shouldShow
          }),
          additionalDepartments: customizedConfig.dashboardConfig.additionalDepartments.map(dept => {
            const customDept = customization.department_config.departments?.find(d => d.id === dept.id)
            if (customDept) {
              console.log(`[VerticalContext] Customizing additional department ${dept.id}:`, {
                originalName: dept.name,
                customName: customDept.name || dept.name,
                originalDesc: dept.description,
                customDesc: customDept.description || dept.description
              })
              return {
                ...dept,
                ...(customDept.name ? { name: customDept.name } : {}),
                ...(customDept.description ? { description: customDept.description } : {})
              }
            }
            return dept
          }).filter(dept => {
            const customDept = customization.department_config.departments?.find(d => d.id === dept.id)
            // Keep department if:
            // - No customization exists for this department (default visible)
            // - Customization exists but visible is not explicitly false
            const shouldShow = !customDept || customDept.visible !== false
            if (!shouldShow) {
              console.log(`[VerticalContext] Hiding additional department: ${dept.id} (${dept.name})`)
            }
            return shouldShow
          })
        }
        console.log(`[VerticalContext] Departments after customization:`, {
          core: customizedConfig.dashboardConfig.coreDepartments,
          additional: customizedConfig.dashboardConfig.additionalDepartments
        })
      }

      return customizedConfig
    } catch (err) {
      console.error('[VerticalContext] Error applying customizations:', err)
      return baseConfig
    }
  }

  const loadVerticalFromOrganization = async () => {
    try {
      setLoading(true)
      setError(null)
      setCustomizationLoaded(false)

      if (isDemoMode) {
        const storedVertical = localStorage.getItem('demo_vertical') as VerticalId
        const demoVertical = storedVertical && ['church', 'business', 'estate'].includes(storedVertical)
          ? storedVertical
          : 'church'
        const config = getVerticalConfig(demoVertical)
        setVerticalId(demoVertical)
        setVertical(config)
        setCustomizationLoaded(true)
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        const defaultVertical = (import.meta.env.VITE_DEFAULT_VERTICAL as VerticalId) || 'church'
        const config = getVerticalConfig(defaultVertical)
        setVerticalId(defaultVertical)
        setVertical(config)
        setCustomizationLoaded(true)
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
        setCustomizationLoaded(true)
        setLoading(false)
        return
      }

      if (!userProfile) {
        const defaultVertical = (import.meta.env.VITE_DEFAULT_VERTICAL as VerticalId) || 'church'
        const config = getVerticalConfig(defaultVertical)
        setVerticalId(defaultVertical)
        setVertical(config)
        setCustomizationLoaded(true)
        setLoading(false)
        return
      }

      let userVertical = (userProfile.active_vertical as VerticalId) || 'church'
      let organizationId: string | null = userProfile.organization_id

      if (userProfile.organization_id) {
        try {
          const { data: organization, error: orgError } = await supabase
            .from('organizations')
            .select('enabled_verticals, vertical')
            .eq('id', userProfile.organization_id)
            .maybeSingle()

          if (orgError) {
            console.warn('Could not load organization settings:', {
              code: orgError.code,
              message: orgError.message,
              orgId: userProfile.organization_id
            })
          } else if (organization?.enabled_verticals && Array.isArray(organization.enabled_verticals)) {
            const enabledVerticals = organization.enabled_verticals as VerticalId[]
            if (enabledVerticals.length > 0 && !enabledVerticals.includes(userVertical)) {
              userVertical = enabledVerticals[0] || 'church'

              const { error: updateError } = await supabase
                .from('user_profiles')
                .update({ active_vertical: userVertical })
                .eq('id', user.id)

              if (updateError) {
                console.warn('Could not update user vertical preference:', {
                  code: updateError.code,
                  message: updateError.message
                })
              }
            }
          }
        } catch (orgErr) {
          console.warn('Unexpected error loading organization:', {
            error: orgErr instanceof Error ? orgErr.message : 'Unknown error',
            orgId: userProfile.organization_id
          })
        }
      }

      const baseConfig = getVerticalConfig(userVertical)
      const customizedConfig = await applyCustomizations(baseConfig, organizationId, userVertical)

      setVerticalId(userVertical)
      setVertical(customizedConfig)
      setCustomizationLoaded(true)
      setLoading(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error loading vertical configuration:', errorMessage, err)
      setError(`Failed to load configuration: ${errorMessage}`)
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
    refreshVertical,
    customizationLoaded
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
