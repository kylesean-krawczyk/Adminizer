import React, { useState, useEffect } from 'react'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { VerticalId } from '../../../config/types'
import { DepartmentTool } from '../../../types/departmentLandingPage'
import { DraggableToolList } from './DraggableToolList'
import { ToolEditor } from './ToolEditor'
import {
  saveDepartmentTool,
  deleteDepartmentTool,
  reorderTools
} from '../../../services/departmentLandingService'

interface DepartmentToolsManagerProps {
  organizationId: string
  verticalId: VerticalId
  departmentId: string
  initialTools: DepartmentTool[]
}

export const DepartmentToolsManager: React.FC<DepartmentToolsManagerProps> = ({
  organizationId,
  verticalId,
  departmentId,
  initialTools
}) => {
  const [tools, setTools] = useState<DepartmentTool[]>(initialTools)
  const [isExpanded, setIsExpanded] = useState(true)
  const [editingTool, setEditingTool] = useState<DepartmentTool | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    setTools(initialTools)
  }, [initialTools])

  const handleReorder = async (newTools: DepartmentTool[]) => {
    setTools(newTools)

    const updates = newTools.map((tool, index) => ({
      id: tool.id,
      display_order: index
    }))

    await reorderTools({
      organizationId,
      verticalId,
      departmentId,
      updates
    })
  }

  const handleEdit = (tool: DepartmentTool) => {
    setEditingTool(tool)
    setShowEditor(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this tool?')) {
      await deleteDepartmentTool(id)
      setTools(tools.filter(t => t.id !== id))
    }
  }

  const handleToggleVisibility = async (id: string, isVisible: boolean) => {
    const tool = tools.find(t => t.id === id)
    if (!tool) return

    await saveDepartmentTool({
      organizationId,
      verticalId,
      departmentId,
      toolName: tool.tool_name,
      toolDescription: tool.tool_description || undefined,
      toolUrl: tool.tool_url || undefined,
      toolType: tool.tool_type,
      integrationConfig: tool.integration_config,
      displayOrder: tool.display_order,
      isVisible: !isVisible
    })

    setTools(tools.map(t => t.id === id ? { ...t, is_visible: !isVisible } : t))
  }

  const handleSaveTool = async (toolData: any) => {
    try {
      const saved = await saveDepartmentTool({
        organizationId,
        verticalId,
        departmentId,
        toolName: toolData.toolName,
        toolDescription: toolData.toolDescription,
        toolUrl: toolData.toolUrl,
        toolType: toolData.toolType,
        integrationConfig: toolData.integrationConfig,
        displayOrder: editingTool ? editingTool.display_order : tools.length,
        isVisible: true
      })

      if (editingTool) {
        setTools(tools.map(t => t.id === editingTool.id ? saved : t))
      } else {
        setTools([...tools, saved])
      }

      setShowEditor(false)
      setEditingTool(null)
    } catch (error) {
      console.error('Error saving tool:', error)
      alert('Failed to save tool')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <h5 className="font-semibold text-gray-900">Tools & Resources</h5>
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
            {tools.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setEditingTool(null)
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
          <DraggableToolList
            tools={tools}
            onReorder={handleReorder}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleVisibility={handleToggleVisibility}
          />
        </div>
      )}

      {showEditor && (
        <ToolEditor
          tool={editingTool || undefined}
          existingOrders={tools.map(t => t.display_order)}
          onSave={handleSaveTool}
          onCancel={() => {
            setShowEditor(false)
            setEditingTool(null)
          }}
        />
      )}
    </div>
  )
}

export default DepartmentToolsManager
