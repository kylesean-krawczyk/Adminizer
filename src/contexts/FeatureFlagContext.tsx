import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useVertical } from './VerticalContext'
import { useUserManagement } from '../hooks'
import { FeatureFlag, FeatureAvailability } from '../types/features'
import { getFeature, getFeaturesByVertical } from '../config/features'
import { FeatureFlagService } from '../services/featureFlagService'
import { isDemoMode } from '../lib/demo'

interface FeatureFlagContextType {
  hasFeature: (featureId: string) => boolean
  getFeatureAvailability: (featureId: string) => FeatureAvailability
  getAvailableFeatures: () => FeatureFlag[]
  refreshFeatures: () => Promise<void>
  loading: boolean
  overrides: Record<string, boolean>
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined)

interface FeatureFlagProviderProps {
  children: ReactNode
}

export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({ children }) => {
  const { verticalId, vertical } = useVertical()
  const { userProfile } = useUserManagement()
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  const loadOverrides = async () => {
    try {
      setLoading(true)

      if (isDemoMode) {
        const stored = localStorage.getItem('demo_feature_overrides')
        const demoOverrides = stored ? JSON.parse(stored) : {}
        setOverrides(demoOverrides)
        setLoading(false)
        return
      }

      if (!userProfile?.organization_id) {
        setOverrides({})
        setLoading(false)
        return
      }

      const orgOverrides = await FeatureFlagService.getOrganizationOverrides(
        userProfile.organization_id
      )
      setOverrides(orgOverrides)
      setLoading(false)
    } catch (error) {
      console.error('Error loading feature overrides:', error)
      setOverrides({})
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOverrides()
  }, [userProfile?.organization_id, verticalId])

  const hasFeature = (featureId: string): boolean => {
    const availability = getFeatureAvailability(featureId)
    return availability.available
  }

  const getFeatureAvailability = (featureId: string): FeatureAvailability => {
    const feature = getFeature(featureId)

    if (!feature) {
      return {
        available: false,
        reason: 'disabled',
        message: 'Feature not found'
      }
    }

    if (overrides[featureId] !== undefined) {
      if (!overrides[featureId]) {
        return {
          available: false,
          reason: 'disabled',
          message: 'Feature is disabled by your organization'
        }
      }
    }

    if (!feature.allowedVerticals.includes(verticalId)) {
      return {
        available: false,
        reason: feature.comingSoon ? 'coming_soon' : 'vertical_restriction',
        message: feature.comingSoon
          ? undefined
          : `${feature.name} is not available for your ${vertical.terminology.organization || 'organization'}`
      }
    }

    if (feature.comingSoon) {
      return {
        available: false,
        reason: 'coming_soon',
        message: undefined
      }
    }

    if (feature.requiredRole) {
      const userRole = userProfile?.role || 'user'

      if (feature.requiredRole === 'master_admin' && userRole !== 'master_admin') {
        return {
          available: false,
          reason: 'role_restriction',
          message: 'This feature requires master admin privileges'
        }
      }

      if (feature.requiredRole === 'admin' && !['admin', 'master_admin'].includes(userRole)) {
        return {
          available: false,
          reason: 'role_restriction',
          message: 'This feature requires admin privileges'
        }
      }
    }

    if (feature.betaAccess && !overrides[featureId]) {
      return {
        available: false,
        reason: 'beta_only',
        message: 'This feature is in beta and requires explicit access'
      }
    }

    if (!feature.enabled && !overrides[featureId]) {
      return {
        available: false,
        reason: 'disabled',
        message: 'This feature is currently disabled'
      }
    }

    return {
      available: true
    }
  }

  const getAvailableFeatures = (): FeatureFlag[] => {
    const verticalFeatures = getFeaturesByVertical(verticalId)
    return verticalFeatures.filter(feature => hasFeature(feature.id))
  }

  const refreshFeatures = async () => {
    await loadOverrides()
  }

  const value: FeatureFlagContextType = {
    hasFeature,
    getFeatureAvailability,
    getAvailableFeatures,
    refreshFeatures,
    loading,
    overrides
  }

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  )
}

export const useFeatureFlags = (): FeatureFlagContextType => {
  const context = useContext(FeatureFlagContext)
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider')
  }
  return context
}

export const useFeature = (featureId: string): boolean => {
  const { hasFeature } = useFeatureFlags()
  return hasFeature(featureId)
}

export const useFeatureAvailability = (featureId: string): FeatureAvailability => {
  const { getFeatureAvailability } = useFeatureFlags()
  return getFeatureAvailability(featureId)
}
