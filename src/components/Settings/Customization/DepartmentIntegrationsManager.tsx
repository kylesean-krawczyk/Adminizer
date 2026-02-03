import React, { useState, useEffect } from 'react'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { VerticalId } from '../../../config/types'
import { DepartmentIntegration } from '../../../types/departmentLandingPage'
import { DraggableIntegrationList } from './DraggableIntegrationList'
import { IntegrationEditorModal } from './IntegrationEditorModal'
import {
  saveIntegration,
  deleteIntegration,
  reorderIntegrations
} from '../../../services/departmentLandingService'

interface DepartmentIntegrationsManagerProps {
  organizationId: string
  verticalId: VerticalId
  departmentId: string
  initialIntegrations: DepartmentIntegration[]
}

export const DepartmentIntegrationsManager: React.FC<DepartmentIntegrationsManagerProps> = ({
  organizationId,
  verticalId,
  departmentId,
  initialIntegrations
}) => {
  const [integrations, setIntegrations] = useState<DepartmentIntegration[]>(initialIntegrations)
  const [isExpanded, setIsExpanded] = useState(true)
  const [editingIntegration, setEditingIntegration] = useState<DepartmentIntegration | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    setIntegrations(initialIntegrations)
  }, [initialIntegrations])

  const handleReorder = async (newIntegrations: DepartmentIntegration[]) => {
    setIntegrations(newIntegrations)

    const updates = newIntegrations.map((integration, index) => ({
      id: integration.id,
      display_order: index
    }))

    await reorderIntegrations({
      organizationId,
      verticalId,
      departmentId,
      updates
    })
  }

  const handleEdit = (integration: DepartmentIntegration) => {
    setEditingIntegration(integration)
    setShowEditor(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this integration?')) {
      await deleteIntegration(id)
      setIntegrations(integrations.filter(i => i.id !== id))
    }
  }

  const handleToggleEnabled = async (id: string, isEnabled: boolean) => {
    const integration = integrations.find(i => i.id === id)
    if (!integration) return

    await saveIntegration({
      organizationId,
      verticalId,
      departmentId,
      name: integration.name,
      description: integration.description || undefined,
      icon: integration.icon,
      logoUrl: integration.logo_url || undefined,
      badges: integration.badges,
      features: integration.features,
      oauthEnabled: integration.oauth_enabled,
      oauthProvider: integration.oauth_provider || undefined,
      oauthConfig: integration.oauth_config,
      externalLink: integration.external_link || undefined,
      primaryContactId: integration.primary_contact_id || undefined,
      status: integration.status,
      displayOrder: integration.display_order,
      isEnabled: !isEnabled
    })

    setIntegrations(integrations.map(i => i.id === id ? { ...i, is_enabled: !isEnabled } : i))
  }

  const handleSaveIntegration = async (integrationData: any) => {
    try {
      const saved = await saveIntegration({
        organizationId,
        verticalId,
        departmentId,
        name: integrationData.name,
        description: integrationData.description,
        icon: integrationData.icon,
        logoUrl: integrationData.logoUrl,
        badges: integrationData.badges,
        features: integrationData.features,
        oauthEnabled: integrationData.oauthEnabled,
        oauthProvider: integrationData.oauthProvider,
        oauthConfig: integrationData.oauthConfig,
        externalLink: integrationData.externalLink,
        primaryContactId: integrationData.primaryContactId,
        status: integrationData.status,
        displayOrder: editingIntegration ? editingIntegration.display_order : integrations.length,
        isEnabled: true
      })

      if (editingIntegration) {
        setIntegrations(integrations.map(i => i.id === editingIntegration.id ? saved : i))
      } else {
        setIntegrations([...integrations, saved])
      }

      setShowEditor(false)
      setEditingIntegration(null)
    } catch (error) {
      console.error('Error saving integration:', error)
      alert('Failed to save integration')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <h5 className="font-semibold text-gray-900">Third-Party Integrations</h5>
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
            {integrations.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setEditingIntegration(null)
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
          <DraggableIntegrationList
            integrations={integrations}
            onReorder={handleReorder}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleVisibility={handleToggleEnabled}
          />
        </div>
      )}

      {showEditor && (
        <IntegrationEditorModal
          integration={editingIntegration}
          existingOrders={integrations.map(i => i.display_order)}
          onSave={handleSaveIntegration}
          onCancel={() => {
            setShowEditor(false)
            setEditingIntegration(null)
          }}
        />
      )}
    </div>
  )
}

export default DepartmentIntegrationsManager
