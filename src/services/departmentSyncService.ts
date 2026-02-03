import { supabase } from '../lib/supabase'
import { VerticalId } from '../config/types'

export interface DepartmentBasicSettings {
  customName?: string
  customDescription?: string
  iconName?: string
  emoji?: string
  colorTheme?: string
}

export interface SyncDepartmentParams {
  organizationId: string
  verticalId: VerticalId
  departmentId: string
  settings: DepartmentBasicSettings
}

export const saveDepartmentBasicSettings = async (params: SyncDepartmentParams): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    console.log('[saveDepartmentBasicSettings] 💾 Syncing settings:', {
      organizationId: params.organizationId,
      verticalId: params.verticalId,
      departmentId: params.departmentId
    })

    const { customName, customDescription, iconName, emoji, colorTheme } = params.settings

    const assignmentUpdate: any = {
      updated_by: user.id,
      updated_at: new Date().toISOString()
    }

    if (customName !== undefined) assignmentUpdate.custom_name = customName
    if (customDescription !== undefined) assignmentUpdate.custom_description = customDescription
    if (iconName !== undefined) assignmentUpdate.icon_name = iconName
    if (emoji !== undefined) assignmentUpdate.emoji = emoji
    if (colorTheme !== undefined) assignmentUpdate.color_theme = colorTheme

    const { error: assignmentError } = await supabase
      .from('department_section_assignments')
      .update(assignmentUpdate)
      .eq('organization_id', params.organizationId)
      .eq('vertical_id', params.verticalId)
      .eq('department_id', params.departmentId)

    if (assignmentError) {
      console.error('[saveDepartmentBasicSettings] ❌ Assignment update error:', assignmentError)
      throw assignmentError
    }

    const { data: existingCustomization } = await supabase
      .from('organization_ui_customizations')
      .select('id, department_config')
      .eq('organization_id', params.organizationId)
      .eq('vertical_id', params.verticalId)
      .maybeSingle()

    let departmentConfig = existingCustomization?.department_config || {}

    if (!departmentConfig[params.departmentId]) {
      departmentConfig[params.departmentId] = {}
    }

    if (customName !== undefined) {
      departmentConfig[params.departmentId].name = customName
    }
    if (customDescription !== undefined) {
      departmentConfig[params.departmentId].description = customDescription
    }
    if (iconName !== undefined) {
      departmentConfig[params.departmentId].icon = iconName
    }
    if (emoji !== undefined) {
      departmentConfig[params.departmentId].emoji = emoji
    }
    if (colorTheme !== undefined) {
      departmentConfig[params.departmentId].color = colorTheme
    }

    if (existingCustomization) {
      const { error: uiError } = await supabase
        .from('organization_ui_customizations')
        .update({
          department_config: departmentConfig,
          updated_by: user.id
        })
        .eq('id', existingCustomization.id)

      if (uiError) {
        console.error('[saveDepartmentBasicSettings] ❌ UI customization error:', uiError)
        throw uiError
      }
    } else {
      const { error: uiError } = await supabase
        .from('organization_ui_customizations')
        .insert({
          organization_id: params.organizationId,
          vertical_id: params.verticalId,
          department_config: departmentConfig,
          created_by: user.id,
          updated_by: user.id
        })

      if (uiError) {
        console.error('[saveDepartmentBasicSettings] ❌ UI customization insert error:', uiError)
        throw uiError
      }
    }

    console.log('[saveDepartmentBasicSettings] ✅ Settings synced successfully')
    return true
  } catch (error) {
    console.error('[saveDepartmentBasicSettings] ❌ Exception:', error)
    throw error
  }
}

export const loadDepartmentCustomizationBundle = async (
  organizationId: string,
  verticalId: VerticalId,
  departmentId: string
) => {
  try {
    console.log('[loadDepartmentCustomizationBundle] 📦 Loading bundle:', {
      organizationId,
      verticalId,
      departmentId
    })

    const [assignmentData, statCards, features, tools, integrations, quickActions] = await Promise.all([
      supabase
        .from('department_section_assignments')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('vertical_id', verticalId)
        .eq('department_id', departmentId)
        .maybeSingle(),
      supabase
        .from('department_stat_cards')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('vertical_id', verticalId)
        .eq('department_id', departmentId)
        .order('display_order', { ascending: true }),
      supabase
        .from('department_features')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('vertical_id', verticalId)
        .eq('department_id', departmentId)
        .order('display_order', { ascending: true }),
      supabase
        .from('department_tools')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('vertical_id', verticalId)
        .eq('department_id', departmentId)
        .order('display_order', { ascending: true }),
      supabase
        .from('department_integrations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('vertical_id', verticalId)
        .eq('department_id', departmentId)
        .order('display_order', { ascending: true }),
      supabase
        .from('quick_actions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('vertical_id', verticalId)
        .eq('department_id', departmentId)
        .order('display_order', { ascending: true })
    ])

    if (assignmentData.error) throw assignmentData.error

    console.log('[loadDepartmentCustomizationBundle] ✅ Bundle loaded')

    return {
      assignment: assignmentData.data,
      statCards: statCards.data || [],
      features: features.data || [],
      tools: tools.data || [],
      integrations: integrations.data || [],
      quickActions: quickActions.data || []
    }
  } catch (error) {
    console.error('[loadDepartmentCustomizationBundle] ❌ Exception:', error)
    throw error
  }
}

export const resetDepartmentToDefaults = async (
  organizationId: string,
  verticalId: VerticalId,
  departmentId: string
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    console.log('[resetDepartmentToDefaults] 🔄 Resetting to defaults:', {
      organizationId,
      verticalId,
      departmentId
    })

    await supabase
      .from('department_section_assignments')
      .update({
        custom_name: null,
        custom_description: null,
        icon_name: null,
        emoji: null,
        color_theme: null,
        updated_by: user.id
      })
      .eq('organization_id', organizationId)
      .eq('vertical_id', verticalId)
      .eq('department_id', departmentId)

    await Promise.all([
      supabase
        .from('department_stat_cards')
        .delete()
        .eq('organization_id', organizationId)
        .eq('vertical_id', verticalId)
        .eq('department_id', departmentId),
      supabase
        .from('department_features')
        .delete()
        .eq('organization_id', organizationId)
        .eq('vertical_id', verticalId)
        .eq('department_id', departmentId),
      supabase
        .from('department_tools')
        .delete()
        .eq('organization_id', organizationId)
        .eq('vertical_id', verticalId)
        .eq('department_id', departmentId),
      supabase
        .from('department_integrations')
        .delete()
        .eq('organization_id', organizationId)
        .eq('vertical_id', verticalId)
        .eq('department_id', departmentId),
      supabase
        .from('quick_actions')
        .delete()
        .eq('organization_id', organizationId)
        .eq('vertical_id', verticalId)
        .eq('department_id', departmentId)
    ])

    const { data: uiCustomization } = await supabase
      .from('organization_ui_customizations')
      .select('id, department_config')
      .eq('organization_id', organizationId)
      .eq('vertical_id', verticalId)
      .maybeSingle()

    if (uiCustomization) {
      const departmentConfig = { ...uiCustomization.department_config }
      delete departmentConfig[departmentId]

      await supabase
        .from('organization_ui_customizations')
        .update({
          department_config: departmentConfig,
          updated_by: user.id
        })
        .eq('id', uiCustomization.id)
    }

    console.log('[resetDepartmentToDefaults] ✅ Reset complete')
    return true
  } catch (error) {
    console.error('[resetDepartmentToDefaults] ❌ Exception:', error)
    throw error
  }
}

export const cloneDepartmentSettings = async (
  organizationId: string,
  verticalId: VerticalId,
  sourceDepartmentId: string,
  targetDepartmentId: string
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    console.log('[cloneDepartmentSettings] 📋 Cloning settings:', {
      from: sourceDepartmentId,
      to: targetDepartmentId
    })

    const sourceBundle = await loadDepartmentCustomizationBundle(
      organizationId,
      verticalId,
      sourceDepartmentId
    )

    if (sourceBundle.assignment) {
      await saveDepartmentBasicSettings({
        organizationId,
        verticalId,
        departmentId: targetDepartmentId,
        settings: {
          customName: sourceBundle.assignment.custom_name,
          customDescription: sourceBundle.assignment.custom_description,
          iconName: sourceBundle.assignment.icon_name,
          emoji: sourceBundle.assignment.emoji,
          colorTheme: sourceBundle.assignment.color_theme
        }
      })
    }

    const clonePromises = []

    for (const card of sourceBundle.statCards) {
      clonePromises.push(
        supabase.from('department_stat_cards').insert({
          organization_id: organizationId,
          vertical_id: verticalId,
          department_id: targetDepartmentId,
          label: card.label,
          icon_name: card.icon_name,
          metric_type: card.metric_type,
          display_order: card.display_order,
          is_visible: card.is_visible,
          created_by: user.id,
          updated_by: user.id
        })
      )
    }

    for (const feature of sourceBundle.features) {
      clonePromises.push(
        supabase.from('department_features').insert({
          organization_id: organizationId,
          vertical_id: verticalId,
          department_id: targetDepartmentId,
          title: feature.title,
          description: feature.description,
          display_order: feature.display_order,
          is_visible: feature.is_visible,
          created_by: user.id,
          updated_by: user.id
        })
      )
    }

    for (const tool of sourceBundle.tools) {
      clonePromises.push(
        supabase.from('department_tools').insert({
          organization_id: organizationId,
          vertical_id: verticalId,
          department_id: targetDepartmentId,
          tool_name: tool.tool_name,
          tool_description: tool.tool_description,
          tool_url: tool.tool_url,
          tool_type: tool.tool_type,
          integration_config: tool.integration_config,
          display_order: tool.display_order,
          is_visible: tool.is_visible,
          created_by: user.id,
          updated_by: user.id
        })
      )
    }

    await Promise.all(clonePromises)

    console.log('[cloneDepartmentSettings] ✅ Clone complete')
    return true
  } catch (error) {
    console.error('[cloneDepartmentSettings] ❌ Exception:', error)
    throw error
  }
}

export const validateDepartmentCustomization = (bundle: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!bundle.assignment) {
    errors.push('Department assignment not found')
  }

  if (bundle.assignment?.custom_name && bundle.assignment.custom_name.length > 100) {
    errors.push('Department name must be 100 characters or less')
  }

  if (bundle.assignment?.custom_description && bundle.assignment.custom_description.length > 500) {
    errors.push('Department description must be 500 characters or less')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
