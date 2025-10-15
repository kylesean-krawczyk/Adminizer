import React from 'react'
import { X, Save, Eye, EyeOff, RotateCcw } from 'lucide-react'
import { useDepartmentSettings } from '../../hooks/useDepartmentSettings'

interface DepartmentVisibilityModalProps {
  isOpen: boolean
  onClose: () => void
}

const DepartmentVisibilityModal: React.FC<DepartmentVisibilityModalProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    settings, 
    updateDepartmentVisibility, 
    resetToDefaults 
  } = useDepartmentSettings()

  const moreDepartments = [
    {
      id: 'marketing',
      name: 'Marketing',
      description: 'Campaigns, content, analytics, lead generation'
    },
    {
      id: 'it-technology',
      name: 'IT & Technology',
      description: 'Asset management, helpdesk, software licenses, security'
    },
    {
      id: 'legal-compliance',
      name: 'Legal & Compliance',
      description: 'Contracts, policies, regulatory compliance, risk management'
    },
    {
      id: 'procurement',
      name: 'Procurement',
      description: 'Vendors, purchase orders, supplier management'
    },
    {
      id: 'project-management',
      name: 'Project Management',
      description: 'Projects, tasks, timelines, resource allocation'
    },
    {
      id: 'research-development',
      name: 'Research & Development',
      description: 'Innovation tracking, product development, testing'
    },
    {
      id: 'quality-assurance',
      name: 'Quality Assurance',
      description: 'Quality control, audits, standards compliance'
    }
  ]

  const handleToggle = (departmentId: string) => {
    const currentVisibility = settings[departmentId] !== false
    updateDepartmentVisibility(departmentId, !currentVisibility)
  }

  const handleReset = () => {
    if (window.confirm('Reset all departments to default visibility? This will make all departments visible.')) {
      resetToDefaults()
    }
  }

  const handleSave = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Department Visibility</h2>
              <p className="text-sm text-gray-600 mt-1">
                Control which departments are visible to your organization
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Core Departments</h3>
                <p className="text-sm text-blue-800">
                  Core departments (Human Resources, Finance & Accounting, Sales, Operations, Customer Support) 
                  are always visible and cannot be disabled.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Departments</h3>
                <div className="space-y-3">
                  {moreDepartments.map((dept) => {
                    const isVisible = settings[dept.id] !== false
                    return (
                      <div key={dept.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${
                                isVisible ? 'bg-green-100' : 'bg-gray-100'
                              }`}>
                                {isVisible ? (
                                  <Eye className="h-4 w-4 text-green-600" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{dept.name}</h4>
                                <p className="text-sm text-gray-600">{dept.description}</p>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleToggle(dept.id)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              isVisible ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                isVisible ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h4 className="text-sm font-medium text-yellow-900 mb-2">Department Management</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Disabled departments will be hidden from navigation and dashboard</li>
                  <li>• Existing documents and data remain accessible</li>
                  <li>• Changes take effect immediately</li>
                  <li>• Only administrators can modify department visibility</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset to Defaults</span>
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DepartmentVisibilityModal