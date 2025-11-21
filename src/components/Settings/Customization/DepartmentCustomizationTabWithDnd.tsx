import React, { useState, useCallback, useMemo } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  FileText,
  Building2,
  Cog,
  Shield,
  RotateCcw,
  Undo2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { CustomizationDraft } from '../../../types/organizationCustomization'
import { SectionId } from '../../../types/departmentAssignments'
import { useDepartmentDragDrop } from '../../../hooks/useDepartmentDragDrop'
import { useDepartmentRealtimeSync } from '../../../hooks/useDepartmentRealtimeSync'
import { useUserManagement } from '../../../hooks'
import { SectionDropzone } from './SectionDropzone'

interface DepartmentCustomizationTabProps {
  draft: CustomizationDraft
  updateDraft: (section: any, value: any) => void
}

const SECTION_CONFIG = [
  { id: 'documents' as SectionId, name: 'Document Center', icon: FileText },
  { id: 'departments' as SectionId, name: 'Core Ministries', icon: Building2 },
  { id: 'operations' as SectionId, name: 'Operations Center', icon: Cog },
  { id: 'admin' as SectionId, name: 'Admin', icon: Shield }
]

const DepartmentCustomizationTabWithDnd: React.FC<DepartmentCustomizationTabProps> = ({
  draft,
  updateDraft
}) => {
  const { userProfile } = useUserManagement()
  const organizationId = userProfile?.organization_id || ''
  const verticalId = (userProfile?.active_vertical || 'church') as any

  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState<SectionId | null>(null)

  // Drag and drop hook
  const {
    sections,
    dndItems,
    activeId,
    undoStack,
    loading,
    saving,
    useFallbackMode,
    migrationWarning,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    moveToSection,
    undoLastMove,
    resetToDefaults,
    toggleVisibility,
    reloadAssignments,
    retryAfterMigration
  } = useDepartmentDragDrop({
    organizationId,
    verticalId,
    onSuccess: message => {
      setSuccessMessage(message)
      setTimeout(() => setSuccessMessage(null), 5000)
    },
    onError: error => {
      setErrorMessage(error)
      setTimeout(() => setErrorMessage(null), 5000)
    }
  })

  // Real-time sync
  useDepartmentRealtimeSync({
    organizationId,
    verticalId,
    onUpdate: () => {
      console.log('[DepartmentCustomizationTab] Real-time update received')
      reloadAssignments()
    },
    enabled: !!organizationId && !!verticalId
  })

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8 // 8px of movement required before drag starts
      }
    })
  )

  // Handlers
  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      const departmentId = event.active.id as string
      handleDragStart(departmentId)
    },
    [handleDragStart]
  )

  const onDragOver = useCallback(
    (event: DragOverEvent) => {
      const overId = event.over?.id as string | null
      handleDragOver(overId)

      // Update visual indicator
      if (overId && SECTION_CONFIG.some(s => s.id === overId)) {
        setIsDraggingOver(overId as SectionId)
      } else {
        setIsDraggingOver(null)
      }
    },
    [handleDragOver]
  )

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      setIsDraggingOver(null)

      const departmentId = event.active.id as string
      const overId = event.over?.id

      if (!overId) {
        handleDragCancel()
        return
      }

      // Determine target section
      let targetSectionId: SectionId | null = null
      let targetPosition = 0

      // Check if dropped on a section
      if (SECTION_CONFIG.some(s => s.id === overId)) {
        targetSectionId = overId as SectionId
        // Place at end of section
        targetPosition = sections[targetSectionId]?.length || 0
      } else {
        // Dropped on another department - insert before it
        const targetDept = dndItems.find(d => d.department_id === overId)
        if (targetDept) {
          targetSectionId = targetDept.section_id
          targetPosition = targetDept.display_order
        }
      }

      if (targetSectionId) {
        handleDragEnd(departmentId, targetSectionId, targetPosition)
      } else {
        handleDragCancel()
      }
    },
    [sections, dndItems, handleDragEnd, handleDragCancel]
  )

  // Keep the existing draft-based handlers for backward compatibility
  const handleToggleVisibility = useCallback(
    (deptId: string) => {
      toggleVisibility(deptId)

      // Also update draft
      const departments = draft.department_config.departments || []
      const existingDept = departments.find(d => d.id === deptId)

      if (existingDept) {
        updateDraft('department_config', {
          ...draft.department_config,
          departments: departments.map(d =>
            d.id === deptId ? { ...d, visible: !(d.visible ?? true) } : d
          )
        })
      } else {
        updateDraft('department_config', {
          ...draft.department_config,
          departments: [...departments, { id: deptId, visible: false }]
        })
      }
    },
    [draft, updateDraft, toggleVisibility]
  )

  const handleNameChange = useCallback(
    (deptId: string, newName: string) => {
      const departments = draft.department_config.departments || []
      const existingDept = departments.find(d => d.id === deptId)

      if (existingDept) {
        updateDraft('department_config', {
          ...draft.department_config,
          departments: departments.map(d =>
            d.id === deptId ? { ...d, name: newName } : d
          )
        })
      } else {
        updateDraft('department_config', {
          ...draft.department_config,
          departments: [...departments, { id: deptId, name: newName }]
        })
      }
    },
    [draft, updateDraft]
  )

  const handleDescriptionChange = useCallback(
    (deptId: string, newDescription: string) => {
      const departments = draft.department_config.departments || []
      const existingDept = departments.find(d => d.id === deptId)

      if (existingDept) {
        updateDraft('department_config', {
          ...draft.department_config,
          departments: departments.map(d =>
            d.id === deptId ? { ...d, description: newDescription } : d
          )
        })
      } else {
        updateDraft('department_config', {
          ...draft.department_config,
          departments: [...departments, { id: deptId, description: newDescription }]
        })
      }
    },
    [draft, updateDraft]
  )

  const handleResetDepartment = useCallback(
    (deptId: string) => {
      const departments = draft.department_config.departments || []
      const existingDept = departments.find(d => d.id === deptId)

      if (existingDept) {
        const updatedDept = { ...existingDept }
        delete updatedDept.name
        delete updatedDept.description

        updateDraft('department_config', {
          ...draft.department_config,
          departments: departments.map(d => (d.id === deptId ? updatedDept : d))
        })
      }
    },
    [draft, updateDraft]
  )

  const getCustomName = useCallback(
    (deptId: string) => {
      const dept = draft.department_config.departments?.find(d => d.id === deptId)
      return dept?.name || ''
    },
    [draft]
  )

  const getCustomDescription = useCallback(
    (deptId: string) => {
      const dept = draft.department_config.departments?.find(d => d.id === deptId)
      return dept?.description || ''
    },
    [draft]
  )

  const isVisible = useCallback(
    (deptId: string) => {
      const dept = draft.department_config.departments?.find(d => d.id === deptId)
      return dept?.visible ?? true
    },
    [draft]
  )

  // Active department being dragged
  const activeDepartment = useMemo(() => {
    if (!activeId) return null
    return dndItems.find(d => d.department_id === activeId)
  }, [activeId, dndItems])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-600">Loading department assignments...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Migration Warning Banner */}
      {useFallbackMode && migrationWarning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Database Table Missing
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>{migrationWarning}</p>
                <p className="mt-2">
                  The <code className="bg-yellow-100 px-1 py-0.5 rounded font-mono text-xs">department_section_assignments</code> table was not found.
                  {sessionStorage.getItem(`dept_table_missing_${organizationId}_${verticalId}`)
                    ? ' If the migration was just applied, click "Check Again" to verify.'
                    : ' Please run the database migration or contact your administrator.'}
                </p>
              </div>
              <div className="mt-4 flex items-center space-x-3">
                <button
                  onClick={retryAfterMigration}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-yellow-800 bg-yellow-100 hover:bg-yellow-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Checking...' : 'Check Again'}
                </button>
                <button
                  onClick={() => {
                    sessionStorage.removeItem(`dept_table_missing_${organizationId}_${verticalId}`)
                    window.location.reload()
                  }}
                  className="text-sm text-yellow-700 hover:text-yellow-900 underline"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Department Configuration {useFallbackMode ? '(Read-Only Mode)' : '(Drag & Drop)'}
          </h2>
          <p className="text-sm text-gray-600">
            {useFallbackMode
              ? 'Viewing default department layout. Drag-and-drop is disabled until migration is applied.'
              : 'Drag departments to reorder or move between sections. Changes are saved automatically.'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {!useFallbackMode && undoStack.length > 0 && (
            <button
              onClick={undoLastMove}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <Undo2 className="h-4 w-4" />
              <span>Undo Last Move</span>
            </button>
          )}
          {!useFallbackMode && (
            <button
              onClick={resetToDefaults}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset to Defaults</span>
            </button>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-sm text-green-800">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-sm text-red-800">{errorMessage}</span>
        </div>
      )}

      {/* Saving Indicator */}
      {saving && (
        <div className="flex items-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
          <span className="text-sm text-blue-800">Saving changes...</span>
        </div>
      )}

      {/* Drag and Drop Context (disabled in fallback mode) */}
      {useFallbackMode ? (
        /* Fallback Mode - No Drag & Drop */
        <div className="space-y-8">
          {SECTION_CONFIG.map(section => {
            const SectionIcon = section.icon
            return (
              <SectionDropzone
                key={section.id}
                sectionId={section.id}
                sectionName={section.name}
                sectionIcon={<SectionIcon className="h-5 w-5 text-gray-600" />}
                departments={sections[section.id] || []}
                isOver={false}
                onToggleVisibility={handleToggleVisibility}
                onNameChange={handleNameChange}
                onDescriptionChange={handleDescriptionChange}
                onReset={handleResetDepartment}
                onMoveToSection={undefined}
                availableSections={[]}
                getCustomName={getCustomName}
                getCustomDescription={getCustomDescription}
                isVisible={isVisible}
              />
            )
          })}
        </div>
      ) : (
        /* Normal Mode - Full Drag & Drop */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={handleDragCancel}
        >
          {/* Sections */}
          <div className="space-y-8">
            {SECTION_CONFIG.map(section => {
              const SectionIcon = section.icon
              return (
                <SectionDropzone
                  key={section.id}
                  sectionId={section.id}
                  sectionName={section.name}
                  sectionIcon={<SectionIcon className="h-5 w-5 text-gray-600" />}
                  departments={sections[section.id] || []}
                  isOver={isDraggingOver === section.id}
                  onToggleVisibility={handleToggleVisibility}
                  onNameChange={handleNameChange}
                  onDescriptionChange={handleDescriptionChange}
                  onReset={handleResetDepartment}
                  onMoveToSection={moveToSection}
                  availableSections={SECTION_CONFIG}
                  getCustomName={getCustomName}
                  getCustomDescription={getCustomDescription}
                  isVisible={isVisible}
                />
              )
            })}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeDepartment ? (
              <div className="bg-white border-2 border-blue-500 rounded-lg p-4 shadow-lg opacity-90">
                <h4 className="font-medium text-gray-900">
                  {activeDepartment.custom_name || activeDepartment.defaultName}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {activeDepartment.custom_description || activeDepartment.defaultDescription}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Info Banner */}
      <div className={`rounded-lg p-4 border ${useFallbackMode ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
        <p className={`text-sm ${useFallbackMode ? 'text-gray-700' : 'text-blue-800'}`}>
          {useFallbackMode ? (
            <>
              <strong>Note:</strong> You are viewing the default department layout. Name and description
              customization is still available, but drag-and-drop functionality requires a database migration.
              Please refresh this page after the migration is applied.
            </>
          ) : (
            <>
              <strong>Tip:</strong> Drag the grip handle to move departments between sections or
              reorder within a section. Use the three-dot menu for keyboard-accessible moving. Changes
              are saved automatically and sync across all admin sessions in real-time.
            </>
          )}
        </p>
      </div>
    </div>
  )
}

export default DepartmentCustomizationTabWithDnd
