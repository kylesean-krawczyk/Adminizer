import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/DemoAuthContext'
import type { UserProfile, Organization, UserInvitation, InviteUserData } from '../types/user'
import { useProfileRecovery } from './useProfileRecovery'
import { getRetryMessage } from '../types/profileErrors'

export const useUserManagement = () => {
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [invitations, setInvitations] = useState<UserInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState<string>('Loading your profile...')
  const isFetchingRef = useRef(false)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const {
    recoveryState,
    retryProfileCreation,
    createProfileManually,
    resetRecovery
  } = useProfileRecovery()

  // Ensure user profile exists with automatic retry logic
  const ensureUserProfile = async () => {
    if (!user) return null

    try {
      console.log('ensureUserProfile called for user:', user.id, user.email)

      // First, try to get existing profile (simple check)
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (existingProfile) {
        console.log('Profile found immediately:', existingProfile)
        return existingProfile
      }

      // Profile not found - attempt recovery with retry logic
      console.log('Profile not found, starting automatic recovery')
      setLoadingMessage(getRetryMessage(1, 3))

      const recoveredProfile = await retryProfileCreation(user.id, user.email || '')

      if (recoveredProfile) {
        console.log('Profile recovered successfully:', recoveredProfile)
        return recoveredProfile
      }

      // If automatic recovery failed, the error state is already set in recoveryState
      console.error('Profile recovery failed after all retries')
      throw new Error('Failed to create or recover user profile after multiple attempts')

    } catch (err) {
      console.error('Error in ensureUserProfile:', err)
      throw err
    }
  }

  // Manual profile creation fallback
  const createProfileManuallyFallback = async () => {
    if (!user) {
      setError('No user session found')
      return false
    }

    try {
      setLoading(true)
      setLoadingMessage('Creating profile manually...')

      const profile = await createProfileManually(user.id, user.email || '')

      if (profile) {
        setUserProfile(profile)
        setError(null)
        return true
      }

      setError('Manual profile creation failed. Please contact support.')
      return false
    } catch (err) {
      console.error('Manual fallback creation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create profile manually')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Fetch current user profile
  const fetchUserProfile = async () => {
    if (!user) {
      console.log('[useRealUserManagement] No user, clearing loading state')
      setLoading(false)
      return
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log('[useRealUserManagement] Fetch already in progress, skipping')
      return
    }

    isFetchingRef.current = true
    console.log('[useRealUserManagement] Starting profile fetch for user:', user.id, user.email)

    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
      fetchTimeoutRef.current = null
    }

    // Set a timeout to prevent infinite loading (30 seconds)
    fetchTimeoutRef.current = setTimeout(() => {
      if (isFetchingRef.current) {
        console.error('[useRealUserManagement] Profile fetch timeout after 30 seconds')
        setError('Profile loading timed out. Please refresh the page and try again.')
        setLoading(false)
        isFetchingRef.current = false
      }
    }, 30000)

    try {
      console.log('[useRealUserManagement] Fetching user profile for:', user.email)

      const profile = await ensureUserProfile()

      // Clear timeout on success
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
        fetchTimeoutRef.current = null
      }

      if (!profile) {
        const errorMsg = recoveryState.lastError?.userMessage || 'Failed to create or fetch user profile. Please try refreshing the page.'
        console.error('[useRealUserManagement] Profile fetch returned null:', errorMsg)
        setError(errorMsg)
        setLoading(false)
        isFetchingRef.current = false
        return
      }

      console.log('[useRealUserManagement] User profile found:', profile)
      setUserProfile(profile)
      setError(null)

      // Fetch organization if user has one
      if (profile.organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.organization_id)
          .single()

        if (orgError) {
          console.error('[useRealUserManagement] Error fetching organization:', orgError)
        } else {
          console.log('[useRealUserManagement] Organization found:', orgData)
          setOrganization(orgData)
        }
      }
    } catch (err) {
      // Clear timeout on error
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
        fetchTimeoutRef.current = null
      }

      console.error('[useRealUserManagement] Error in fetchUserProfile:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch user profile'
      setError(errorMsg)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
      console.log('[useRealUserManagement] Profile fetch complete')
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
        console.log('[useRealUserManagement] useEffect: No user, clearing loading state')
        setLoading(false)
        return
      }

      console.log('[useRealUserManagement] useEffect triggered for user.id:', user.id)
      setLoading(true)
      setError(null)
      setLoadingMessage('Loading your profile...')

      try {
        await fetchUserProfile()
      } catch (err) {
        console.error('[useRealUserManagement] Error loading user data:', err)
        setLoading(false)
      }
    }

    loadUserData()

    // Cleanup function
    return () => {
      console.log('[useRealUserManagement] Cleaning up useEffect')
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
        fetchTimeoutRef.current = null
      }
      isFetchingRef.current = false
    }
  }, [user?.id]) // Only depend on user.id to prevent infinite loops

  // Update loading message based on recovery state
  useEffect(() => {
    if (recoveryState.isRecovering && recoveryState.currentAttempt > 0) {
      setLoadingMessage(
        getRetryMessage(recoveryState.currentAttempt, recoveryState.maxAttempts)
      )
    }
  }, [recoveryState.currentAttempt, recoveryState.isRecovering])

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
    loadingMessage,
    recoveryState,
    isAdmin,
    isMasterAdmin,
    createOrganization,
    inviteUser,
    acceptInvitation,
    updateUserRole,
    deactivateUser,
    reactivateUser,
    cancelInvitation,
    createProfileManually: createProfileManuallyFallback,
    resetRecovery,
    refetch: () => {
      resetRecovery()
      fetchUserProfile()
      fetchUsers()
      fetchInvitations()
    }
  }
}