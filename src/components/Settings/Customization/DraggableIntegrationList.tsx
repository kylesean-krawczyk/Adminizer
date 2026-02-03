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
import { DepartmentIntegration } from '../../../types/departmentLandingPage'
import { GripVertical, Edit, Trash2, Eye, EyeOff, ExternalLink, Shield } from 'lucide-react'
import * as Icons from 'lucide-react'

interface SortableIntegrationProps {
  integration: DepartmentIntegration
  onEdit: (integration: DepartmentIntegration) => void
  onDelete: (id: string) => void
  onToggleVisibility: (id: string, isEnabled: boolean) => void
}

function SortableIntegration({ integration, onEdit, onDelete, onToggleVisibility }: SortableIntegrationProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: integration.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName]
    return IconComponent ? <IconComponent className="h-5 w-5" /> : null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
          {integration.logo_url ? (
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
              <img
                src={integration.logo_url}
                alt={integration.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              {getIconComponent(integration.icon)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-gray-900 truncate">{integration.name}</h4>
              {integration.oauth_enabled && (
                <span title="OAuth Enabled">
                  <Shield className="h-4 w-4 text-blue-600" />
                </span>
              )}
              {integration.external_link && (
                <span title="Has External Link">
                  <ExternalLink className="h-3 w-3 text-gray-400" />
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(integration.status)}`}>
                {integration.status}
              </span>
              <p className="text-xs text-gray-500">
                {integration.features.length} features • Order: {integration.display_order}
              </p>
            </div>
            {integration.badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {integration.badges.map((badge, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onToggleVisibility(integration.id, !integration.is_enabled)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          title={integration.is_enabled ? 'Disable' : 'Enable'}
        >
          {integration.is_enabled ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={() => onEdit(integration)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(integration.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

interface DraggableIntegrationListProps {
  integrations: DepartmentIntegration[]
  onReorder: (newIntegrations: DepartmentIntegration[]) => void
  onEdit: (integration: DepartmentIntegration) => void
  onDelete: (id: string) => void
  onToggleVisibility: (id: string, isEnabled: boolean) => void
}

export const DraggableIntegrationList: React.FC<DraggableIntegrationListProps> = ({
  integrations,
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
      const oldIndex = integrations.findIndex(i => i.id === active.id)
      const newIndex = integrations.findIndex(i => i.id === over.id)

      const newIntegrations = arrayMove(integrations, oldIndex, newIndex).map((integration, index) => ({
        ...integration,
        display_order: index
      }))

      onReorder(newIntegrations)
    }
  }

  if (integrations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No integrations yet. Add one to get started.
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
        items={integrations.map(i => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {integrations.map(integration => (
            <SortableIntegration
              key={integration.id}
              integration={integration}
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
