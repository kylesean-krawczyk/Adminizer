import { supabase } from '../lib/supabase'
import { VerticalId } from '../config/types'
import {
  StatCard,
  DepartmentFeature,
  DepartmentTool,
  DepartmentConfiguration,
  CompleteDepartmentData,
  SaveStatCardParams,
  SaveDepartmentFeatureParams,
  SaveDepartmentToolParams,
  ReorderParams,
  DepartmentIntegration,
  QuickAction,
  SaveIntegrationParams,
  SaveQuickActionParams
} from '../types/departmentLandingPage'
import { getDepartmentAssignments } from './departmentAssignmentService'

/**
 * Get complete department landing page data
 * Fetches configuration, stat cards, features, tools, integrations, and quick actions
 */
export const getDepartmentLandingData = async (
  organizationId: string,
  verticalId: VerticalId,
  departmentId: string
): Promise<CompleteDepartmentData> => {
  try {
    console.log('[getDepartmentLandingData] 🚀 Fetching data:', {
      organizationId,
      verticalId,
      departmentId
    })

    // Fetch all data in parallel
    const [assignments, statCards, features, tools, integrations, quickActions] = await Promise.all([
      getDepartmentAssignments(organizationId, verticalId),
      getStatCards(organizationId, verticalId, departmentId),
      getDepartmentFeatures(organizationId, verticalId, departmentId),
      getDepartmentTools(organizationId, verticalId, departmentId),
      getIntegrations(organizationId, verticalId, departmentId),
      getQuickActions(organizationId, verticalId, departmentId)
    ])

    // Find the specific department configuration
    const config = assignments.find(a => a.department_id === departmentId)

    if (!config) {
      throw new Error(`Department configuration not found: ${departmentId}`)
    }

    console.log('[getDepartmentLandingData] ✅ Data fetched successfully:', {
      statCards: statCards.length,
      features: features.length,
      tools: tools.length,
      integrations: integrations.length,
      quickActions: quickActions.length
    })

    return {
      config: config as DepartmentConfiguration,
      statCards,
      features,
      tools,
      integrations,
      quickActions
    }
  } catch (error) {
    console.error('[getDepartmentLandingData] ❌ Error:', error)
    throw error
  }
}

/**
 * Get stat cards for a department
 */
export const getStatCards = async (
  organizationId: string,
  verticalId: VerticalId,
  departmentId: string
): Promise<StatCard[]> => {
  try {
    const { data, error } = await supabase
      .from('department_stat_cards')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('vertical_id', verticalId)
      .eq('department_id', departmentId)
      .eq('is_visible', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[getStatCards] Error:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('[getStatCards] Exception:', error)
    return []
  }
}

/**
 * Save or update a stat card
 */
export const saveStatCard = async (params: SaveStatCardParams): Promise<StatCard> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    console.log('[saveStatCard] Saving:', params)

    const cardData = {
      organization_id: params.organizationId,
      vertical_id: params.verticalId,
      department_id: params.departmentId,
      label: params.label,
      icon_name: params.iconName,
      metric_type: params.metricType,
      display_order: params.displayOrder,
      is_visible: params.isVisible ?? true,
      updated_by: user.id
    }

    const { data, error } = await supabase
      .from('department_stat_cards')
      .upsert(cardData, {
        onConflict: 'organization_id,vertical_id,department_id,display_order'
      })
      .select()
      .single()

    if (error) {
      console.error('[saveStatCard] Error:', error)
      throw error
    }

    console.log('[saveStatCard] Success:', data.id)
    return data
  } catch (error) {
    console.error('[saveStatCard] Exception:', error)
    throw error
  }
}

/**
 * Delete a stat card
 */
export const deleteStatCard = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('department_stat_cards')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[deleteStatCard] Error:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('[deleteStatCard] Exception:', error)
    return false
  }
}

/**
 * Reorder stat cards
 */
export const reorderStatCards = async (params: ReorderParams): Promise<boolean> => {
  try {
    console.log('[reorderStatCards] Reordering:', params)

    // Update each card's display_order
    const updates = params.updates.map(update =>
      supabase
        .from('department_stat_cards')
        .update({ display_order: update.display_order })
        .eq('id', update.id)
    )

    await Promise.all(updates)

    console.log('[reorderStatCards] Success')
    return true
  } catch (error) {
    console.error('[reorderStatCards] Exception:', error)
    return false
  }
}

/**
 * Get features for a department
 */
export const getDepartmentFeatures = async (
  organizationId: string,
  verticalId: VerticalId,
  departmentId: string
): Promise<DepartmentFeature[]> => {
  try {
    const { data, error } = await supabase
      .from('department_features')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('vertical_id', verticalId)
      .eq('department_id', departmentId)
      .eq('is_visible', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[getDepartmentFeatures] Error:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('[getDepartmentFeatures] Exception:', error)
    return []
  }
}

/**
 * Save or update a department feature
 */
export const saveDepartmentFeature = async (
  params: SaveDepartmentFeatureParams
): Promise<DepartmentFeature> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    console.log('[saveDepartmentFeature] Saving:', params)

    const featureData = {
      organization_id: params.organizationId,
      vertical_id: params.verticalId,
      department_id: params.departmentId,
      title: params.title,
      description: params.description || null,
      display_order: params.displayOrder,
      is_visible: params.isVisible ?? true,
      updated_by: user.id,
      created_by: user.id
    }

    const { data, error} = await supabase
      .from('department_features')
      .upsert(featureData)
      .select()
      .single()

    if (error) {
      console.error('[saveDepartmentFeature] Error:', error)
      throw error
    }

    console.log('[saveDepartmentFeature] Success:', data.id)
    return data
  } catch (error) {
    console.error('[saveDepartmentFeature] Exception:', error)
    throw error
  }
}

/**
 * Delete a department feature
 */
export const deleteDepartmentFeature = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('department_features')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[deleteDepartmentFeature] Error:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('[deleteDepartmentFeature] Exception:', error)
    return false
  }
}

/**
 * Reorder features
 */
export const reorderFeatures = async (params: ReorderParams): Promise<boolean> => {
  try {
    console.log('[reorderFeatures] Reordering:', params)

    const updates = params.updates.map(update =>
      supabase
        .from('department_features')
        .update({ display_order: update.display_order })
        .eq('id', update.id)
    )

    await Promise.all(updates)

    console.log('[reorderFeatures] Success')
    return true
  } catch (error) {
    console.error('[reorderFeatures] Exception:', error)
    return false
  }
}

/**
 * Get tools for a department
 */
export const getDepartmentTools = async (
  organizationId: string,
  verticalId: VerticalId,
  departmentId: string
): Promise<DepartmentTool[]> => {
  try {
    const { data, error } = await supabase
      .from('department_tools')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('vertical_id', verticalId)
      .eq('department_id', departmentId)
      .eq('is_visible', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[getDepartmentTools] Error:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('[getDepartmentTools] Exception:', error)
    return []
  }
}

/**
 * Save or update a department tool
 */
export const saveDepartmentTool = async (
  params: SaveDepartmentToolParams
): Promise<DepartmentTool> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    console.log('[saveDepartmentTool] Saving:', params)

    const toolData = {
      organization_id: params.organizationId,
      vertical_id: params.verticalId,
      department_id: params.departmentId,
      tool_name: params.toolName,
      tool_description: params.toolDescription || null,
      tool_url: params.toolUrl || null,
      tool_type: params.toolType,
      integration_config: params.integrationConfig || {},
      display_order: params.displayOrder,
      is_visible: params.isVisible ?? true,
      updated_by: user.id,
      created_by: user.id
    }

    const { data, error } = await supabase
      .from('department_tools')
      .upsert(toolData)
      .select()
      .single()

    if (error) {
      console.error('[saveDepartmentTool] Error:', error)
      throw error
    }

    console.log('[saveDepartmentTool] Success:', data.id)
    return data
  } catch (error) {
    console.error('[saveDepartmentTool] Exception:', error)
    throw error
  }
}

/**
 * Delete a department tool
 */
export const deleteDepartmentTool = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('department_tools')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[deleteDepartmentTool] Error:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('[deleteDepartmentTool] Exception:', error)
    return false
  }
}

/**
 * Reorder tools
 */
export const reorderTools = async (params: ReorderParams): Promise<boolean> => {
  try {
    console.log('[reorderTools] Reordering:', params)

    const updates = params.updates.map(update =>
      supabase
        .from('department_tools')
        .update({ display_order: update.display_order })
        .eq('id', update.id)
    )

    await Promise.all(updates)

    console.log('[reorderTools] Success')
    return true
  } catch (error) {
    console.error('[reorderTools] Exception:', error)
    return false
  }
}

/**
 * Update department visual configuration (icon, emoji, color)
 */
export const updateDepartmentVisualConfig = async (
  organizationId: string,
  verticalId: VerticalId,
  departmentId: string,
  iconName?: string,
  emoji?: string,
  colorTheme?: string
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    console.log('[updateDepartmentVisualConfig] Updating:', {
      organizationId,
      verticalId,
      departmentId,
      iconName,
      emoji,
      colorTheme
    })

    const updateData: any = {
      updated_by: user.id
    }

    if (iconName !== undefined) updateData.icon_name = iconName
    if (emoji !== undefined) updateData.emoji = emoji
    if (colorTheme !== undefined) updateData.color_theme = colorTheme

    const { error } = await supabase
      .from('department_section_assignments')
      .update(updateData)
      .eq('organization_id', organizationId)
      .eq('vertical_id', verticalId)
      .eq('department_id', departmentId)

    if (error) {
      console.error('[updateDepartmentVisualConfig] Error:', error)
      throw error
    }

    console.log('[updateDepartmentVisualConfig] Success')
    return true
  } catch (error) {
    console.error('[updateDepartmentVisualConfig] Exception:', error)
    return false
  }
}

/**
 * Get integrations for a department
 */
export const getIntegrations = async (
  organizationId: string,
  verticalId: VerticalId,
  departmentId: string
): Promise<DepartmentIntegration[]> => {
  try {
    console.log('[getIntegrations] 🔌 Fetching integrations:', { organizationId, verticalId, departmentId })

    const { data, error } = await supabase
      .from('department_integrations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('vertical_id', verticalId)
      .eq('department_id', departmentId)
      .eq('is_enabled', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[getIntegrations] ❌ Error:', error)
      throw error
    }

    console.log('[getIntegrations] ✅ Fetched', data?.length || 0, 'integrations')
    return data || []
  } catch (error) {
    console.error('[getIntegrations] ❌ Exception:', error)
    return []
  }
}

/**
 * Save or update a department integration
 */
export const saveIntegration = async (params: SaveIntegrationParams): Promise<DepartmentIntegration> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    console.log('[saveIntegration] 💾 Saving integration:', params.name)

    const integrationData = {
      organization_id: params.organizationId,
      vertical_id: params.verticalId,
      department_id: params.departmentId,
      name: params.name,
      description: params.description || null,
      icon: params.icon || 'Plug',
      logo_url: params.logoUrl || null,
      badges: params.badges || [],
      features: params.features || [],
      oauth_enabled: params.oauthEnabled ?? false,
      oauth_provider: params.oauthProvider || null,
      oauth_config: params.oauthConfig || {},
      external_link: params.externalLink || null,
      primary_contact_id: params.primaryContactId || null,
      status: params.status || 'active',
      display_order: params.displayOrder,
      is_enabled: params.isEnabled ?? true,
      updated_by: user.id,
      created_by: user.id
    }

    const { data, error } = await supabase
      .from('department_integrations')
      .upsert(integrationData)
      .select()
      .single()

    if (error) {
      console.error('[saveIntegration] ❌ Error:', error)
      throw error
    }

    console.log('[saveIntegration] ✅ Integration saved:', data.id)
    return data
  } catch (error) {
    console.error('[saveIntegration] ❌ Exception:', error)
    throw error
  }
}

/**
 * Delete a department integration
 */
export const deleteIntegration = async (id: string): Promise<boolean> => {
  try {
    console.log('[deleteIntegration] 🗑️ Deleting integration:', id)

    const { error } = await supabase
      .from('department_integrations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[deleteIntegration] ❌ Error:', error)
      throw error
    }

    console.log('[deleteIntegration] ✅ Integration deleted')
    return true
  } catch (error) {
    console.error('[deleteIntegration] ❌ Exception:', error)
    return false
  }
}

/**
 * Reorder integrations
 */
export const reorderIntegrations = async (params: ReorderParams): Promise<boolean> => {
  try {
    console.log('[reorderIntegrations] 🔄 Reordering integrations:', params.updates.length)

    const updates = params.updates.map(update =>
      supabase
        .from('department_integrations')
        .update({ display_order: update.display_order })
        .eq('id', update.id)
    )

    await Promise.all(updates)

    console.log('[reorderIntegrations] ✅ Integrations reordered')
    return true
  } catch (error) {
    console.error('[reorderIntegrations] ❌ Exception:', error)
    return false
  }
}

/**
 * Toggle integration status
 */
export const toggleIntegrationStatus = async (
  id: string,
  status: 'active' | 'inactive' | 'pending'
): Promise<boolean> => {
  try {
    console.log('[toggleIntegrationStatus] 🔄 Updating status:', { id, status })

    const { error } = await supabase
      .from('department_integrations')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error('[toggleIntegrationStatus] ❌ Error:', error)
      throw error
    }

    console.log('[toggleIntegrationStatus] ✅ Status updated')
    return true
  } catch (error) {
    console.error('[toggleIntegrationStatus] ❌ Exception:', error)
    return false
  }
}

/**
 * Get quick actions for a department
 */
export const getQuickActions = async (
  organizationId: string,
  verticalId: VerticalId,
  departmentId: string
): Promise<QuickAction[]> => {
  try {
    console.log('[getQuickActions] ⚡ Fetching quick actions:', { organizationId, verticalId, departmentId })

    const { data, error } = await supabase
      .from('quick_actions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('vertical_id', verticalId)
      .eq('department_id', departmentId)
      .eq('is_enabled', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[getQuickActions] ❌ Error:', error)
      throw error
    }

    console.log('[getQuickActions] ✅ Fetched', data?.length || 0, 'quick actions')
    return data || []
  } catch (error) {
    console.error('[getQuickActions] ❌ Exception:', error)
    return []
  }
}

/**
 * Save or update a quick action
 */
export const saveQuickAction = async (params: SaveQuickActionParams): Promise<QuickAction> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    console.log('[saveQuickAction] 💾 Saving quick action:', params.label)

    const actionData = {
      organization_id: params.organizationId,
      vertical_id: params.verticalId,
      department_id: params.departmentId,
      label: params.label,
      icon: params.icon,
      action_url: params.actionUrl,
      action_type: params.actionType,
      requires_oauth: params.requiresOauth ?? false,
      related_integration_id: params.relatedIntegrationId || null,
      button_style: params.buttonStyle || 'primary',
      display_order: params.displayOrder,
      is_enabled: params.isEnabled ?? true,
      updated_by: user.id,
      created_by: user.id
    }

    const { data, error } = await supabase
      .from('quick_actions')
      .upsert(actionData)
      .select()
      .single()

    if (error) {
      console.error('[saveQuickAction] ❌ Error:', error)
      throw error
    }

    console.log('[saveQuickAction] ✅ Quick action saved:', data.id)
    return data
  } catch (error) {
    console.error('[saveQuickAction] ❌ Exception:', error)
    throw error
  }
}

/**
 * Delete a quick action
 */
export const deleteQuickAction = async (id: string): Promise<boolean> => {
  try {
    console.log('[deleteQuickAction] 🗑️ Deleting quick action:', id)

    const { error } = await supabase
      .from('quick_actions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[deleteQuickAction] ❌ Error:', error)
      throw error
    }

    console.log('[deleteQuickAction] ✅ Quick action deleted')
    return true
  } catch (error) {
    console.error('[deleteQuickAction] ❌ Exception:', error)
    return false
  }
}

/**
 * Reorder quick actions
 */
export const reorderQuickActions = async (params: ReorderParams): Promise<boolean> => {
  try {
    console.log('[reorderQuickActions] 🔄 Reordering quick actions:', params.updates.length)

    const updates = params.updates.map(update =>
      supabase
        .from('quick_actions')
        .update({ display_order: update.display_order })
        .eq('id', update.id)
    )

    await Promise.all(updates)

    console.log('[reorderQuickActions] ✅ Quick actions reordered')
    return true
  } catch (error) {
    console.error('[reorderQuickActions] ❌ Exception:', error)
    return false
  }
}
