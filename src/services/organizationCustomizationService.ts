import { supabase } from '../lib/supabase'
import {
  OrganizationCustomization,
  CustomizationHistory,
  SaveCustomizationParams,
  MarkMilestoneParams,
  RetentionSummary,
  CustomizationDiffData,
  CopyCustomizationParams
} from '../types/organizationCustomization'
import { VerticalId } from '../config/types'

export type { CopyCustomizationParams }

export const getCustomizationForVertical = async (
  organizationId: string,
  verticalId: VerticalId
): Promise<OrganizationCustomization | null> => {
  try {
    const { data, error } = await supabase
      .from('organization_ui_customizations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('vertical_id', verticalId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('Error fetching customization:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in getCustomizationForVertical:', error)
    return null
  }
}

export const saveCustomization = async (
  params: SaveCustomizationParams
): Promise<OrganizationCustomization> => {
  const { organizationId, verticalId, customization, changeDescription, changeNote } = params

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const existingCustomization = await getCustomizationForVertical(organizationId, verticalId)

    let savedCustomization: OrganizationCustomization

    if (existingCustomization) {
      const newVersion = existingCustomization.version + 1

      const { data, error } = await supabase
        .from('organization_ui_customizations')
        .update({
          ...customization,
          version: newVersion,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCustomization.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating customization:', error)
        throw error
      }

      savedCustomization = data

      await createHistoryEntry({
        customizationId: existingCustomization.id,
        organizationId,
        verticalId,
        configSnapshot: data,
        changedBy: user.id,
        changeDescription: changeDescription || 'Updated customization',
        changeNote,
        versionNumber: newVersion
      })
    } else {
      const { data, error } = await supabase
        .from('organization_ui_customizations')
        .insert({
          organization_id: organizationId,
          vertical_id: verticalId,
          dashboard_config: customization.dashboard_config || {},
          navigation_config: customization.navigation_config || {},
          branding_config: customization.branding_config || {},
          stats_config: customization.stats_config || {},
          department_config: customization.department_config || {},
          logo_url: customization.logo_url,
          logo_format: customization.logo_format,
          logo_file_size: customization.logo_file_size,
          logo_uploaded_at: customization.logo_uploaded_at,
          version: 1,
          is_active: true,
          created_by: user.id,
          updated_by: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating customization:', error)
        throw error
      }

      savedCustomization = data

      await createHistoryEntry({
        customizationId: data.id,
        organizationId,
        verticalId,
        configSnapshot: data,
        changedBy: user.id,
        changeDescription: changeDescription || 'Created initial customization',
        changeNote,
        versionNumber: 1
      })
    }

    return savedCustomization
  } catch (error) {
    console.error('Error in saveCustomization:', error)
    throw error
  }
}

export const createHistoryEntry = async (params: {
  customizationId: string
  organizationId: string
  verticalId: VerticalId
  configSnapshot: any
  changedBy: string
  changeDescription?: string
  changeNote?: string
  versionNumber: number
}): Promise<void> => {
  try {
    const { error } = await supabase
      .from('organization_customization_history')
      .insert({
        customization_id: params.customizationId,
        organization_id: params.organizationId,
        vertical_id: params.verticalId,
        config_snapshot: params.configSnapshot,
        changed_by: params.changedBy,
        change_description: params.changeDescription,
        change_note: params.changeNote,
        version_number: params.versionNumber,
        is_milestone: false
      })

    if (error) {
      console.error('Error creating history entry:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in createHistoryEntry:', error)
    throw error
  }
}

export const getCustomizationHistory = async (
  organizationId: string,
  verticalId: VerticalId,
  options?: {
    limit?: number
    offset?: number
    milestonesOnly?: boolean
  }
): Promise<CustomizationHistory[]> => {
  try {
    let query = supabase
      .from('organization_customization_history')
      .select(`
        *,
        changed_by_profile:changed_by(id, email, full_name)
      `)
      .eq('organization_id', organizationId)
      .eq('vertical_id', verticalId)
      .order('created_at', { ascending: false })

    if (options?.milestonesOnly) {
      query = query.eq('is_milestone', true)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching history:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getCustomizationHistory:', error)
    return []
  }
}

export const markAsMilestone = async (params: MarkMilestoneParams): Promise<void> => {
  try {
    const { error } = await supabase
      .from('organization_customization_history')
      .update({
        is_milestone: true,
        milestone_name: params.milestoneName,
        change_note: params.notes
      })
      .eq('id', params.historyId)

    if (error) {
      console.error('Error marking as milestone:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in markAsMilestone:', error)
    throw error
  }
}

export const rollbackToVersion = async (
  historyId: string,
  organizationId: string,
  verticalId: VerticalId
): Promise<OrganizationCustomization> => {
  try {
    const { data: historyEntry, error: historyError } = await supabase
      .from('organization_customization_history')
      .select('config_snapshot')
      .eq('id', historyId)
      .single()

    if (historyError || !historyEntry) {
      throw new Error('History entry not found')
    }

    const snapshot = historyEntry.config_snapshot

    return await saveCustomization({
      organizationId,
      verticalId,
      customization: {
        dashboard_config: snapshot.dashboard_config,
        navigation_config: snapshot.navigation_config,
        branding_config: snapshot.branding_config,
        stats_config: snapshot.stats_config,
        department_config: snapshot.department_config,
        logo_url: snapshot.logo_url,
        logo_format: snapshot.logo_format,
        logo_file_size: snapshot.logo_file_size,
        logo_uploaded_at: snapshot.logo_uploaded_at
      },
      changeDescription: `Rolled back to version ${snapshot.version}`,
      changeNote: `Restored configuration from history entry ${historyId}`
    })
  } catch (error) {
    console.error('Error in rollbackToVersion:', error)
    throw error
  }
}

export const copyFromVertical = async (params: CopyCustomizationParams): Promise<OrganizationCustomization> => {
  try {
    const sourceCustomization = await getCustomizationForVertical(
      params.organizationId,
      params.sourceVerticalId
    )

    if (!sourceCustomization) {
      throw new Error(`No customization found for ${params.sourceVerticalId}`)
    }

    const targetCustomization: Partial<OrganizationCustomization> = {}

    if (params.includeOptions.dashboard) {
      targetCustomization.dashboard_config = sourceCustomization.dashboard_config
    }

    if (params.includeOptions.navigation) {
      targetCustomization.navigation_config = sourceCustomization.navigation_config
    }

    if (params.includeOptions.branding) {
      targetCustomization.branding_config = sourceCustomization.branding_config
      targetCustomization.logo_url = sourceCustomization.logo_url
      targetCustomization.logo_format = sourceCustomization.logo_format
      targetCustomization.logo_file_size = sourceCustomization.logo_file_size
      targetCustomization.logo_uploaded_at = sourceCustomization.logo_uploaded_at
    }

    if (params.includeOptions.stats) {
      targetCustomization.stats_config = sourceCustomization.stats_config
    }

    if (params.includeOptions.departments) {
      targetCustomization.department_config = sourceCustomization.department_config
    }

    return await saveCustomization({
      organizationId: params.organizationId,
      verticalId: params.targetVerticalId,
      customization: targetCustomization,
      changeDescription: `Copied settings from ${params.sourceVerticalId}`,
      changeNote: `Copied: ${Object.entries(params.includeOptions)
        .filter(([_, include]) => include)
        .map(([key]) => key)
        .join(', ')}`
    })
  } catch (error) {
    console.error('Error in copyFromVertical:', error)
    throw error
  }
}

export const getRetentionSummary = async (
  organizationId: string,
  verticalId?: VerticalId
): Promise<RetentionSummary[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_customization_retention_summary', {
        p_organization_id: organizationId,
        p_vertical_id: verticalId || null
      })

    if (error) {
      console.error('Error fetching retention summary:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getRetentionSummary:', error)
    return []
  }
}

export const manualCleanup = async (
  organizationId: string,
  verticalId?: VerticalId
): Promise<{ deleted_count: number; vertical_id: string }[]> => {
  try {
    const { data, error } = await supabase
      .rpc('cleanup_customization_history_manual', {
        p_organization_id: organizationId,
        p_vertical_id: verticalId || null
      })

    if (error) {
      console.error('Error performing manual cleanup:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in manualCleanup:', error)
    throw error
  }
}

export const compareVersions = (
  version1: OrganizationCustomization,
  version2: OrganizationCustomization
): CustomizationDiffData[] => {
  const diffs: CustomizationDiffData[] = []

  const compareObjects = (
    obj1: any,
    obj2: any,
    category: CustomizationDiffData['category'],
    prefix: string = ''
  ) => {
    const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})])

    allKeys.forEach(key => {
      const val1 = obj1?.[key]
      const val2 = obj2?.[key]
      const fieldName = prefix ? `${prefix}.${key}` : key

      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        diffs.push({
          field: fieldName,
          oldValue: val1,
          newValue: val2,
          category
        })
      }
    })
  }

  compareObjects(version1.dashboard_config, version2.dashboard_config, 'dashboard', 'dashboard')
  compareObjects(version1.navigation_config, version2.navigation_config, 'navigation', 'navigation')
  compareObjects(version1.branding_config, version2.branding_config, 'branding', 'branding')
  compareObjects(version1.stats_config, version2.stats_config, 'stats', 'stats')
  compareObjects(version1.department_config, version2.department_config, 'departments', 'departments')

  return diffs
}

export const exportCustomization = async (
  organizationId: string,
  verticalId: VerticalId
): Promise<string> => {
  const customization = await getCustomizationForVertical(organizationId, verticalId)
  if (!customization) {
    throw new Error('No customization found to export')
  }

  return JSON.stringify(customization, null, 2)
}

export const importCustomization = async (
  organizationId: string,
  verticalId: VerticalId,
  jsonData: string
): Promise<OrganizationCustomization> => {
  try {
    const importedData = JSON.parse(jsonData) as Partial<OrganizationCustomization>

    return await saveCustomization({
      organizationId,
      verticalId,
      customization: {
        dashboard_config: importedData.dashboard_config,
        navigation_config: importedData.navigation_config,
        branding_config: importedData.branding_config,
        stats_config: importedData.stats_config,
        department_config: importedData.department_config
      },
      changeDescription: 'Imported customization from JSON',
      changeNote: 'Configuration imported from external file'
    })
  } catch (error) {
    console.error('Error in importCustomization:', error)
    throw new Error('Invalid JSON data')
  }
}

export const applyCustomizationToVerticalConfig = <T extends Record<string, any>>(
  baseConfig: T,
  customization: Record<string, any> | null | undefined
): T => {
  if (!customization || Object.keys(customization).length === 0) {
    return baseConfig
  }

  const merged = { ...baseConfig }

  Object.keys(customization).forEach(key => {
    const customValue = customization[key]

    if (customValue !== null && customValue !== undefined && customValue !== '') {
      if (typeof customValue === 'object' && !Array.isArray(customValue) && customValue !== null) {
        merged[key as keyof T] = {
          ...(merged[key as keyof T] as any),
          ...customValue
        } as T[keyof T]
      } else {
        merged[key as keyof T] = customValue as T[keyof T]
      }
    }
  })

  return merged
}
