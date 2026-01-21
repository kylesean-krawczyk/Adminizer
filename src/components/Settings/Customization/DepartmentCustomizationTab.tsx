import React, { useEffect, useMemo } from 'react'
import { CustomizationDraft, CUSTOMIZATION_LIMITS } from '../../../types/organizationCustomization'
import { Eye, EyeOff, RotateCcw, AlertCircle } from 'lucide-react'
import { useVertical } from '../../../contexts/VerticalContext'

interface DepartmentCustomizationTabProps {
  draft: CustomizationDraft
  updateDraft: (section: any, value: any) => void
}

const DepartmentCustomizationTab: React.FC<DepartmentCustomizationTabProps> = ({ draft, updateDraft }) => {
  const { vertical } = useVertical()

  const handleToggleVisibility = (deptId: string) => {
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
  }

  const handleNameChange = (deptId: string, newName: string) => {
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
  }

  const handleDescriptionChange = (deptId: string, newDescription: string) => {
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
  }

  const handleResetDepartment = (deptId: string) => {
    const departments = draft.department_config.departments || []
    const existingDept = departments.find(d => d.id === deptId)

    if (existingDept) {
      const updatedDept = { ...existingDept }
      delete updatedDept.name
      delete updatedDept.description

      updateDraft('department_config', {
        ...draft.department_config,
        departments: departments.map(d => d.id === deptId ? updatedDept : d)
      })
    }
  }

  const handleResetAllDepartments = () => {
    if (window.confirm('Are you sure you want to reset all department names and descriptions to their defaults?')) {
      const departments = draft.department_config.departments || []
      updateDraft('department_config', {
        ...draft.department_config,
        departments: departments.map(d => {
          const updated = { ...d }
          delete updated.name
          delete updated.description
          return updated
        })
      })
    }
  }

  const isVisible = (deptId: string) => {
    const dept = draft.department_config.departments?.find(d => d.id === deptId)
    return dept?.visible ?? true
  }

  const getCustomName = (deptId: string) => {
    const dept = draft.department_config.departments?.find(d => d.id === deptId)
    return dept?.name || ''
  }

  const getCustomDescription = (deptId: string) => {
    const dept = draft.department_config.departments?.find(d => d.id === deptId)
    return dept?.description || ''
  }

  const hasCustomization = (deptId: string) => {
    const dept = draft.department_config.departments?.find(d => d.id === deptId)
    return !!(dept?.name || dept?.description)
  }

  const coreDepartments = useMemo(() => {
    return vertical.dashboardConfig.coreDepartments.map(dept => ({
      id: dept.id,
      name: dept.name,
      description: dept.description
    }))
  }, [vertical.dashboardConfig.coreDepartments])

  const additionalDepartments = useMemo(() => {
    return vertical.dashboardConfig.additionalDepartments.map(dept => ({
      id: dept.id,
      name: dept.name,
      description: dept.description
    }))
  }, [vertical.dashboardConfig.additionalDepartments])

  useEffect(() => {
    console.log('[DepartmentCustomizationTab] Core departments loaded:', coreDepartments.map(d => ({ id: d.id, name: d.name })))
    console.log('[DepartmentCustomizationTab] Additional departments loaded:', additionalDepartments.map(d => ({ id: d.id, name: d.name })))
    console.log('[DepartmentCustomizationTab] Total departments available for customization:', coreDepartments.length + additionalDepartments.length)
  }, [coreDepartments, additionalDepartments])

  const getDisplayName = (dept: typeof coreDepartments[0]) => {
    const customName = getCustomName(dept.id)
    return customName || dept.name
  }

  const getDisplayDescription = (dept: typeof coreDepartments[0]) => {
    const customDescription = getCustomDescription(dept.id)
    return customDescription || dept.description
  }

  const getNameLength = (deptId: string) => {
    return getCustomName(deptId).length
  }

  const getDescriptionLength = (deptId: string) => {
    return getCustomDescription(deptId).length
  }

  const isNameTooLong = (deptId: string) => {
    return getNameLength(deptId) > CUSTOMIZATION_LIMITS.DEPARTMENT_NAME_MAX_LENGTH
  }

  const isDescriptionTooLong = (deptId: string) => {
    return getDescriptionLength(deptId) > CUSTOMIZATION_LIMITS.DEPARTMENT_DESCRIPTION_MAX_LENGTH
  }

  const isNameApproachingLimit = (deptId: string) => {
    const length = getNameLength(deptId)
    const limit = CUSTOMIZATION_LIMITS.DEPARTMENT_NAME_MAX_LENGTH
    return length >= limit * 0.9 && length <= limit
  }

  const isDescriptionApproachingLimit = (deptId: string) => {
    const length = getDescriptionLength(deptId)
    const limit = CUSTOMIZATION_LIMITS.DEPARTMENT_DESCRIPTION_MAX_LENGTH
    return length >= limit * 0.9 && length <= limit
  }

  const renderDepartmentCard = (dept: typeof coreDepartments[0]) => {
    const visible = isVisible(dept.id)
    const customName = getCustomName(dept.id)
    const customDescription = getCustomDescription(dept.id)
    const hasCustom = hasCustomization(dept.id)
    const nameLength = getNameLength(dept.id)
    const descLength = getDescriptionLength(dept.id)
    const nameTooLong = isNameTooLong(dept.id)
    const descTooLong = isDescriptionTooLong(dept.id)
    const nameApproaching = isNameApproachingLimit(dept.id)
    const descApproaching = isDescriptionApproachingLimit(dept.id)

    return (
      <div key={dept.id} className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${visible ? 'bg-green-100' : 'bg-gray-100'}`}>
              {visible ? (
                <Eye className="h-4 w-4 text-green-600" />
              ) : (
                <EyeOff className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                {dept.name}
                {hasCustom && (
                  <span className="ml-2 text-xs text-blue-600 font-normal">(customized)</span>
                )}
              </h4>
              <p className="text-sm text-gray-500">ID: {dept.id}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {hasCustom && (
              <button
                onClick={() => handleResetDepartment(dept.id)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-100"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
            <button
              onClick={() => handleToggleVisibility(dept.id)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                visible ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  visible ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Custom Name
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => handleNameChange(dept.id, e.target.value)}
              placeholder={dept.name}
              maxLength={CUSTOMIZATION_LIMITS.DEPARTMENT_NAME_MAX_LENGTH}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                nameTooLong ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {customName ? 'Custom name will override the default' : 'Leave empty to use default name'}
              </p>
              <span className={`text-xs ${
                nameTooLong ? 'text-red-600 font-medium' :
                nameApproaching ? 'text-yellow-600' :
                'text-gray-400'
              }`}>
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

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Custom Description
            </label>
            <textarea
              value={customDescription}
              onChange={(e) => handleDescriptionChange(dept.id, e.target.value)}
              placeholder={dept.description}
              maxLength={CUSTOMIZATION_LIMITS.DEPARTMENT_DESCRIPTION_MAX_LENGTH}
              rows={2}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                descTooLong ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {customDescription ? 'Custom description will override the default' : 'Leave empty to use default description'}
              </p>
              <span className={`text-xs ${
                descTooLong ? 'text-red-600 font-medium' :
                descApproaching ? 'text-yellow-600' :
                'text-gray-400'
              }`}>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Department Configuration</h2>
          <p className="text-sm text-gray-600">
            Customize the names, descriptions, and visibility of departments in your dashboard.
          </p>
        </div>
        <button
          onClick={handleResetAllDepartments}
          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset All</span>
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-md font-semibold text-gray-900 mb-3">Core Departments</h3>
          <div className="space-y-4">
            {coreDepartments.map(dept => renderDepartmentCard(dept))}
          </div>
        </div>

        <div>
          <h3 className="text-md font-semibold text-gray-900 mb-3">Additional Departments</h3>
          <div className="space-y-4">
            {additionalDepartments.map(dept => renderDepartmentCard(dept))}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Preview</h3>
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Core Departments</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {coreDepartments.filter(dept => isVisible(dept.id)).map((dept) => {
                  const displayName = getDisplayName(dept)
                  const displayDescription = getDisplayDescription(dept)
                  return (
                    <div key={dept.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                      <h5 className="font-semibold text-gray-900 mb-1">{displayName}</h5>
                      <p className="text-sm text-gray-600">{displayDescription}</p>
                    </div>
                  )
                })}
              </div>
              {coreDepartments.filter(dept => isVisible(dept.id)).length === 0 && (
                <div className="text-center text-gray-500 py-4 text-sm">
                  No visible core departments
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Additional Departments</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {additionalDepartments.filter(dept => isVisible(dept.id)).map((dept) => {
                  const displayName = getDisplayName(dept)
                  const displayDescription = getDisplayDescription(dept)
                  return (
                    <div key={dept.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                      <h5 className="font-semibold text-gray-900 mb-1">{displayName}</h5>
                      <p className="text-sm text-gray-600">{displayDescription}</p>
                    </div>
                  )
                })}
              </div>
              {additionalDepartments.filter(dept => isVisible(dept.id)).length === 0 && (
                <div className="text-center text-gray-500 py-4 text-sm">
                  No visible additional departments
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <p className="text-sm text-blue-800">
          Changes to department names, descriptions, and visibility will take effect immediately after saving.
          Custom values will override the default department information on your dashboard.
        </p>
      </div>
    </div>
  )
}

export default DepartmentCustomizationTab
