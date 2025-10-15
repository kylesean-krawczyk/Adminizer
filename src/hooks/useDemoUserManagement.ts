import { useState } from 'react'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: 'master_admin' | 'admin' | 'user'
  organization_id: string | null
  is_active: boolean
  invited_by: string | null
  invited_at: string | null
  last_login: string | null
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface UserInvitation {
  id: string
  email: string
  role: 'admin' | 'user'
  organization_id: string
  invited_by: string
  token: string
  expires_at: string
  accepted_at: string | null
  created_at: string
}

export interface InviteUserData {
  email: string
  role: 'admin' | 'user'
  full_name?: string
}

const demoUserProfile: UserProfile = {
  id: 'demo-admin-id',
  email: 'admin@demo.com',
  full_name: 'Demo Administrator',
  role: 'master_admin',
  organization_id: 'demo-org-1',
  is_active: true,
  invited_by: null,
  invited_at: null,
  last_login: new Date().toISOString(),
  created_at: '2024-01-01T00:00:00Z',
  updated_at: new Date().toISOString()
}

const demoOrganization: Organization = {
  id: 'demo-org-1',
  name: 'Demo Organization',
  created_by: 'demo-admin-id',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const demoUsers: UserProfile[] = [
  demoUserProfile,
  {
    id: 'demo-user-1',
    email: 'user1@demo.com',
    full_name: 'Demo User 1',
    role: 'user',
    organization_id: 'demo-org-1',
    is_active: true,
    invited_by: 'demo-admin-id',
    invited_at: '2024-01-02T00:00:00Z',
    last_login: '2024-01-15T10:00:00Z',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  {
    id: 'demo-user-2',
    email: 'user2@demo.com',
    full_name: 'Demo User 2',
    role: 'admin',
    organization_id: 'demo-org-1',
    is_active: true,
    invited_by: 'demo-admin-id',
    invited_at: '2024-01-03T00:00:00Z',
    last_login: '2024-01-14T15:30:00Z',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z'
  }
]

const demoInvitations: UserInvitation[] = [
  {
    id: 'demo-invite-1',
    email: 'newuser@demo.com',
    role: 'user',
    organization_id: 'demo-org-1',
    invited_by: 'demo-admin-id',
    token: 'demo-token-123',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    accepted_at: null,
    created_at: new Date().toISOString()
  }
]

export const useDemoUserManagement = () => {
  const [userProfile] = useState<UserProfile>(demoUserProfile)
  const [organization] = useState<Organization>(demoOrganization)
  const [users, setUsers] = useState<UserProfile[]>(demoUsers)
  const [invitations, setInvitations] = useState<UserInvitation[]>(demoInvitations)
  const [loading] = useState(false)
  const [error] = useState<string | null>(null)

  const createOrganization = async (_name: string) => {
    // Demo mode - organization already exists
    return demoOrganization
  }

  const inviteUser = async (inviteData: InviteUserData) => {
    const newInvitation: UserInvitation = {
      id: `demo-invite-${Date.now()}`,
      email: inviteData.email,
      role: inviteData.role,
      organization_id: 'demo-org-1',
      invited_by: 'demo-admin-id',
      token: `demo-token-${Date.now()}`,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      accepted_at: null,
      created_at: new Date().toISOString()
    }
    
    setInvitations(prev => [newInvitation, ...prev])
    return newInvitation
  }

  const acceptInvitation = async (_token: string, _password: string) => {
    // Demo mode - simulate successful acceptance
    return { user: { id: 'demo-new-user', email: 'newuser@demo.com' } }
  }

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, role: newRole, updated_at: new Date().toISOString() } : user
    ))
  }

  const deactivateUser = async (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, is_active: false, updated_at: new Date().toISOString() } : user
    ))
  }

  const reactivateUser = async (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, is_active: true, updated_at: new Date().toISOString() } : user
    ))
  }

  const cancelInvitation = async (invitationId: string) => {
    setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
  }

  const refetch = async () => {
    // Demo mode doesn't need to refetch
  }

  const isAdmin = userProfile?.role === 'master_admin' || userProfile?.role === 'admin'
  const isMasterAdmin = userProfile?.role === 'master_admin'

  return {
    userProfile,
    organization,
    users,
    invitations,
    loading,
    error,
    isAdmin,
    isMasterAdmin,
    createOrganization,
    inviteUser,
    acceptInvitation,
    updateUserRole,
    deactivateUser,
    reactivateUser,
    cancelInvitation,
    refetch
  }
}