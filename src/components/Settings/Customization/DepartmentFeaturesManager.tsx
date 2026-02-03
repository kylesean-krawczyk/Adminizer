import React, { useState, useEffect } from 'react'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { VerticalId } from '../../../config/types'
import { DepartmentFeature } from '../../../types/departmentLandingPage'
import { DraggableFeatureList } from './DraggableFeatureList'
import { FeatureEditor } from './FeatureEditor'
import {
  saveDepartmentFeature,
  deleteDepartmentFeature,
  reorderFeatures
} from '../../../services/departmentLandingService'

interface DepartmentFeaturesManagerProps {
  organizationId: string
  verticalId: VerticalId
  departmentId: string
  initialFeatures: DepartmentFeature[]
}

export const DepartmentFeaturesManager: React.FC<DepartmentFeaturesManagerProps> = ({
  organizationId,
  verticalId,
  departmentId,
  initialFeatures
}) => {
  const [features, setFeatures] = useState<DepartmentFeature[]>(initialFeatures)
  const [isExpanded, setIsExpanded] = useState(true)
  const [editingFeature, setEditingFeature] = useState<DepartmentFeature | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    setFeatures(initialFeatures)
  }, [initialFeatures])

  const handleReorder = async (newFeatures: DepartmentFeature[]) => {
    setFeatures(newFeatures)

    const updates = newFeatures.map((feature, index) => ({
      id: feature.id,
      display_order: index
    }))

    await reorderFeatures({
      organizationId,
      verticalId,
      departmentId,
      updates
    })
  }

  const handleEdit = (feature: DepartmentFeature) => {
    setEditingFeature(feature)
    setShowEditor(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this feature?')) {
      await deleteDepartmentFeature(id)
      setFeatures(features.filter(f => f.id !== id))
    }
  }

  const handleToggleVisibility = async (id: string, isVisible: boolean) => {
    const feature = features.find(f => f.id === id)
    if (!feature) return

    await saveDepartmentFeature({
      organizationId,
      verticalId,
      departmentId,
      title: feature.title,
      description: feature.description || undefined,
      displayOrder: feature.display_order,
      isVisible: !isVisible
    })

    setFeatures(features.map(f => f.id === id ? { ...f, is_visible: !isVisible } : f))
  }

  const handleSaveFeature = async (featureData: any) => {
    try {
      const saved = await saveDepartmentFeature({
        organizationId,
        verticalId,
        departmentId,
        title: featureData.title,
        description: featureData.description,
        displayOrder: editingFeature ? editingFeature.display_order : features.length,
        isVisible: true
      })

      if (editingFeature) {
        setFeatures(features.map(f => f.id === editingFeature.id ? saved : f))
      } else {
        setFeatures([...features, saved])
      }

      setShowEditor(false)
      setEditingFeature(null)
    } catch (error) {
      console.error('Error saving feature:', error)
      alert('Failed to save feature')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <h5 className="font-semibold text-gray-900">Department Features</h5>
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
            {features.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setEditingFeature(null)
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
          <DraggableFeatureList
            features={features}
            onReorder={handleReorder}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleVisibility={handleToggleVisibility}
          />
        </div>
      )}

      {showEditor && (
        <FeatureEditor
          feature={editingFeature || undefined}
          existingOrders={features.map(f => f.display_order)}
          onSave={handleSaveFeature}
          onCancel={() => {
            setShowEditor(false)
            setEditingFeature(null)
          }}
        />
      )}
    </div>
  )
}

export default DepartmentFeaturesManager
