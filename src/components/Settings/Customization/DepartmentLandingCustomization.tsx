import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { useVertical } from '../../../contexts/VerticalContext'
import { useDepartmentLandingData } from '../../../hooks/useDepartmentLandingData'
import { StatCard, DepartmentFeature, DepartmentTool } from '../../../types/departmentLandingPage'
import { ChevronDown, ChevronUp, Plus, Loader } from 'lucide-react'
import { StatCardEditor } from './StatCardEditor'
import { FeatureEditor } from './FeatureEditor'
import { ToolEditor } from './ToolEditor'
import { DraggableStatCardList } from './DraggableStatCardList'
import { DraggableFeatureList } from './DraggableFeatureList'
import { DraggableToolList } from './DraggableToolList'
import { VisualSettingsPanel } from './VisualSettingsPanel'
import {
  saveStatCard,
  deleteStatCard,
  reorderStatCards,
  saveDepartmentFeature,
  deleteDepartmentFeature,
  reorderFeatures,
  saveDepartmentTool,
  deleteDepartmentTool,
  reorderTools,
  updateDepartmentVisualConfig
} from '../../../services/departmentLandingService'
import { supabase } from '../../../lib/supabase'

interface DepartmentLandingCustomizationProps {
  departmentId: string
  departmentName: string
}

type EditorMode = 'stat-card' | 'feature' | 'tool' | null
type EditingItem = StatCard | DepartmentFeature | DepartmentTool | null

export const DepartmentLandingCustomization: React.FC<DepartmentLandingCustomizationProps> = ({
  departmentId,
  departmentName
}) => {
  const { user } = useAuth()
  const { vertical } = useVertical()
  const {
    config,
    statCards,
    features,
    tools,
    loading,
    error,
    refetch
  } = useDepartmentLandingData({
    departmentId,
    verticalId: vertical.id,
    organizationId: user?.organizationId || undefined,
    enabled: true
  })

  const [expandedSections, setExpandedSections] = useState({
    statCards: true,
    features: true,
    tools: true,
    visual: true
  })
  const [editorMode, setEditorMode] = useState<EditorMode>(null)
  const [editingItem, setEditingItem] = useState<EditingItem>(null)
  const [localStatCards, setLocalStatCards] = useState<StatCard[]>([])
  const [localFeatures, setLocalFeatures] = useState<DepartmentFeature[]>([])
  const [localTools, setLocalTools] = useState<DepartmentTool[]>([])

  useEffect(() => {
    setLocalStatCards(statCards)
  }, [statCards])

  useEffect(() => {
    setLocalFeatures(features)
  }, [features])

  useEffect(() => {
    setLocalTools(tools)
  }, [tools])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleAddStatCard = () => {
    setEditingItem(null)
    setEditorMode('stat-card')
  }

  const handleEditStatCard = (card: StatCard) => {
    setEditingItem(card)
    setEditorMode('stat-card')
  }

  const handleSaveStatCard = async (data: {
    label: string
    iconName: string
    metricType: string
    displayOrder: number
  }) => {
    if (!user?.organizationId) return

    await saveStatCard({
      organizationId: user.organizationId,
      verticalId: vertical.id,
      departmentId,
      label: data.label,
      iconName: data.iconName as any,
      metricType: data.metricType as any,
      displayOrder: data.displayOrder,
      isVisible: true
    })

    await refetch()
    setEditorMode(null)
    setEditingItem(null)
  }

  const handleDeleteStatCard = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this stat card?')) return
    await deleteStatCard(id)
    await refetch()
  }

  const handleToggleStatCardVisibility = async (id: string, isVisible: boolean) => {
    const card = localStatCards.find(c => c.id === id)
    if (!card || !user?.organizationId) return

    await supabase
      .from('department_stat_cards')
      .update({ is_visible: isVisible })
      .eq('id', id)

    await refetch()
  }

  const handleReorderStatCards = async (newCards: StatCard[]) => {
    setLocalStatCards(newCards)

    if (!user?.organizationId) return

    await reorderStatCards({
      organizationId: user.organizationId,
      verticalId: vertical.id,
      departmentId,
      updates: newCards.map(card => ({
        id: card.id,
        display_order: card.display_order
      }))
    })

    await refetch()
  }

  const handleAddFeature = () => {
    setEditingItem(null)
    setEditorMode('feature')
  }

  const handleEditFeature = (feature: DepartmentFeature) => {
    setEditingItem(feature)
    setEditorMode('feature')
  }

  const handleSaveFeature = async (data: {
    title: string
    description?: string
    displayOrder: number
  }) => {
    if (!user?.organizationId) return

    await saveDepartmentFeature({
      organizationId: user.organizationId,
      verticalId: vertical.id,
      departmentId,
      title: data.title,
      description: data.description,
      displayOrder: data.displayOrder,
      isVisible: true
    })

    await refetch()
    setEditorMode(null)
    setEditingItem(null)
  }

  const handleDeleteFeature = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this feature?')) return
    await deleteDepartmentFeature(id)
    await refetch()
  }

  const handleToggleFeatureVisibility = async (id: string, isVisible: boolean) => {
    await supabase
      .from('department_features')
      .update({ is_visible: isVisible })
      .eq('id', id)

    await refetch()
  }

  const handleReorderFeatures = async (newFeatures: DepartmentFeature[]) => {
    setLocalFeatures(newFeatures)

    if (!user?.organizationId) return

    await reorderFeatures({
      organizationId: user.organizationId,
      verticalId: vertical.id,
      departmentId,
      updates: newFeatures.map(feature => ({
        id: feature.id,
        display_order: feature.display_order
      }))
    })

    await refetch()
  }

  const handleAddTool = () => {
    setEditingItem(null)
    setEditorMode('tool')
  }

  const handleEditTool = (tool: DepartmentTool) => {
    setEditingItem(tool)
    setEditorMode('tool')
  }

  const handleSaveTool = async (data: {
    toolName: string
    toolDescription?: string
    toolUrl?: string
    toolType: string
    displayOrder: number
  }) => {
    if (!user?.organizationId) return

    await saveDepartmentTool({
      organizationId: user.organizationId,
      verticalId: vertical.id,
      departmentId,
      toolName: data.toolName,
      toolDescription: data.toolDescription,
      toolUrl: data.toolUrl,
      toolType: data.toolType as any,
      displayOrder: data.displayOrder,
      isVisible: true
    })

    await refetch()
    setEditorMode(null)
    setEditingItem(null)
  }

  const handleDeleteTool = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this tool?')) return
    await deleteDepartmentTool(id)
    await refetch()
  }

  const handleToggleToolVisibility = async (id: string, isVisible: boolean) => {
    await supabase
      .from('department_tools')
      .update({ is_visible: isVisible })
      .eq('id', id)

    await refetch()
  }

  const handleReorderTools = async (newTools: DepartmentTool[]) => {
    setLocalTools(newTools)

    if (!user?.organizationId) return

    await reorderTools({
      organizationId: user.organizationId,
      verticalId: vertical.id,
      departmentId,
      updates: newTools.map(tool => ({
        id: tool.id,
        display_order: tool.display_order
      }))
    })

    await refetch()
  }

  const handleSaveVisualSettings = async (
    iconName?: string,
    emoji?: string,
    colorTheme?: string
  ) => {
    if (!user?.organizationId) return

    await updateDepartmentVisualConfig(
      user.organizationId,
      vertical.id,
      departmentId,
      iconName,
      emoji,
      colorTheme
    )

    await refetch()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-1">
          Customizing: {departmentName}
        </h3>
        <p className="text-sm text-blue-700">
          Configure the landing page content and appearance for this department.
          Changes will be visible to all users who access this department.
        </p>
      </div>

      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('statCards')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <h3 className="font-semibold text-gray-900">Stat Cards</h3>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              {localStatCards.length}
            </span>
          </div>
          {expandedSections.statCards ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {expandedSections.statCards && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Statistics cards displayed at the top of the department page
              </p>
              <button
                onClick={handleAddStatCard}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add Stat Card</span>
              </button>
            </div>

            <DraggableStatCardList
              cards={localStatCards}
              onReorder={handleReorderStatCards}
              onEdit={handleEditStatCard}
              onDelete={handleDeleteStatCard}
              onToggleVisibility={handleToggleStatCardVisibility}
            />
          </div>
        )}
      </div>

      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('features')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <h3 className="font-semibold text-gray-900">Features</h3>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              {localFeatures.length}
            </span>
          </div>
          {expandedSections.features ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {expandedSections.features && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Key features and capabilities of this department
              </p>
              <button
                onClick={handleAddFeature}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add Feature</span>
              </button>
            </div>

            <DraggableFeatureList
              features={localFeatures}
              onReorder={handleReorderFeatures}
              onEdit={handleEditFeature}
              onDelete={handleDeleteFeature}
              onToggleVisibility={handleToggleFeatureVisibility}
            />
          </div>
        )}
      </div>

      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('tools')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <h3 className="font-semibold text-gray-900">Tools</h3>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              {localTools.length}
            </span>
          </div>
          {expandedSections.tools ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {expandedSections.tools && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Tools and resources available for this department
              </p>
              <button
                onClick={handleAddTool}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add Tool</span>
              </button>
            </div>

            <DraggableToolList
              tools={localTools}
              onReorder={handleReorderTools}
              onEdit={handleEditTool}
              onDelete={handleDeleteTool}
              onToggleVisibility={handleToggleToolVisibility}
            />
          </div>
        )}
      </div>

      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('visual')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <h3 className="font-semibold text-gray-900">Visual Settings</h3>
          {expandedSections.visual ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {expandedSections.visual && (
          <div className="p-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4">
              Customize the appearance of this department
            </p>
            <VisualSettingsPanel
              iconName={config?.icon_name || undefined}
              emoji={config?.emoji || undefined}
              colorTheme={config?.color_theme || undefined}
              onSave={handleSaveVisualSettings}
            />
          </div>
        )}
      </div>

      {editorMode === 'stat-card' && (
        <StatCardEditor
          card={editingItem as StatCard}
          onSave={handleSaveStatCard}
          onCancel={() => {
            setEditorMode(null)
            setEditingItem(null)
          }}
          existingOrders={localStatCards.map(c => c.display_order)}
        />
      )}

      {editorMode === 'feature' && (
        <FeatureEditor
          feature={editingItem as DepartmentFeature}
          onSave={handleSaveFeature}
          onCancel={() => {
            setEditorMode(null)
            setEditingItem(null)
          }}
          existingOrders={localFeatures.map(f => f.display_order)}
        />
      )}

      {editorMode === 'tool' && (
        <ToolEditor
          tool={editingItem as DepartmentTool}
          onSave={handleSaveTool}
          onCancel={() => {
            setEditorMode(null)
            setEditingItem(null)
          }}
          existingOrders={localTools.map(t => t.display_order)}
        />
      )}
    </div>
  )
}
