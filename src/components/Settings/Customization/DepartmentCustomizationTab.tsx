import React from 'react'
import { CustomizationDraft } from '../../../types/organizationCustomization'
import { Eye, EyeOff } from 'lucide-react'

interface DepartmentCustomizationTabProps {
  draft: CustomizationDraft
  updateDraft: (section: any, value: any) => void
}

const DepartmentCustomizationTab: React.FC<DepartmentCustomizationTabProps> = ({ draft, updateDraft }) => {
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

  const isVisible = (deptId: string) => {
    const dept = draft.department_config.departments?.find(d => d.id === deptId)
    return dept?.visible ?? true
  }

  const coreDepartments = [
    { id: 'human-resources', name: 'Human Resources', description: 'Staff records and management' },
    { id: 'finance-accounting', name: 'Finance & Accounting', description: 'Financial operations' },
    { id: 'donor-relations', name: 'Donor Relations', description: 'Donor management' },
    { id: 'it-technology', name: 'IT & Technology', description: 'Technology services' },
    { id: 'customer-support', name: 'Customer Support', description: 'Support services' }
  ]

  const additionalDepartments = [
    { id: 'marketing', name: 'Marketing', description: 'Marketing campaigns' },
    { id: 'legal-compliance', name: 'Legal & Compliance', description: 'Legal operations' },
    { id: 'procurement', name: 'Procurement', description: 'Vendor management' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Configuration</h2>
        <p className="text-sm text-gray-600 mb-6">
          Control which departments are visible in your organization's dashboard and navigation.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-md font-semibold text-gray-900 mb-3">Core Departments</h3>
          <div className="space-y-3">
            {coreDepartments.map((dept) => {
              const visible = isVisible(dept.id)
              return (
                <div key={dept.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${visible ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {visible ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{dept.name}</h4>
                        <p className="text-sm text-gray-500">{dept.description}</p>
                      </div>
                    </div>

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
              )
            })}
          </div>
        </div>

        <div>
          <h3 className="text-md font-semibold text-gray-900 mb-3">Additional Departments</h3>
          <div className="space-y-3">
            {additionalDepartments.map((dept) => {
              const visible = isVisible(dept.id)
              return (
                <div key={dept.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${visible ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {visible ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{dept.name}</h4>
                        <p className="text-sm text-gray-500">{dept.description}</p>
                      </div>
                    </div>

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
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">Department Management</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Disabled departments will be hidden from navigation and dashboard</li>
          <li>• Existing documents and data remain accessible</li>
          <li>• Changes take effect immediately after saving</li>
        </ul>
      </div>
    </div>
  )
}

export default DepartmentCustomizationTab
