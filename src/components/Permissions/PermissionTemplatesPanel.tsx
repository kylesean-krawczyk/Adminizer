import { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Copy, Trash2, Users, Info } from 'lucide-react';
import { PermissionService } from '../../services/permissionService';
import type { PermissionTemplate } from '../../types/permissions';

export default function PermissionTemplatesPanel() {
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await PermissionService.getPermissionTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPermissionLevelColor = (level: string) => {
    switch (level) {
      case 'master_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'manager':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'employee':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'viewer':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-600" />
            Permission Templates
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage reusable permission templates for different user roles.
          </p>
        </div>
        <button
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => alert('Create template functionality coming soon')}
        >
          <Plus className="h-4 w-4" />
          <span>Create Template</span>
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About Permission Templates</p>
            <p>
              Templates provide predefined permission sets that can be applied to users. System templates
              cannot be modified or deleted. You can create custom templates to match your organization's needs.
            </p>
          </div>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No permission templates found.</p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => alert('Create template functionality coming soon')}
          >
            Create Your First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{template.name}</h4>
                      {template.is_system_template && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded border border-gray-200">
                          System
                        </span>
                      )}
                    </div>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full border ${getPermissionLevelColor(template.permission_level)}`}>
                      {template.permission_level.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600">{template.description}</p>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-700">Tool Permissions:</div>
                  <div className="bg-gray-50 rounded p-3">
                    {template.tool_permissions.all ? (
                      <div className="flex items-center space-x-2 text-sm text-green-700">
                        <Shield className="h-4 w-4" />
                        <span>Full access to all tools</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {template.tool_permissions.allowed_tools && template.tool_permissions.allowed_tools.length > 0 ? (
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Allowed: </span>
                            {template.tool_permissions.allowed_tools.join(', ')}
                          </div>
                        ) : null}
                        {template.tool_permissions.denied_tools && template.tool_permissions.denied_tools.length > 0 ? (
                          <div className="text-xs text-red-600">
                            <span className="font-medium">Denied: </span>
                            {template.tool_permissions.denied_tools.join(', ')}
                          </div>
                        ) : null}
                        {(!template.tool_permissions.allowed_tools || template.tool_permissions.allowed_tools.length === 0) &&
                         (!template.tool_permissions.denied_tools || template.tool_permissions.denied_tools.length === 0) && (
                          <div className="text-xs text-gray-500">No specific permissions defined</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Users className="h-4 w-4" />
                  <span>Created {new Date(template.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {!template.is_system_template && (
                    <>
                      <button
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Edit template"
                        onClick={() => alert('Edit template functionality coming soon')}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1 text-red-600 hover:text-red-800 transition-colors"
                        title="Delete template"
                        onClick={() => alert('Delete template functionality coming soon')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
                <button
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                  title="Clone template"
                  onClick={() => alert('Clone template functionality coming soon')}
                >
                  <Copy className="h-4 w-4" />
                  <span>Clone</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
