import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/DemoAuthContext'
import type { UserProfile, Organization, UserInvitation, InviteUserData } from '../types/user'

export const useUserManagement = () => {
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [invitations, setInvitations] = useState<UserInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Ensure user profile exists
  const ensureUserProfile = async () => {
    if (!user) return null

    try {
      // First, try to get existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (existingProfile) {
        return existingProfile
      }

      if (fetchError && fetchError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Creating user profile for:', user.email)
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            role: 'user',
            is_active: true
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating user profile:', createError)
          throw createError
        }
        
        return newProfile
      }

      throw fetchError
    } catch (err) {
      console.error('Error in ensureUserProfile:', err)
      throw err
    }
  }

  // Fetch current user profile
  const fetchUserProfile = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      console.log('Fetching user profile for:', user.email)
      
      const profile = await ensureUserProfile()
      if (!profile) {
        setError('Failed to create or fetch user profile')
        return
      }

      console.log('User profile found:', profile)
      setUserProfile(profile)

      // Fetch organization if user has one
      if (profile.organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.organization_id)
          .single()

        if (orgError) {
          console.error('Error fetching organization:', orgError)
        } else {
          setOrganization(orgData)
        }
      }
    } catch (err) {
      console.error('Error in fetchUserProfile:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch user profile')
    }
  }

  // Fetch all users in organization
  const fetchUsers = async () => {
    if (!userProfile?.organization_id) return

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    }
  }

  // Fetch pending invitations
  const fetchInvitations = async () => {
    if (!userProfile?.organization_id) return

    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select(`
          *,
          invited_by_profile:user_profiles!user_invitations_invited_by_fkey(full_name, email)
        `)
        .eq('organization_id', userProfile.organization_id)
        .is('accepted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvitations(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invitations')
    }
  }

  // Create organization (for first-time setup)
  const createOrganization = async (name: string) => {
    if (!user) throw new Error('User not authenticated')

    try {
      // Ensure user profile exists first
      const profile = await ensureUserProfile()
      if (!profile) {
        throw new Error('Failed to create user profile')
      }

      console.log('Creating organization with profile:', profile)

      // Create organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({ 
          name, 
          created_by: profile.id 
        })
        .select()
        .single()

      if (orgError) {
        console.error('Organization creation error:', orgError)
        throw orgError
      }

      console.log('Organization created:', orgData)

      // Update user profile to be master admin of this organization
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          organization_id: orgData.id,
          role: 'master_admin'
        })
        .eq('id', profile.id)
        .select()
        .single()

      if (updateError) {
        console.error('Profile update error:', updateError)
        throw updateError
      }

      setOrganization(orgData)
      setUserProfile(updatedProfile)

      return orgData
    } catch (err) {
      console.error('Error in createOrganization:', err)
      throw err instanceof Error ? err : new Error('Failed to create organization')
    }
  }

  // Invite user to organization
  const inviteUser = async (inviteData: InviteUserData) => {
    if (!userProfile?.organization_id) throw new Error('No organization found')
    if (!['master_admin', 'admin'].includes(userProfile.role)) {
      throw new Error('Insufficient permissions to invite users')
    }

    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .insert({
          email: inviteData.email,
          role: inviteData.role,
          organization_id: userProfile.organization_id,
          invited_by: userProfile.id
        })
        .select()
        .single()

      if (error) throw error

      // In a real app, you would send an email here
      // For now, we'll just return the invitation token
      await fetchInvitations()
      return data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to invite user')
    }
  }

  // Accept invitation
  const acceptInvitation = async (token: string, password: string) => {
    try {
      // Get invitation details
      const { data: invitation, error: inviteError } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('token', token)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (inviteError) throw new Error('Invalid or expired invitation')

      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password
      })

      if (signUpError) throw signUpError
      if (!authData.user) throw new Error('Failed to create user')

      // Update user profile with organization and role
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          organization_id: invitation.organization_id,
          role: invitation.role,
          invited_by: invitation.invited_by,
          invited_at: invitation.created_at
        })
        .eq('id', authData.user.id)

      if (updateError) throw updateError

      // Mark invitation as accepted
      const { error: acceptError } = await supabase
        .from('user_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id)

      if (acceptError) throw acceptError

      return authData
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to accept invitation')
    }
  }

  // Update user role
  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    if (!userProfile || userProfile.role !== 'master_admin') {
      throw new Error('Only master admins can change user roles')
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId)
        .eq('organization_id', userProfile.organization_id)

      if (error) throw error
      await fetchUsers()
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update user role')
    }
  }

  // Deactivate user
  const deactivateUser = async (userId: string) => {
    if (!userProfile || !['master_admin', 'admin'].includes(userProfile.role)) {
      throw new Error('Insufficient permissions to deactivate users')
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: false })
        .eq('id', userId)
        .eq('organization_id', userProfile.organization_id)

      if (error) throw error
      await fetchUsers()
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to deactivate user')
    }
  }

  // Reactivate user
  const reactivateUser = async (userId: string) => {
    if (!userProfile || !['master_admin', 'admin'].includes(userProfile.role)) {
      throw new Error('Insufficient permissions to reactivate users')
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: true })
        .eq('id', userId)
        .eq('organization_id', userProfile.organization_id)

      if (error) throw error
      await fetchUsers()
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to reactivate user')
    }
  }

  // Cancel invitation
  const cancelInvitation = async (invitationId: string) => {
    if (!userProfile || !['master_admin', 'admin'].includes(userProfile.role)) {
      throw new Error('Insufficient permissions to cancel invitations')
    }

    try {
      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', invitationId)
        .eq('organization_id', userProfile.organization_id)

      if (error) throw error
      await fetchInvitations()
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to cancel invitation')
    }
  }

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        await fetchUserProfile()
      } catch (err) {
        console.error('Error loading user data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [user])

  useEffect(() => {
    if (userProfile?.organization_id) {
      fetchUsers()
      fetchInvitations()
    }
  }, [userProfile])

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
    refetch: () => {
      fetchUserProfile()
      fetchUsers()
      fetchInvitations()
    }
  }
}