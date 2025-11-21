import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Eye,
  EyeOff,
  GripVertical,
  MoreVertical,
  RotateCcw,
  AlertCircle
} from 'lucide-react'
import { DndDepartmentItem, SectionId } from '../../../types/departmentAssignments'
import { CUSTOMIZATION_LIMITS } from '../../../types/organizationCustomization'

interface DraggableDepartmentCardProps {
  department: DndDepartmentItem
  isVisible: boolean
  customName: string
  customDescription: string
  onToggleVisibility: (deptId: string) => void
  onNameChange: (deptId: string, name: string) => void
  onDescriptionChange: (deptId: string, description: string) => void
  onReset: (deptId: string) => void
  onMoveToSection?: (deptId: string, sectionId: SectionId) => void
  availableSections?: Array<{ id: SectionId; name: string }>
  isDragging?: boolean
}

export const DraggableDepartmentCard: React.FC<DraggableDepartmentCardProps> = ({
  department,
  isVisible,
  customName,
  customDescription,
  onToggleVisibility,
  onNameChange,
  onDescriptionChange,
  onReset,
  onMoveToSection,
  availableSections = [],
  isDragging = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({ id: department.department_id })

  const [showMoveMenu, setShowMoveMenu] = React.useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1
  }

  const hasCustomization =
    (customName && customName !== department.defaultName) ||
    (customDescription && customDescription !== department.defaultDescription)

  const nameLength = customName.length
  const descLength = customDescription.length
  const nameTooLong = nameLength > CUSTOMIZATION_LIMITS.DEPARTMENT_NAME_MAX_LENGTH
  const descTooLong = descLength > CUSTOMIZATION_LIMITS.DEPARTMENT_DESCRIPTION_MAX_LENGTH
  const nameApproaching =
    nameLength >= CUSTOMIZATION_LIMITS.DEPARTMENT_NAME_MAX_LENGTH * 0.9 &&
    nameLength <= CUSTOMIZATION_LIMITS.DEPARTMENT_NAME_MAX_LENGTH
  const descApproaching =
    descLength >= CUSTOMIZATION_LIMITS.DEPARTMENT_DESCRIPTION_MAX_LENGTH * 0.9 &&
    descLength <= CUSTOMIZATION_LIMITS.DEPARTMENT_DESCRIPTION_MAX_LENGTH

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-gray-200 rounded-lg p-4 bg-white ${
        isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded transition-colors"
            title="Drag to reorder or move to another section"
          >
            <GripVertical className="h-5 w-5 text-gray-400" />
          </button>

          {/* Visibility Indicator */}
          <div className={`p-2 rounded-lg ${isVisible ? 'bg-green-100' : 'bg-gray-100'}`}>
            {isVisible ? (
              <Eye className="h-4 w-4 text-green-600" />
            ) : (
              <EyeOff className="h-4 w-4 text-gray-400" />
            )}
          </div>

          <div className="flex-1">
            <h4 className="font-medium text-gray-900">
              {department.defaultName}
              {hasCustomization && (
                <span className="ml-2 text-xs text-blue-600 font-normal">(customized)</span>
              )}
            </h4>
            <p className="text-sm text-gray-500">
              ID: {department.department_id} • Section: {department.section_id}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Move Menu */}
          {onMoveToSection && availableSections.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowMoveMenu(!showMoveMenu)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Move to section"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showMoveMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMoveMenu(false)}
                  />
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                      Move to Section
                    </div>
                    {availableSections.map(section => (
                      <button
                        key={section.id}
                        onClick={() => {
                          onMoveToSection(department.department_id, section.id)
                          setShowMoveMenu(false)
                        }}
                        disabled={section.id === department.section_id}
                        className={`w-full text-left px-3 py-2 text-sm ${
                          section.id === department.section_id
                            ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                        }`}
                      >
                        {section.name}
                        {section.id === department.section_id && (
                          <span className="ml-2 text-xs">(current)</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Reset Button */}
          {hasCustomization && (
            <button
              onClick={() => onReset(department.department_id)}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-100"
              title="Reset to default"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}

          {/* Visibility Toggle */}
          <button
            onClick={() => onToggleVisibility(department.department_id)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isVisible ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            title={isVisible ? 'Hide department' : 'Show department'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isVisible ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Custom Name Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Custom Name</label>
          <input
            type="text"
            value={customName}
            onChange={e => onNameChange(department.department_id, e.target.value)}
            placeholder={department.defaultName}
            maxLength={CUSTOMIZATION_LIMITS.DEPARTMENT_NAME_MAX_LENGTH}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              nameTooLong ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {customName
                ? 'Custom name will override the default'
                : 'Leave empty to use default name'}
            </p>
            <span
              className={`text-xs ${
                nameTooLong
                  ? 'text-red-600 font-medium'
                  : nameApproaching
                  ? 'text-yellow-600'
                  : 'text-gray-400'
              }`}
            >
              {nameLength}/{CUSTOMIZATION_LIMITS.DEPARTMENT_NAME_MAX_LENGTH}
            </span>
          </div>
          {nameTooLong && (
            <div className="flex items-start space-x-2 text-red-600 text-xs">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>Name exceeds maximum length</span>
            </div>
          )}
        </div>

        {/* Custom Description Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Custom Description</label>
          <textarea
            value={customDescription}
            onChange={e => onDescriptionChange(department.department_id, e.target.value)}
            placeholder={department.defaultDescription}
            maxLength={CUSTOMIZATION_LIMITS.DEPARTMENT_DESCRIPTION_MAX_LENGTH}
            rows={2}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
              descTooLong ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {customDescription
                ? 'Custom description will override the default'
                : 'Leave empty to use default description'}
            </p>
            <span
              className={`text-xs ${
                descTooLong
                  ? 'text-red-600 font-medium'
                  : descApproaching
                  ? 'text-yellow-600'
                  : 'text-gray-400'
              }`}
            >
              {descLength}/{CUSTOMIZATION_LIMITS.DEPARTMENT_DESCRIPTION_MAX_LENGTH}
            </span>
          </div>
          {descTooLong && (
            <div className="flex items-start space-x-2 text-red-600 text-xs">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>Description exceeds maximum length</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
