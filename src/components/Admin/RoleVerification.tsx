import React from 'react'
import { Shield, CheckCircle, User, Building2, Activity } from 'lucide-react'
import { useUserManagement } from '../../hooks'

const RoleVerification: React.FC = () => {
  const { userProfile, organization, loading } = useUserManagement()

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading user information...</span>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">User Profile Not Found</h3>
            <p className="text-sm text-red-700 mt-1">Unable to load user profile information.</p>
          </div>
        </div>
      </div>
    )
  }

  const isMasterAdmin = userProfile.role === 'master_admin'
  const isAdmin = userProfile.role === 'admin' || isMasterAdmin
  const isActive = userProfile.is_active

  const getRoleBadge = () => {
    if (isMasterAdmin) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md">
          <Shield className="w-4 h-4 mr-1.5" />
          Master Admin
        </span>
      )
    }
    if (isAdmin) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-600 text-white shadow-sm">
          <Shield className="w-4 h-4 mr-1.5" />
          Admin
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700">
        <User className="w-4 h-4 mr-1.5" />
        User
      </span>
    )
  }

  const getStatusBadge = () => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Inactive
      </span>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with gradient background for master admin */}
      <div className={`${isMasterAdmin ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-gray-50'} px-6 py-4 border-b ${isMasterAdmin ? 'border-purple-400' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isMasterAdmin ? 'bg-white/20' : 'bg-blue-100'}`}>
              <Shield className={`w-6 h-6 ${isMasterAdmin ? 'text-white' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${isMasterAdmin ? 'text-white' : 'text-gray-900'}`}>
                Role Verification
              </h3>
              <p className={`text-sm ${isMasterAdmin ? 'text-purple-100' : 'text-gray-500'}`}>
                Your account status and permissions
              </p>
            </div>
          </div>
          {isMasterAdmin && (
            <div className="flex items-center bg-white/20 rounded-full px-4 py-2">
              <CheckCircle className="w-5 h-5 text-white mr-2" />
              <span className="text-white font-medium text-sm">Verified</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-5">
        {/* Master Admin Success Message */}
        {isMasterAdmin && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
              <div className="ml-3">
                <h4 className="text-sm font-semibold text-green-900">Super Admin Access Confirmed</h4>
                <p className="text-sm text-green-700 mt-1">
                  You have full administrative privileges. All features and settings are accessible.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* User Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email Address</label>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-900">{userProfile.email}</p>
            </div>
          </div>

          {/* Full Name */}
          {userProfile.full_name && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
              <p className="text-sm font-medium text-gray-900">{userProfile.full_name}</p>
            </div>
          )}

          {/* Role */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Role</label>
            <div>{getRoleBadge()}</div>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account Status</label>
            <div>{getStatusBadge()}</div>
          </div>

          {/* Organization */}
          {organization && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Organization</label>
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-medium text-gray-900">{organization.name}</p>
              </div>
            </div>
          )}

          {/* Active Vertical */}
          {userProfile.active_vertical && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Vertical</label>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-medium text-gray-900 capitalize">{userProfile.active_vertical}</p>
              </div>
            </div>
          )}
        </div>

        {/* Permissions Summary */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Your Permissions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {isMasterAdmin ? (
              <>
                <PermissionItem granted text="Full System Access" />
                <PermissionItem granted text="User Management" />
                <PermissionItem granted text="Organization Settings" />
                <PermissionItem granted text="All Departments" />
                <PermissionItem granted text="Document Management" />
                <PermissionItem granted text="Feature Configuration" />
                <PermissionItem granted text="Analytics & Reports" />
                <PermissionItem granted text="Invite Users" />
              </>
            ) : isAdmin ? (
              <>
                <PermissionItem granted text="User Management" />
                <PermissionItem granted text="Organization Settings" />
                <PermissionItem granted text="Document Management" />
                <PermissionItem granted text="Invite Users" />
                <PermissionItem denied text="Full System Access" />
                <PermissionItem denied text="Feature Configuration" />
              </>
            ) : (
              <>
                <PermissionItem granted text="View Documents" />
                <PermissionItem granted text="Upload Documents" />
                <PermissionItem granted text="View Own Profile" />
                <PermissionItem denied text="User Management" />
                <PermissionItem denied text="Organization Settings" />
                <PermissionItem denied text="Invite Users" />
              </>
            )}
          </div>
        </div>

        {/* Additional Info */}
        {userProfile.last_login && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Last Login:</span>
              <span className="font-medium">
                {new Date(userProfile.last_login).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface PermissionItemProps {
  granted?: boolean
  denied?: boolean
  text: string
}

const PermissionItem: React.FC<PermissionItemProps> = ({ granted, denied, text }) => {
  const isGranted = granted || !denied

  return (
    <div className="flex items-center space-x-2">
      {isGranted ? (
        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
      ) : (
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span className={`text-sm ${isGranted ? 'text-gray-700' : 'text-gray-400'}`}>
        {text}
      </span>
    </div>
  )
}

export default RoleVerification
