import { supabase } from '../lib/supabase'
import { isDemoMode } from '../lib/demo'
import { FeatureFlagAuditLog } from '../types/features'

export class FeatureFlagService {
  static async getOrganizationOverrides(organizationId: string): Promise<Record<string, boolean>> {
    try {
      if (isDemoMode) {
        const stored = localStorage.getItem(`feature_overrides_${organizationId}`)
        return stored ? JSON.parse(stored) : {}
      }

      const { data, error } = await supabase
        .from('organizations')
        .select('feature_flags')
        .eq('id', organizationId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching feature overrides:', error)
        return {}
      }

      return (data?.feature_flags as Record<string, boolean>) || {}
    } catch (error) {
      console.error('Error in getOrganizationOverrides:', error)
      return {}
    }
  }

  static async setFeatureOverride(
    organizationId: string,
    featureId: string,
    enabled: boolean,
    userId: string
  ): Promise<boolean> {
    try {
      if (isDemoMode) {
        const stored = localStorage.getItem(`feature_overrides_${organizationId}`)
        const overrides = stored ? JSON.parse(stored) : {}
        overrides[featureId] = enabled
        localStorage.setItem(`feature_overrides_${organizationId}`, JSON.stringify(overrides))
        return true
      }

      const currentOverrides = await this.getOrganizationOverrides(organizationId)
      const oldValue = currentOverrides[featureId]

      const updatedOverrides = {
        ...currentOverrides,
        [featureId]: enabled
      }

      const { error } = await supabase
        .from('organizations')
        .update({ feature_flags: updatedOverrides })
        .eq('id', organizationId)

      if (error) {
        console.error('Error setting feature override:', error)
        return false
      }

      await this.logFeatureChange(
        organizationId,
        featureId,
        oldValue !== undefined ? (enabled ? 'enabled' : 'disabled') : 'override_added',
        userId,
        oldValue ?? false,
        enabled
      )

      return true
    } catch (error) {
      console.error('Error in setFeatureOverride:', error)
      return false
    }
  }

  static async removeFeatureOverride(
    organizationId: string,
    featureId: string,
    userId: string
  ): Promise<boolean> {
    try {
      if (isDemoMode) {
        const stored = localStorage.getItem(`feature_overrides_${organizationId}`)
        const overrides = stored ? JSON.parse(stored) : {}
        delete overrides[featureId]
        localStorage.setItem(`feature_overrides_${organizationId}`, JSON.stringify(overrides))
        return true
      }

      const currentOverrides = await this.getOrganizationOverrides(organizationId)

      const updatedOverrides = { ...currentOverrides }
      delete updatedOverrides[featureId]

      const { error } = await supabase
        .from('organizations')
        .update({ feature_flags: updatedOverrides })
        .eq('id', organizationId)

      if (error) {
        console.error('Error removing feature override:', error)
        return false
      }

      await this.logFeatureChange(
        organizationId,
        featureId,
        'override_removed',
        userId,
        currentOverrides[featureId] ?? false,
        false
      )

      return true
    } catch (error) {
      console.error('Error in removeFeatureOverride:', error)
      return false
    }
  }

  private static async logFeatureChange(
    organizationId: string,
    featureId: string,
    action: 'enabled' | 'disabled' | 'override_added' | 'override_removed',
    userId: string,
    oldValue: boolean,
    newValue: boolean
  ): Promise<void> {
    try {
      if (isDemoMode) {
        return
      }

      await supabase
        .from('feature_flag_audit_log')
        .insert({
          organization_id: organizationId,
          feature_id: featureId,
          action,
          changed_by: userId,
          old_value: oldValue,
          new_value: newValue,
          timestamp: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error logging feature change:', error)
    }
  }

  static async getAuditLog(organizationId: string, limit: number = 50): Promise<FeatureFlagAuditLog[]> {
    try {
      if (isDemoMode) {
        return []
      }

      const { data, error } = await supabase
        .from('feature_flag_audit_log')
        .select('*')
        .eq('organization_id', organizationId)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching audit log:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getAuditLog:', error)
      return []
    }
  }
}
