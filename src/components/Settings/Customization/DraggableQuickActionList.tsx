import React from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { QuickAction } from '../../../types/departmentLandingPage'
import { GripVertical, Edit, Trash2, Eye, EyeOff, Shield, ExternalLink, Square } from 'lucide-react'
import * as Icons from 'lucide-react'

interface SortableQuickActionProps {
  quickAction: QuickAction
  onEdit: (quickAction: QuickAction) => void
  onDelete: (id: string) => void
  onToggleVisibility: (id: string, isEnabled: boolean) => void
}

function SortableQuickAction({ quickAction, onEdit, onDelete, onToggleVisibility }: SortableQuickActionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: quickAction.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName]
    return IconComponent ? <IconComponent className="h-5 w-5" /> : null
  }

  const getButtonStyleColor = (buttonStyle: string) => {
    switch (buttonStyle) {
      case 'primary':
        return 'bg-blue-600 text-white'
      case 'secondary':
        return 'bg-gray-600 text-white'
      case 'outline':
        return 'border-2 border-blue-600 text-blue-600'
      case 'ghost':
        return 'text-blue-600'
      default:
        return 'bg-blue-600 text-white'
    }
  }

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case 'external':
        return <ExternalLink className="h-3 w-3" />
      case 'modal':
        return <Square className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-lg p-4 flex items-center space-x-3"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            {getIconComponent(quickAction.icon)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-gray-900 truncate">{quickAction.label}</h4>
              {quickAction.requires_oauth && (
                <span title="Requires OAuth">
                  <Shield className="h-4 w-4 text-orange-600" />
                </span>
              )}
              {getActionTypeIcon(quickAction.action_type) && (
                <span className="text-gray-400" title={quickAction.action_type}>
                  {getActionTypeIcon(quickAction.action_type)}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 text-xs rounded ${getButtonStyleColor(quickAction.button_style)}`}>
                {quickAction.button_style}
              </span>
              <p className="text-xs text-gray-500">
                {quickAction.action_type} • Order: {quickAction.display_order}
              </p>
            </div>
            {quickAction.action_url && (
              <p className="text-xs text-gray-400 mt-1 truncate" title={quickAction.action_url}>
                {quickAction.action_url}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onToggleVisibility(quickAction.id, !quickAction.is_enabled)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          title={quickAction.is_enabled ? 'Disable' : 'Enable'}
        >
          {quickAction.is_enabled ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={() => onEdit(quickAction)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(quickAction.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

interface DraggableQuickActionListProps {
  quickActions: QuickAction[]
  onReorder: (newQuickActions: QuickAction[]) => void
  onEdit: (quickAction: QuickAction) => void
  onDelete: (id: string) => void
  onToggleVisibility: (id: string, isEnabled: boolean) => void
}

export const DraggableQuickActionList: React.FC<DraggableQuickActionListProps> = ({
  quickActions,
  onReorder,
  onEdit,
  onDelete,
  onToggleVisibility
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = quickActions.findIndex(a => a.id === active.id)
      const newIndex = quickActions.findIndex(a => a.id === over.id)

      const newQuickActions = arrayMove(quickActions, oldIndex, newIndex).map((action, index) => ({
        ...action,
        display_order: index
      }))

      onReorder(newQuickActions)
    }
  }

  if (quickActions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No quick actions yet. Add one to get started.
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={quickActions.map(a => a.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {quickActions.map(quickAction => (
            <SortableQuickAction
              key={quickAction.id}
              quickAction={quickAction}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleVisibility={onToggleVisibility}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
