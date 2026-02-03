import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { useVertical } from '../../../contexts/VerticalContext'
import { getDepartmentAssignments } from '../../../services/departmentAssignmentService'
import { loadDepartmentCustomizationBundle } from '../../../services/departmentSyncService'
import { DepartmentSectionAssignment } from '../../../types/departmentAssignments'
import DepartmentBasicSettingsPanel from './DepartmentBasicSettingsPanel'
import { DepartmentStatCardsManager } from './DepartmentStatCardsManager'
import { DepartmentFeaturesManager } from './DepartmentFeaturesManager'
import { DepartmentToolsManager } from './DepartmentToolsManager'
import { DepartmentIntegrationsManager } from './DepartmentIntegrationsManager'
import { DepartmentQuickActionsManager } from './DepartmentQuickActionsManager'

interface DepartmentCustomizationData {
  assignment: DepartmentSectionAssignment | null
  statCards: any[]
  features: any[]
  tools: any[]
  integrations: any[]
  quickActions: any[]
}

const DepartmentMasterCustomizationTab: React.FC = () => {
  const { user } = useAuth()
  const { vertical } = useVertical()
  const currentVertical = vertical?.id
  const [departments, setDepartments] = useState<DepartmentSectionAssignment[]>([])
  const [expandedDepartment, setExpandedDepartment] = useState<string | null>(null)
  const [departmentData, setDepartmentData] = useState<Record<string, DepartmentCustomizationData>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadDepartments()
  }, [user?.organizationId, currentVertical])

  const loadDepartments = async () => {
    if (!user?.organizationId || !currentVertical) return

    try {
      setLoading(true)
      setError(null)
      const assignments = await getDepartmentAssignments(user.organizationId, currentVertical)
      setDepartments(assignments)
    } catch (err) {
      console.error('Error loading departments:', err)
      setError('Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  const loadDepartmentData = async (departmentId: string) => {
    if (!user?.organizationId || !currentVertical) return

    try {
      const data = await loadDepartmentCustomizationBundle(
        user.organizationId,
        currentVertical,
        departmentId
      )

      setDepartmentData(prev => ({
        ...prev,
        [departmentId]: data
      }))
    } catch (err) {
      console.error('Error loading department data:', err)
    }
  }

  const handleDepartmentToggle = (departmentId: string) => {
    if (expandedDepartment === departmentId) {
      setExpandedDepartment(null)
    } else {
      setExpandedDepartment(departmentId)
      if (!departmentData[departmentId]) {
        loadDepartmentData(departmentId)
      }
    }
  }

  const handleRefreshDepartment = async (departmentId: string) => {
    await loadDepartmentData(departmentId)
  }

  const calculateCompleteness = (dept: DepartmentSectionAssignment): number => {
    let completed = 0
    let total = 5

    if (dept.custom_name) completed++
    if (dept.custom_description) completed++
    if (dept.icon_name || dept.emoji) completed++
    if (dept.color_theme) completed++
    if (dept.is_visible !== false) completed++

    const data = departmentData[dept.department_id]
    if (data) {
      if (data.statCards.length > 0) completed += 1
      if (data.features.length > 0) completed += 1
      if (data.tools.length > 0) completed += 1
      total += 3
    }

    return Math.round((completed / total) * 100)
  }

  const getStatusColor = (completeness: number): string => {
    if (completeness >= 80) return 'text-green-600'
    if (completeness >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusIcon = (completeness: number) => {
    if (completeness >= 80) return <CheckCircle className="w-4 h-4 text-green-600" />
    return <AlertCircle className="w-4 h-4 text-yellow-600" />
  }

  const filteredDepartments = departments.filter(dept => {
    const displayName = dept.custom_name || dept.display_name || dept.department_id
    return displayName.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={loadDepartments}
          className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Department Customization</h3>
            <p className="text-sm text-gray-600 mt-1">
              Customize each department's appearance, features, and content
            </p>
          </div>
          <button
            onClick={loadDepartments}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <input
          type="text"
          placeholder="Search departments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-3">
        {filteredDepartments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600">
              {searchQuery ? 'No departments match your search' : 'No departments found'}
            </p>
          </div>
        ) : (
          filteredDepartments.map((dept) => {
            const isExpanded = expandedDepartment === dept.department_id
            const data = departmentData[dept.department_id]
            const completeness = calculateCompleteness(dept)
            const displayName = dept.custom_name || dept.display_name || dept.department_id

            return (
              <div
                key={dept.department_id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => handleDepartmentToggle(dept.department_id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {dept.emoji && <span className="text-2xl">{dept.emoji}</span>}
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900">{displayName}</h4>
                        {dept.custom_description && (
                          <p className="text-sm text-gray-600 mt-1">{dept.custom_description}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(completeness)}
                      <span className={`text-sm font-medium ${getStatusColor(completeness)}`}>
                        {completeness}%
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200 p-6 space-y-6 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <h5 className="font-semibold text-gray-900">Customize {displayName}</h5>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRefreshDepartment(dept.department_id)}
                          className="px-3 py-1.5 text-sm text-gray-700 hover:bg-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Refresh
                        </button>
                        <a
                          href={`/departments/${dept.department_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-sm text-blue-600 hover:bg-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Live
                        </a>
                      </div>
                    </div>

                    {!data ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <>
                        <DepartmentBasicSettingsPanel
                          organizationId={user!.organizationId!}
                          verticalId={currentVertical!}
                          departmentId={dept.department_id}
                          assignment={data.assignment}
                          onSave={() => loadDepartmentData(dept.department_id)}
                        />

                        <div className="space-y-4">
                          <DepartmentStatCardsManager
                            organizationId={user!.organizationId!}
                            verticalId={currentVertical!}
                            departmentId={dept.department_id}
                            initialCards={data.statCards}
                          />
                        </div>

                        <div className="space-y-4">
                          <DepartmentFeaturesManager
                            organizationId={user!.organizationId!}
                            verticalId={currentVertical!}
                            departmentId={dept.department_id}
                            initialFeatures={data.features}
                          />
                        </div>

                        <div className="space-y-4">
                          <DepartmentToolsManager
                            organizationId={user!.organizationId!}
                            verticalId={currentVertical!}
                            departmentId={dept.department_id}
                            initialTools={data.tools}
                          />
                        </div>

                        <div className="space-y-4">
                          <DepartmentIntegrationsManager
                            organizationId={user!.organizationId!}
                            verticalId={currentVertical!}
                            departmentId={dept.department_id}
                            initialIntegrations={data.integrations}
                          />
                        </div>

                        <div className="space-y-4">
                          <DepartmentQuickActionsManager
                            organizationId={user!.organizationId!}
                            verticalId={currentVertical!}
                            departmentId={dept.department_id}
                            initialQuickActions={data.quickActions}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default DepartmentMasterCustomizationTab
