import React, { useState, useEffect } from 'react'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { VerticalId } from '../../../config/types'
import { QuickAction } from '../../../types/departmentLandingPage'
import { DraggableQuickActionList } from './DraggableQuickActionList'
import { QuickActionEditorModal } from './QuickActionEditorModal'
import {
  saveQuickAction,
  deleteQuickAction,
  reorderQuickActions
} from '../../../services/departmentLandingService'

interface DepartmentQuickActionsManagerProps {
  organizationId: string
  verticalId: VerticalId
  departmentId: string
  initialQuickActions: QuickAction[]
}

export const DepartmentQuickActionsManager: React.FC<DepartmentQuickActionsManagerProps> = ({
  organizationId,
  verticalId,
  departmentId,
  initialQuickActions
}) => {
  const [quickActions, setQuickActions] = useState<QuickAction[]>(initialQuickActions)
  const [isExpanded, setIsExpanded] = useState(true)
  const [editingAction, setEditingAction] = useState<QuickAction | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    setQuickActions(initialQuickActions)
  }, [initialQuickActions])

  const handleReorder = async (newActions: QuickAction[]) => {
    setQuickActions(newActions)

    const updates = newActions.map((action, index) => ({
      id: action.id,
      display_order: index
    }))

    await reorderQuickActions({
      organizationId,
      verticalId,
      departmentId,
      updates
    })
  }

  const handleEdit = (action: QuickAction) => {
    setEditingAction(action)
    setShowEditor(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this quick action?')) {
      await deleteQuickAction(id)
      setQuickActions(quickActions.filter(a => a.id !== id))
    }
  }

  const handleToggleEnabled = async (id: string, isEnabled: boolean) => {
    const action = quickActions.find(a => a.id === id)
    if (!action) return

    await saveQuickAction({
      organizationId,
      verticalId,
      departmentId,
      label: action.label,
      icon: action.icon,
      actionUrl: action.action_url,
      actionType: action.action_type,
      requiresOauth: action.requires_oauth,
      relatedIntegrationId: action.related_integration_id || undefined,
      buttonStyle: action.button_style,
      displayOrder: action.display_order,
      isEnabled: !isEnabled
    })

    setQuickActions(quickActions.map(a => a.id === id ? { ...a, is_enabled: !isEnabled } : a))
  }

  const handleSaveAction = async (actionData: any) => {
    try {
      const saved = await saveQuickAction({
        organizationId,
        verticalId,
        departmentId,
        label: actionData.label,
        icon: actionData.icon,
        actionUrl: actionData.actionUrl,
        actionType: actionData.actionType,
        requiresOauth: actionData.requiresOauth,
        relatedIntegrationId: actionData.relatedIntegrationId,
        buttonStyle: actionData.buttonStyle,
        displayOrder: editingAction ? editingAction.display_order : quickActions.length,
        isEnabled: true
      })

      if (editingAction) {
        setQuickActions(quickActions.map(a => a.id === editingAction.id ? saved : a))
      } else {
        setQuickActions([...quickActions, saved])
      }

      setShowEditor(false)
      setEditingAction(null)
    } catch (error) {
      console.error('Error saving quick action:', error)
      alert('Failed to save quick action')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <h5 className="font-semibold text-gray-900">Quick Actions</h5>
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
            {quickActions.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setEditingAction(null)
              setShowEditor(true)
            }}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          <DraggableQuickActionList
            quickActions={quickActions}
            onReorder={handleReorder}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleVisibility={handleToggleEnabled}
          />
        </div>
      )}

      {showEditor && (
        <QuickActionEditorModal
          quickAction={editingAction}
          integrations={[]}
          existingOrders={quickActions.map(a => a.display_order)}
          onSave={handleSaveAction}
          onCancel={() => {
            setShowEditor(false)
            setEditingAction(null)
          }}
        />
      )}
    </div>
  )
}

export default DepartmentQuickActionsManager
