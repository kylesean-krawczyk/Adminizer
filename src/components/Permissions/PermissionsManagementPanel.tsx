import { useState, useEffect } from 'react';
import { Shield, Search, Filter, Users, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { ToolRegistryService } from '../../services/toolRegistryService';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import PermissionChangeModal from './PermissionChangeModal';
import type { ToolDefinition } from '../../types/toolRegistry';

interface UserPermissionData {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  permissions: Record<string, { granted: boolean; expires_at?: string; source: string }>;
}

export default function PermissionsManagementPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserPermissionData[]>([]);
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserPermissionData | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [toolsData, usersData] = await Promise.all([
        ToolRegistryService.fetchAllTools({ isEnabled: true }),
        fetchUsersWithPermissions()
      ]);

      setTools(toolsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading permissions data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersWithPermissions = async (): Promise<UserPermissionData[]> => {
    try {
      const { data: usersData } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, role')
        .order('email');

      if (!usersData) return [];

      const usersWithPermissions = await Promise.all(
        usersData.map(async (user) => {
          const { data: permissions } = await supabase
            .from('ai_user_permissions')
            .select('tool_id, granted, expires_at')
            .eq('user_id', user.id);

          const permissionMap: Record<string, { granted: boolean; expires_at?: string; source: string }> = {};

          if (permissions) {
            permissions.forEach((perm) => {
              permissionMap[perm.tool_id] = {
                granted: perm.granted,
                expires_at: perm.expires_at || undefined,
                source: 'override'
              };
            });
          }

          return {
            ...user,
            permissions: permissionMap
          };
        })
      );

      return usersWithPermissions;
    } catch (error) {
      console.error('Error fetching users with permissions:', error);
      return [];
    }
  };

  const handlePermissionClick = (user: UserPermissionData, tool: ToolDefinition) => {
    setSelectedUser(user);
    setSelectedTool(tool);
    setShowPermissionModal(true);
  };

  const handlePermissionChange = () => {
    setShowPermissionModal(false);
    setSelectedUser(null);
    setSelectedTool(null);
    loadData();
  };

  const getUserPermission = (user: UserPermissionData, toolId: string) => {
    return user.permissions[toolId];
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const filteredTools = tools.filter(tool => {
    return categoryFilter === 'all' || tool.category === categoryFilter;
  });

  const toolCategories = Array.from(new Set(tools.map(t => t.category)));
  const userRoles = Array.from(new Set(users.map(u => u.role)));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
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
            Permission Matrix
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage user permissions for AI tools. Click on any cell to grant or revoke access.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">All Roles</option>
                {userRoles.map(role => (
                  <option key={role} value={role}>{role.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">All Tool Categories</option>
                {toolCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No users found matching your filters.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 border-r border-gray-200 sticky left-0 bg-gray-50 z-10">
                    User
                  </th>
                  {filteredTools.map(tool => (
                    <th key={tool.id} className="text-center py-3 px-2 font-semibold text-gray-900 min-w-[120px]">
                      <div className="text-xs">{tool.name}</div>
                      <div className="text-xs font-normal text-gray-500">{tool.category}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, userIndex) => (
                  <tr key={user.id} className={userIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-3 px-4 border-r border-gray-200 sticky left-0 z-10" style={{ backgroundColor: userIndex % 2 === 0 ? 'white' : '#f9fafb' }}>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {user.full_name || user.email}
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</div>
                      </div>
                    </td>
                    {filteredTools.map(tool => {
                      const permission = getUserPermission(user, tool.id);
                      const hasAccess = permission?.granted;
                      const expired = isExpired(permission?.expires_at);

                      return (
                        <td key={tool.id} className="text-center py-2 px-2 border-l border-gray-100">
                          <button
                            onClick={() => handlePermissionClick(user, tool)}
                            className={`w-full h-12 rounded flex items-center justify-center transition-colors ${
                              hasAccess && !expired
                                ? 'bg-green-100 hover:bg-green-200 text-green-700'
                                : hasAccess && expired
                                ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                            }`}
                            title={
                              hasAccess && !expired
                                ? 'Access granted - Click to modify'
                                : hasAccess && expired
                                ? 'Access expired - Click to renew'
                                : 'No access - Click to grant'
                            }
                          >
                            {hasAccess && !expired ? (
                              <div className="flex flex-col items-center">
                                <CheckCircle className="h-5 w-5" />
                                {permission?.expires_at && (
                                  <Clock className="h-3 w-3 mt-1" />
                                )}
                              </div>
                            ) : hasAccess && expired ? (
                              <div className="flex flex-col items-center">
                                <AlertCircle className="h-5 w-5" />
                                <span className="text-xs mt-1">Expired</span>
                              </div>
                            ) : (
                              <XCircle className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Permission Legend</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-700" />
                </div>
                <span>Access Granted</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-yellow-100 rounded flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-yellow-700" />
                </div>
                <span>Access Expired</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-gray-500" />
                </div>
                <span>No Access</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-700" />
                <span>Temporary Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedUser && selectedTool && (
        <PermissionChangeModal
          isOpen={showPermissionModal}
          onClose={() => {
            setShowPermissionModal(false);
            setSelectedUser(null);
            setSelectedTool(null);
          }}
          userId={selectedUser.id}
          userName={selectedUser.full_name || ''}
          userEmail={selectedUser.email}
          tool={selectedTool}
          currentAccess={getUserPermission(selectedUser, selectedTool.id)?.granted || false}
          performedBy={user?.id || ''}
          onSuccess={handlePermissionChange}
        />
      )}
    </div>
  );
}
