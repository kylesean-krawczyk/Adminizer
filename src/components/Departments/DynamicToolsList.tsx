import React from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Link as LinkIcon, Plug } from 'lucide-react'
import { DepartmentTool } from '../../types/departmentLandingPage'

interface DynamicToolsListProps {
  tools: DepartmentTool[]
  loading?: boolean
}

export const DynamicToolsList: React.FC<DynamicToolsListProps> = ({
  tools,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-6 bg-gray-300 rounded w-48 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg animate-pulse"
            >
              <div className="h-5 bg-gray-300 rounded w-32 mb-2" />
              <div className="h-4 bg-gray-300 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (tools.length === 0) {
    return null
  }

  const getToolIcon = (toolType: string) => {
    switch (toolType) {
      case 'internal_route':
        return <LinkIcon className="h-5 w-5 text-gray-600" />
      case 'external_link':
        return <ExternalLink className="h-5 w-5 text-gray-600" />
      case 'integration':
        return <Plug className="h-5 w-5 text-gray-600" />
      default:
        return <LinkIcon className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Tools & Resources
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => {
          const isExternal = tool.tool_type === 'external_link'
          const isInternal = tool.tool_type === 'internal_route'
          const toolUrl = tool.tool_url || '#'

          const content = (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-900 font-medium">{tool.tool_name}</span>
                {getToolIcon(tool.tool_type)}
              </div>
              {tool.tool_description && (
                <p className="text-sm text-gray-600">{tool.tool_description}</p>
              )}
              {tool.tool_type === 'integration' && (
                <span className="inline-block mt-2 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded">
                  Integration
                </span>
              )}
            </>
          )

          if (isInternal) {
            return (
              <Link
                key={tool.id}
                to={toolUrl}
                className="flex flex-col p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                {content}
              </Link>
            )
          }

          if (isExternal) {
            return (
              <a
                key={tool.id}
                href={toolUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                {content}
              </a>
            )
          }

          return (
            <div
              key={tool.id}
              className="flex flex-col p-4 border-2 border-dashed border-gray-300 rounded-lg"
            >
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DynamicToolsList
