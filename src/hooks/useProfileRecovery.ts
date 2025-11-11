/**
 * Profile Recovery Hook
 *
 * Provides automatic retry logic and manual fallback options for
 * user profile creation and recovery.
 */

import { useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  ProfileError,
  ProfileRecoveryState,
  createProfileError,
  createInitialRecoveryState,
  extractErrorCode,
  formatErrorForAlert,
  sleep,
  DEFAULT_RETRY_CONFIG,
  type RetryConfig
} from '../types/profileErrors'
import type { UserProfile } from '../types/user'

interface UseProfileRecoveryResult {
  recoveryState: ProfileRecoveryState
  retryProfileCreation: (userId: string, email: string) => Promise<UserProfile | null>
  createProfileManually: (userId: string, email?: string, vertical?: string) => Promise<UserProfile | null>
  resetRecovery: () => void
  logErrorToAdmins: (userId: string, email: string, error: ProfileError) => Promise<void>
}

export const useProfileRecovery = (
  config: Partial<RetryConfig> = {}
): UseProfileRecoveryResult => {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  const [recoveryState, setRecoveryState] = useState<ProfileRecoveryState>(
    createInitialRecoveryState()
  )
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Attempts to fetch existing profile with timeout
   */
  const fetchProfileWithTimeout = async (
    userId: string,
    timeoutMs: number
  ): Promise<UserProfile | null> => {
    abortControllerRef.current = new AbortController()
    const timeoutId = setTimeout(() => abortControllerRef.current?.abort(), timeoutMs)

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      clearTimeout(timeoutId)

      if (error) {
        console.error('Error fetching profile:', error)
        throw error
      }

      return data
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * Attempts to create profile via trigger retry
   */
  const attemptProfileCreation = async (
    userId: string,
    email: string
  ): Promise<UserProfile | null> => {
    // First check if profile exists
    const existingProfile = await fetchProfileWithTimeout(userId, retryConfig.timeout)

    if (existingProfile) {
      console.log('Profile found on retry:', existingProfile)
      return existingProfile
    }

    // Profile doesn't exist - try to create it via insert
    // This will trigger the trigger if it hasn't run yet
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: email || '',
          role: 'user',
          is_active: true,
          active_vertical: 'church'
        })
        .select()
        .single()

      if (error) {
        // If it's a unique violation, profile was created elsewhere
        if (error.code === '23505') {
          const profile = await fetchProfileWithTimeout(userId, retryConfig.timeout)
          if (profile) return profile
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Error creating profile:', error)
      throw error
    }
  }

  /**
   * Retry profile creation with exponential backoff
   */
  const retryProfileCreation = useCallback(
    async (userId: string, email: string): Promise<UserProfile | null> => {
      setRecoveryState(prev => ({
        ...prev,
        isRecovering: true,
        currentAttempt: 0,
        recoveryMethod: 'automatic'
      }))

      for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
        try {
          console.log(`Profile recovery attempt ${attempt}/${retryConfig.maxAttempts}`)

          setRecoveryState(prev => ({
            ...prev,
            currentAttempt: attempt
          }))

          // Wait before retry (except first attempt)
          if (attempt > 1) {
            const delay = retryConfig.delays[attempt - 1] || 3000
            await sleep(delay)
          }

          // Attempt to create/fetch profile
          const profile = await attemptProfileCreation(userId, email)

          if (profile) {
            console.log('Profile recovery successful:', profile)
            setRecoveryState(prev => ({
              ...prev,
              isRecovering: false,
              lastError: null
            }))
            return profile
          }
        } catch (error) {
          console.error(`Attempt ${attempt} failed:`, error)

          const errorCode = extractErrorCode(error)
          const profileError = createProfileError(
            errorCode,
            error instanceof Error ? error.message : String(error),
            error,
            attempt
          )

          setRecoveryState(prev => ({
            ...prev,
            lastError: profileError
          }))

          // If this is the last attempt, give up
          if (attempt === retryConfig.maxAttempts) {
            const maxRetriesError = createProfileError(
              'MAX_RETRIES_EXCEEDED',
              `Failed after ${retryConfig.maxAttempts} attempts`,
              error,
              attempt
            )

            setRecoveryState(prev => ({
              ...prev,
              isRecovering: false,
              lastError: maxRetriesError
            }))

            // Log to admin alerts
            await logErrorToAdmins(userId, email, maxRetriesError)

            return null
          }

          // If error is not retryable, stop immediately
          if (!profileError.retryable) {
            setRecoveryState(prev => ({
              ...prev,
              isRecovering: false
            }))

            await logErrorToAdmins(userId, email, profileError)

            return null
          }
        }
      }

      return null
    },
    [retryConfig]
  )

  /**
   * Manually create profile using RPC function
   */
  const createProfileManually = useCallback(
    async (
      userId: string,
      email?: string,
      vertical: string = 'church'
    ): Promise<UserProfile | null> => {
      setRecoveryState(prev => ({
        ...prev,
        isRecovering: true,
        recoveryMethod: 'manual'
      }))

      try {
        console.log('Attempting manual profile creation for:', userId)

        const { data, error } = await supabase.rpc('create_user_profile_manual', {
          p_user_id: userId,
          p_email: email,
          p_active_vertical: vertical
        })

        if (error) {
          throw error
        }

        // Parse the JSONB response
        const result = data as { success: boolean; profile?: UserProfile; error?: string; error_code?: string }

        if (!result.success) {
          throw new Error(result.error || 'Manual profile creation failed')
        }

        console.log('Manual profile creation successful:', result.profile)

        setRecoveryState(prev => ({
          ...prev,
          isRecovering: false,
          lastError: null
        }))

        return result.profile || null
      } catch (error) {
        console.error('Manual profile creation failed:', error)

        const profileError = createProfileError(
          'MANUAL_CREATION_FAILED',
          error instanceof Error ? error.message : String(error),
          error
        )

        setRecoveryState(prev => ({
          ...prev,
          isRecovering: false,
          lastError: profileError
        }))

        // Log to admin alerts
        await logErrorToAdmins(userId, email || '', profileError)

        return null
      }
    },
    []
  )

  /**
   * Reset recovery state
   */
  const resetRecovery = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setRecoveryState(createInitialRecoveryState())
  }, [])

  /**
   * Log error to admin alerts
   */
  const logErrorToAdmins = useCallback(
    async (userId: string, email: string, error: ProfileError): Promise<void> => {
      try {
        const alertData = formatErrorForAlert(error)

        const { error: rpcError } = await supabase.rpc('log_profile_creation_failure', {
          p_user_id: userId,
          p_user_email: email,
          p_error_message: alertData.error_message,
          p_error_code: alertData.error_code,
          p_retry_count: error.retryCount || 0,
          p_stack_trace: alertData.stack_trace
        })

        if (rpcError) {
          console.error('Failed to log error to admin alerts:', rpcError)
        } else {
          console.log('Error logged to admin alerts for:', email)
        }
      } catch (err) {
        console.error('Exception logging to admin alerts:', err)
      }
    },
    []
  )

  return {
    recoveryState,
    retryProfileCreation,
    createProfileManually,
    resetRecovery,
    logErrorToAdmins
  }
}

/**
 * Check profile status using diagnostic function
 */
export const checkProfileStatus = async (userId?: string) => {
  try {
    const { data, error } = await supabase.rpc('check_profile_status', {
      p_user_id: userId || null
    })

    if (error) {
      console.error('Error checking profile status:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Exception checking profile status:', error)
    return null
  }
}

/**
 * Run comprehensive health check
 */
export const checkProfileHealth = async (userId?: string) => {
  try {
    const { data, error } = await supabase.rpc('check_user_profile_health', {
      p_user_id: userId || null
    })

    if (error) {
      console.error('Error checking profile health:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Exception checking profile health:', error)
    return null
  }
}
