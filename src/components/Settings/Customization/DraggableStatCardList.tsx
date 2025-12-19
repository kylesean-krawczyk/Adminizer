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
import { StatCard } from '../../../types/departmentLandingPage'
import { GripVertical, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import * as Icons from 'lucide-react'

interface SortableStatCardProps {
  card: StatCard
  onEdit: (card: StatCard) => void
  onDelete: (id: string) => void
  onToggleVisibility: (id: string, isVisible: boolean) => void
}

function SortableStatCard({ card, onEdit, onDelete, onToggleVisibility }: SortableStatCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName]
    return IconComponent ? <IconComponent className="h-5 w-5" /> : null
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
          <div className="p-2 bg-blue-100 rounded-lg">
            {getIconComponent(card.icon_name)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">{card.label}</h4>
            <p className="text-xs text-gray-500">
              Type: {card.metric_type} • Order: {card.display_order}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onToggleVisibility(card.id, !card.is_visible)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          title={card.is_visible ? 'Hide' : 'Show'}
        >
          {card.is_visible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={() => onEdit(card)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(card.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

interface DraggableStatCardListProps {
  cards: StatCard[]
  onReorder: (newCards: StatCard[]) => void
  onEdit: (card: StatCard) => void
  onDelete: (id: string) => void
  onToggleVisibility: (id: string, isVisible: boolean) => void
}

export const DraggableStatCardList: React.FC<DraggableStatCardListProps> = ({
  cards,
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
      const oldIndex = cards.findIndex(c => c.id === active.id)
      const newIndex = cards.findIndex(c => c.id === over.id)

      const newCards = arrayMove(cards, oldIndex, newIndex).map((card, index) => ({
        ...card,
        display_order: index
      }))

      onReorder(newCards)
    }
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No stat cards yet. Add one to get started.
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
        items={cards.map(c => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {cards.map(card => (
            <SortableStatCard
              key={card.id}
              card={card}
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
