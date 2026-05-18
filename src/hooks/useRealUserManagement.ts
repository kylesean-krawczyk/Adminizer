import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/DemoAuthContext'
import type { UserProfile, Organization, UserInvitation, InviteUserData } from '../types/user'
import { useProfileRecovery } from './useProfileRecovery'
import { getRetryMessage } from '../types/profileErrors'

type InvitationCreationResult = {
  invitation_id: string
  token: string
  email: string
  organization_id: string
  role: 'admin' | 'user'
  expires_at: string
}

type InvitationEmailPayload = {
  to: string
  token: string
  organizationName: string
  role: 'admin' | 'user'
  inviterName: string
  expiresAt: string
}

const isMissingAssignUserRpcError = (error: any) => {
  const errorText = [
    error?.code,
    error?.message,
    error?.details,
    error?.hint
  ].filter(Boolean).join(' ')

  return (
    error?.code === 'PGRST202' ||
    (
      errorText.includes('assign_user_to_organization') &&
      (
        errorText.includes('Could not find') ||
        errorText.includes('schema cache') ||
        errorText.includes('function')
      )
    )
  )
}

const parseEmailResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text ? { error: text } : {}
}

const sendInvitationEmail = async (
  payload: InvitationEmailPayload,
  supabaseUrl: string,
  supabaseAnonKey: string
) => {
  const endpoints = [
    {
      name: 'Supabase Edge Function',
      url: `${supabaseUrl}/functions/v1/send-invitation-email`,
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'Netlify Function',
      url: '/.netlify/functions/send-invitation-email',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  ]

  let lastError = 'Email service unavailable'

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: endpoint.headers,
        body: JSON.stringify(payload)
      })

      const responseData = await parseEmailResponse(response)

      if (response.ok) {
        return {
          sent: true,
          data: responseData,
          endpoint: endpoint.name,
          error: null
        }
      }

      lastError = responseData.error || `${endpoint.name} returned ${response.status}`
      console.warn(`Failed to send email using ${endpoint.name}:`, lastError, responseData)

      if (response.status !== 404) {
        break
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : `Failed to call ${endpoint.name}`
      console.warn(`Email endpoint ${endpoint.name} failed:`, error)
    }
  }

  return {
    sent: false,
    data: null,
    endpoint: null,
    error: lastError
  }
}

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
  const createOrganization = async (name: string, makeSuperAdmin: boolean = false) => {
    if (!user) throw new Error('User not authenticated')

    try {
      // Ensure user profile exists first
      const profile = await ensureUserProfile()
      if (!profile) {
        throw new Error('Failed to create user profile')
      }

      console.log('Creating organization with profile:', profile)

      // Call the atomic database function
      const { data, error } = await supabase.rpc('create_organization_with_admin', {
        p_organization_name: name,
        p_user_id: profile.id,
        p_make_super_admin: makeSuperAdmin
      })

      if (error) {
        console.error('Organization creation error:', error)
        throw error
      }

      console.log('Organization created successfully:', data)

      // Fetch the newly created organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', data.organization_id)
        .single()

      if (orgError) {
        console.error('Error fetching organization:', orgError)
        throw orgError
      }

      // Fetch the updated profile
      const { data: updatedProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', profile.id)
        .single()

      if (profileError) {
        console.error('Error fetching updated profile:', profileError)
        throw profileError
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
    if (!userProfile) throw new Error('User profile not found')
    const normalizedEmail = inviteData.email.trim().toLowerCase()

    const createInvitationDirectly = async (
      organizationId: string
    ): Promise<InvitationCreationResult> => {
      const { data: existingUsers, error: existingUserError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', normalizedEmail)
        .eq('organization_id', organizationId)
        .limit(1)

      if (existingUserError) throw existingUserError
      if (existingUsers && existingUsers.length > 0) {
        throw new Error('User already exists in this organization')
      }

      const { data: existingInvitations, error: existingInvitationError } = await supabase
        .from('user_invitations')
        .select('id, email, role, organization_id, token, expires_at')
        .eq('email', normalizedEmail)
        .eq('organization_id', organizationId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)

      if (existingInvitationError) throw existingInvitationError
      if (existingInvitations && existingInvitations.length > 0) {
        const invitation = existingInvitations[0]
        return {
          invitation_id: invitation.id,
          token: invitation.token,
          email: invitation.email,
          organization_id: invitation.organization_id,
          role: invitation.role,
          expires_at: invitation.expires_at
        }
      }

      const { data: invitation, error: invitationError } = await supabase
        .from('user_invitations')
        .insert({
          email: normalizedEmail,
          role: inviteData.role,
          organization_id: organizationId,
          invited_by: userProfile.id
        })
        .select('id, email, role, organization_id, token, expires_at')
        .single()

      if (invitationError) throw invitationError

      return {
        invitation_id: invitation.id,
        token: invitation.token,
        email: invitation.email,
        organization_id: invitation.organization_id,
        role: invitation.role,
        expires_at: invitation.expires_at
      }
    }

    // Determine target organization
    let targetOrgId: string | undefined
    let targetOrgName = ''

    // Handle new organization creation for super admins
    if (inviteData.create_new_organization && inviteData.new_organization_name) {
      if (!userProfile.is_super_admin) {
        throw new Error('Only super admins can create new organizations')
      }

      // Create new organization first
      const newOrg = await createOrganization(inviteData.new_organization_name, false)
      targetOrgId = newOrg.id
      targetOrgName = newOrg.name
    } else {
      // Use specified organization (super admin) or current organization (regular admin)
      if (inviteData.organization_id) {
        if (!userProfile.is_super_admin && inviteData.organization_id !== userProfile.organization_id) {
          throw new Error('You can only invite users to your own organization')
        }
        targetOrgId = inviteData.organization_id
      } else {
        if (!userProfile.organization_id) {
          throw new Error('No organization found')
        }
        targetOrgId = userProfile.organization_id
      }

      // Fetch organization name
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', targetOrgId)
        .single()

      if (orgError || !orgData) {
        throw new Error('Organization not found')
      }
      targetOrgName = orgData.name
    }

    // Check permissions
    if (!userProfile.is_super_admin && !['master_admin', 'admin'].includes(userProfile.role)) {
      throw new Error('Insufficient permissions to invite users')
    }

    try {
      // Use the database function for better validation
      const { data: rpcData, error } = await supabase.rpc('assign_user_to_organization', {
        p_user_email: normalizedEmail,
        p_organization_id: targetOrgId,
        p_role: inviteData.role,
        p_invited_by_user_id: userProfile.id
      })

      let data = rpcData as InvitationCreationResult | null

      if (error) {
        if (!targetOrgId || !isMissingAssignUserRpcError(error)) {
          throw error
        }

        console.warn(
          'assign_user_to_organization RPC is unavailable; falling back to direct invitation insert.',
          error
        )
        data = await createInvitationDirectly(targetOrgId)
      }

      if (!data) {
        throw new Error('Invitation could not be created')
      }

      console.log('Invitation created:', data)

      // Send email invitation
      let emailSent = false
      let emailError: string | null = null

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

        const emailResult = await sendInvitationEmail(
          {
            to: normalizedEmail,
            token: data.token,
            organizationName: targetOrgName,
            role: inviteData.role,
            inviterName: userProfile.full_name || userProfile.email,
            expiresAt: data.expires_at
          },
          supabaseUrl,
          supabaseAnonKey
        )

        if (emailResult.sent) {
          emailSent = true
          console.log(`Invitation email sent successfully via ${emailResult.endpoint}:`, emailResult.data)
        } else {
          emailError = emailResult.error
          console.warn('Failed to send email:', emailError)
        }
      } catch (err) {
        emailError = err instanceof Error ? err.message : 'Failed to send email'
        console.warn('Email sending failed:', err)
      }

      await fetchInvitations()

      // Return invitation data with email status
      return {
        id: data.invitation_id,
        email: data.email,
        role: data.role,
        organization_id: data.organization_id,
        token: data.token,
        expires_at: data.expires_at,
        invited_by: userProfile.id,
        accepted_at: null,
        created_at: new Date().toISOString(),
        emailSent,
        emailError
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to invite user')
    }
  }

  // Accept invitation
  const acceptInvitation = async (token: string, password: string) => {
    try {
      // Get invitation details via RPC (bypasses RLS for anonymous access)
      const { data: invitation, error: inviteError } = await supabase
        .rpc('get_invitation_by_token', { p_token: token })

      if (inviteError) throw new Error('Invalid or expired invitation')

      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password
      })

      if (signUpError) throw signUpError
      if (!authData.user) throw new Error('Failed to create user')

      // Accept invitation via RPC (assigns org/role and marks accepted)
      const { error: acceptError } = await supabase
        .rpc('accept_user_invitation', { p_token: token, p_user_id: authData.user.id })

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

  const isAdmin = userProfile?.role === 'super_admin' || userProfile?.role === 'master_admin' || userProfile?.role === 'admin'
  const isMasterAdmin = userProfile?.role === 'master_admin' || userProfile?.role === 'super_admin'
  const isSuperAdmin = userProfile?.is_super_admin === true

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
    isSuperAdmin,
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