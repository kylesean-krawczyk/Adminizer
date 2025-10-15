import { useState } from 'react'
import { Users, UserPlus, Shield, Mail, CheckCircle, Clock, Key, History, Layout } from 'lucide-react'
import { useUserManagement } from '../../hooks'
import { useTerminology } from '../../hooks'
import { useRequestNotifications } from '../../hooks/useRequestNotifications'
import { format } from 'date-fns'
import InviteUserModal from './InviteUserModal'
import OrganizationSetup from './OrganizationSetup'
import PermissionsManagementPanel from '../Permissions/PermissionsManagementPanel'
import ToolAccessRequestsPanel from '../Permissions/ToolAccessRequestsPanel'
import AuditTrailPanel from '../Permissions/AuditTrailPanel'
import PermissionTemplatesPanel from '../Permissions/PermissionTemplatesPanel'

type TabType = 'users' | 'permissions' | 'requests' | 'audit' | 'templates'

const UserManagementPage = () => {
  const {
    userProfile,
    organization,
    users,
    invitations,
    loading,
    error,
    isAdmin,
    isMasterAdmin,
    updateUserRole,
    deactivateUser,
    reactivateUser,
    cancelInvitation
  } = useUserManagement()

  const { term } = useTerminology()
  const { notifications } = useRequestNotifications()
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('users')

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{term('userManagement', { capitalize: 'title' })}</h2>
          <p className="text-gray-600">Manage your {term('organization')}'s {term('users')} and permissions</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{term('userManagement', { capitalize: 'title' })}</h2>
          <p className="text-gray-600">Manage your {term('organization')}'s {term('users')} and permissions</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Error: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  // If user doesn't have an organization, show setup
  if (!organization) {
    return <OrganizationSetup />
  }

  // If user is not an admin, show access denied
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{term('userManagement', { capitalize: 'title' })}</h2>
          <p className="text-gray-600">Manage your {term('organization')}'s {term('users')} and permissions</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">You need {term('admin')} privileges to access {term('user')} management.</p>
          </div>
        </div>
      </div>
    )
  }

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      await updateUserRole(userId, newRole)
    } catch (err) {
      alert('Failed to update user role: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleDeactivate = async (userId: string) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      try {
        await deactivateUser(userId)
      } catch (err) {
        alert('Failed to deactivate user: ' + (err instanceof Error ? err.message : 'Unknown error'))
      }
    }
  }

  const handleReactivate = async (userId: string) => {
    try {
      await reactivateUser(userId)
    } catch (err) {
      alert('Failed to reactivate user: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    if (window.confirm('Are you sure you want to cancel this invitation?')) {
      try {
        await cancelInvitation(invitationId)
      } catch (err) {
        alert('Failed to cancel invitation: ' + (err instanceof Error ? err.message : 'Unknown error'))
      }
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'master_admin':
        return 'bg-purple-100 text-purple-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const tabs: Array<{ id: TabType; label: string; icon: any; badge?: number }> = [
    { id: 'users', label: term('users', { capitalize: 'title' }), icon: Users },
    { id: 'permissions', label: 'Permissions', icon: Key },
    { id: 'requests', label: 'Access Requests', icon: Shield, badge: notifications.total },
    { id: 'audit', label: 'Audit Trail', icon: History },
    { id: 'templates', label: 'Templates', icon: Layout }
  ]

  const getBadgeColor = () => {
    switch (notifications.badgeColor) {
      case 'red':
        return 'bg-red-500'
      case 'orange':
        return 'bg-orange-500'
      case 'blue':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{term('userManagement', { capitalize: 'title' })}</h2>
          <p className="text-gray-600">Manage {term('users')} in {organization.name}</p>
        </div>
        {activeTab === 'users' && (
          <button
            onClick={() => setInviteModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>{term('inviteUser', { capitalize: 'title' })}</span>
          </button>
        )}
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`ml-2 px-2 py-0.5 text-xs font-semibold text-white rounded-full ${getBadgeColor()}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {activeTab === 'users' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{term('totalUsers', { capitalize: 'title' })}</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{term('activeUsers', { capitalize: 'title' })}</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 p-3 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{term('admins', { capitalize: 'title' })}</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'admin' || u.role === 'master_admin').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Invites</p>
              <p className="text-2xl font-bold text-gray-900">{invitations.length}</p>
            </div>
          </div>
        </div>
          </div>

          {/* Users Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{term('organizationMembers', { capitalize: 'title' })}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">{term('user', { capitalize: 'first' })}</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Role</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Last Login</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Joined</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.full_name || 'No name set'}
                      </p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {isMasterAdmin && user.role !== 'master_admin' ? (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'user')}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {user.last_login 
                      ? format(new Date(user.last_login), 'MMM dd, yyyy')
                      : 'Never'
                    }
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {format(new Date(user.created_at), 'MMM dd, yyyy')}
                  </td>
                  <td className="py-4 px-6">
                    {user.id !== userProfile?.id && user.role !== 'master_admin' && (
                      <div className="flex items-center space-x-2">
                        {user.is_active ? (
                          <button
                            onClick={() => handleDeactivate(user.id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(user.id)}
                            className="text-green-600 hover:text-green-700 text-sm"
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Pending Invitations</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Email</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Role</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Invited By</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Sent</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Expires</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation) => (
                  <tr key={invitation.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{invitation.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(invitation.role)}`}>
                        {invitation.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {(invitation as any).invited_by_profile?.full_name || 
                       (invitation as any).invited_by_profile?.email || 
                       'Unknown'}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {format(new Date(invitation.created_at), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {format(new Date(invitation.expires_at), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
          )}
        </>
      )}

      {activeTab === 'permissions' && <PermissionsManagementPanel />}

      {activeTab === 'requests' && <ToolAccessRequestsPanel />}

      {activeTab === 'audit' && <AuditTrailPanel />}

      {activeTab === 'templates' && <PermissionTemplatesPanel />}

      <InviteUserModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </div>
  )
}

export default UserManagementPage