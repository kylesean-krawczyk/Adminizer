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
import { DepartmentTool } from '../../../types/departmentLandingPage'
import { GripVertical, Edit, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react'

interface SortableToolProps {
  tool: DepartmentTool
  onEdit: (tool: DepartmentTool) => void
  onDelete: (id: string) => void
  onToggleVisibility: (id: string, isVisible: boolean) => void
}

function SortableTool({ tool, onEdit, onDelete, onToggleVisibility }: SortableToolProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: tool.id })

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
        <div className="flex items-center space-x-2">
          <h4 className="font-medium text-gray-900 truncate">{tool.tool_name}</h4>
          {tool.tool_url && (
            <ExternalLink className="h-3 w-3 text-gray-400" />
          )}
        </div>
        {tool.tool_description && (
          <p className="text-sm text-gray-600 truncate">{tool.tool_description}</p>
        )}
        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
          <span className="px-2 py-0.5 bg-gray-100 rounded">
            {tool.tool_type.replace('_', ' ')}
          </span>
          <span>Order: {tool.display_order}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onToggleVisibility(tool.id, !tool.is_visible)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          title={tool.is_visible ? 'Hide' : 'Show'}
        >
          {tool.is_visible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={() => onEdit(tool)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(tool.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

interface DraggableToolListProps {
  tools: DepartmentTool[]
  onReorder: (newTools: DepartmentTool[]) => void
  onEdit: (tool: DepartmentTool) => void
  onDelete: (id: string) => void
  onToggleVisibility: (id: string, isVisible: boolean) => void
}

export const DraggableToolList: React.FC<DraggableToolListProps> = ({
  tools,
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
      const oldIndex = tools.findIndex(t => t.id === active.id)
      const newIndex = tools.findIndex(t => t.id === over.id)

      const newTools = arrayMove(tools, oldIndex, newIndex).map((tool, index) => ({
        ...tool,
        display_order: index
      }))

      onReorder(newTools)
    }
  }

  if (tools.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No tools yet. Add one to get started.
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
        items={tools.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {tools.map(tool => (
            <SortableTool
              key={tool.id}
              tool={tool}
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
