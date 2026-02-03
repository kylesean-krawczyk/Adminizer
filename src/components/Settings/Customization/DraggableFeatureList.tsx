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
import { DepartmentFeature } from '../../../types/departmentLandingPage'
import { GripVertical, Edit, Trash2, Eye, EyeOff } from 'lucide-react'

interface SortableFeatureProps {
  feature: DepartmentFeature
  onEdit: (feature: DepartmentFeature) => void
  onDelete: (id: string) => void
  onToggleVisibility: (id: string, isVisible: boolean) => void
}

function SortableFeature({ feature, onEdit, onDelete, onToggleVisibility }: SortableFeatureProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: feature.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
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
        <h4 className="font-medium text-gray-900 truncate">{feature.title}</h4>
        {feature.description && (
          <p className="text-sm text-gray-600 truncate">{feature.description}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Order: {feature.display_order}
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onToggleVisibility(feature.id, !feature.is_visible)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          title={feature.is_visible ? 'Hide' : 'Show'}
        >
          {feature.is_visible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={() => onEdit(feature)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(feature.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

interface DraggableFeatureListProps {
  features: DepartmentFeature[]
  onReorder: (newFeatures: DepartmentFeature[]) => void
  onEdit: (feature: DepartmentFeature) => void
  onDelete: (id: string) => void
  onToggleVisibility: (id: string, isVisible: boolean) => void
}

export const DraggableFeatureList: React.FC<DraggableFeatureListProps> = ({
  features,
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
      const oldIndex = features.findIndex(f => f.id === active.id)
      const newIndex = features.findIndex(f => f.id === over.id)

      const newFeatures = arrayMove(features, oldIndex, newIndex).map((feature, index) => ({
        ...feature,
        display_order: index
      }))

      onReorder(newFeatures)
    }
  }

  if (features.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No features yet. Add one to get started.
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
        items={features.map(f => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {features.map(feature => (
            <SortableFeature
              key={feature.id}
              feature={feature}
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
