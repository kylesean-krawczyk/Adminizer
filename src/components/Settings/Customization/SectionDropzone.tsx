import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { SectionId, DndDepartmentItem } from '../../../types/departmentAssignments'
import { DraggableDepartmentCard } from './DraggableDepartmentCard'

interface SectionDropzoneProps {
  sectionId: SectionId
  sectionName: string
  sectionIcon?: React.ReactNode
  departments: DndDepartmentItem[]
  isOver?: boolean
  onToggleVisibility: (deptId: string) => void
  onNameChange: (deptId: string, name: string) => void
  onDescriptionChange: (deptId: string, description: string) => void
  onReset: (deptId: string) => void
  onMoveToSection?: (deptId: string, sectionId: SectionId) => void
  availableSections?: Array<{ id: SectionId; name: string }>
  getCustomName: (deptId: string) => string
  getCustomDescription: (deptId: string) => string
  isVisible: (deptId: string) => boolean
}

export const SectionDropzone: React.FC<SectionDropzoneProps> = ({
  sectionId,
  sectionName,
  sectionIcon,
  departments,
  isOver,
  onToggleVisibility,
  onNameChange,
  onDescriptionChange,
  onReset,
  onMoveToSection,
  availableSections,
  getCustomName,
  getCustomDescription,
  isVisible
}) => {
  const { setNodeRef } = useDroppable({
    id: sectionId
  })

  const departmentIds = departments.map(d => d.department_id)

  return (
    <div ref={setNodeRef} className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {sectionIcon}
          <h3 className="text-md font-semibold text-gray-900">{sectionName}</h3>
          <span className="text-sm text-gray-500">({departments.length})</span>
        </div>
      </div>

      {/* Drop Indicator */}
      {isOver && (
        <div className="border-2 border-dashed border-blue-500 bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-600 font-medium">Drop here to move to {sectionName}</p>
        </div>
      )}

      {/* Departments List */}
      <div
        className={`space-y-4 min-h-[100px] rounded-lg transition-colors ${
          isOver ? 'bg-blue-50 border-2 border-dashed border-blue-400 p-4' : ''
        }`}
      >
        <SortableContext items={departmentIds} strategy={verticalListSortingStrategy}>
          {departments.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-sm">No departments in this section</p>
              <p className="text-xs mt-1">Drag departments here</p>
            </div>
          ) : (
            departments.map(dept => (
              <DraggableDepartmentCard
                key={dept.department_id}
                department={dept}
                isVisible={isVisible(dept.department_id)}
                customName={getCustomName(dept.department_id)}
                customDescription={getCustomDescription(dept.department_id)}
                onToggleVisibility={onToggleVisibility}
                onNameChange={onNameChange}
                onDescriptionChange={onDescriptionChange}
                onReset={onReset}
                onMoveToSection={onMoveToSection}
                availableSections={availableSections}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}
