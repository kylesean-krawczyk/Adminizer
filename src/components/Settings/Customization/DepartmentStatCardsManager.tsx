import React, { useState, useEffect } from 'react'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { VerticalId } from '../../../config/types'
import { StatCard } from '../../../types/departmentLandingPage'
import { DraggableStatCardList } from './DraggableStatCardList'
import { StatCardEditor } from './StatCardEditor'
import {
  saveStatCard,
  deleteStatCard,
  reorderStatCards
} from '../../../services/departmentLandingService'

interface DepartmentStatCardsManagerProps {
  organizationId: string
  verticalId: VerticalId
  departmentId: string
  initialCards: StatCard[]
}

export const DepartmentStatCardsManager: React.FC<DepartmentStatCardsManagerProps> = ({
  organizationId,
  verticalId,
  departmentId,
  initialCards
}) => {
  const [cards, setCards] = useState<StatCard[]>(initialCards)
  const [isExpanded, setIsExpanded] = useState(true)
  const [editingCard, setEditingCard] = useState<StatCard | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    setCards(initialCards)
  }, [initialCards])

  const handleReorder = async (newCards: StatCard[]) => {
    setCards(newCards)

    const updates = newCards.map((card, index) => ({
      id: card.id,
      display_order: index
    }))

    await reorderStatCards({
      organizationId,
      verticalId,
      departmentId,
      updates
    })
  }

  const handleEdit = (card: StatCard) => {
    setEditingCard(card)
    setShowEditor(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this stat card?')) {
      await deleteStatCard(id)
      setCards(cards.filter(c => c.id !== id))
    }
  }

  const handleToggleVisibility = async (id: string, isVisible: boolean) => {
    const card = cards.find(c => c.id === id)
    if (!card) return

    await saveStatCard({
      organizationId,
      verticalId,
      departmentId,
      label: card.label,
      iconName: card.icon_name,
      metricType: card.metric_type,
      displayOrder: card.display_order,
      isVisible: !isVisible
    })

    setCards(cards.map(c => c.id === id ? { ...c, is_visible: !isVisible } : c))
  }

  const handleSaveCard = async (cardData: any) => {
    try {
      const saved = await saveStatCard({
        organizationId,
        verticalId,
        departmentId,
        label: cardData.label,
        iconName: cardData.iconName,
        metricType: cardData.metricType,
        displayOrder: editingCard ? editingCard.display_order : cards.length,
        isVisible: true
      })

      if (editingCard) {
        setCards(cards.map(c => c.id === editingCard.id ? saved : c))
      } else {
        setCards([...cards, saved])
      }

      setShowEditor(false)
      setEditingCard(null)
    } catch (error) {
      console.error('Error saving stat card:', error)
      alert('Failed to save stat card')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <h5 className="font-semibold text-gray-900">Statistics Cards</h5>
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
            {cards.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setEditingCard(null)
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
          <DraggableStatCardList
            cards={cards}
            onReorder={handleReorder}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleVisibility={handleToggleVisibility}
          />
        </div>
      )}

      {showEditor && (
        <StatCardEditor
          card={editingCard || undefined}
          existingOrders={cards.map(c => c.display_order)}
          onSave={handleSaveCard}
          onCancel={() => {
            setShowEditor(false)
            setEditingCard(null)
          }}
        />
      )}
    </div>
  )
}

export default DepartmentStatCardsManager
