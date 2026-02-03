/**
 * Profile Error Types and Utilities
 *
 * Defines standardized error codes, error objects, and retry configuration
 * for user profile initialization and recovery operations.
 */

export type ProfileErrorCode =
  | 'PROFILE_NOT_FOUND'
  | 'PROFILE_CREATE_FAILED'
  | 'RLS_PERMISSION_DENIED'
  | 'TRIGGER_NOT_EXECUTED'
  | 'NETWORK_TIMEOUT'
  | 'SESSION_INVALID'
  | 'DATABASE_ERROR'
  | 'UNKNOWN_ERROR'
  | 'MANUAL_CREATION_FAILED'
  | 'MAX_RETRIES_EXCEEDED'

export interface ProfileError {
  code: ProfileErrorCode
  message: string
  userMessage: string
  technicalDetails?: string
  timestamp: Date
  retryable: boolean
  retryCount?: number
  originalError?: unknown
}

export interface ProfileRecoveryState {
  isRecovering: boolean
  currentAttempt: number
  maxAttempts: number
  lastError: ProfileError | null
  recoveryMethod: 'automatic' | 'manual' | null
}

export interface RetryConfig {
  maxAttempts: number
  delays: number[] // milliseconds for each retry attempt
  timeout: number // milliseconds per attempt
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delays: [0, 1000, 3000], // immediate, 1s, 3s
  timeout: 10000 // 10 seconds per attempt
}

/**
 * Error code to user-friendly message mapping
 */
export const ERROR_MESSAGES: Record<ProfileErrorCode, string> = {
  PROFILE_NOT_FOUND: 'Your profile could not be found. We\'ll create one for you.',
  PROFILE_CREATE_FAILED: 'We encountered an issue setting up your profile.',
  RLS_PERMISSION_DENIED: 'There was a permissions issue accessing your profile.',
  TRIGGER_NOT_EXECUTED: 'Automatic profile setup did not complete.',
  NETWORK_TIMEOUT: 'The request took too long to complete. Please check your connection.',
  SESSION_INVALID: 'Your session has expired. Please sign in again.',
  DATABASE_ERROR: 'A database error occurred. Our team has been notified.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  MANUAL_CREATION_FAILED: 'Manual profile creation failed. Please contact support.',
  MAX_RETRIES_EXCEEDED: 'We\'ve tried multiple times but couldn\'t complete setup. Please try again or contact support.'
}

/**
 * Error code to technical troubleshooting hints
 */
export const ERROR_TROUBLESHOOTING: Record<ProfileErrorCode, string> = {
  PROFILE_NOT_FOUND: 'Check if user exists in auth.users table. Verify trigger is active.',
  PROFILE_CREATE_FAILED: 'Check RLS policies on user_profiles table. Verify foreign key constraints.',
  RLS_PERMISSION_DENIED: 'Verify RLS policies allow authenticated users to read their own profile.',
  TRIGGER_NOT_EXECUTED: 'Check if on_auth_user_created trigger exists and is enabled.',
  NETWORK_TIMEOUT: 'Check network connection. Verify Supabase endpoint is accessible.',
  SESSION_INVALID: 'User session may have expired. Call supabase.auth.refreshSession().',
  DATABASE_ERROR: 'Check PostgreSQL logs for detailed error information.',
  UNKNOWN_ERROR: 'Enable detailed logging to capture more context.',
  MANUAL_CREATION_FAILED: 'Check create_user_profile_manual RPC function logs.',
  MAX_RETRIES_EXCEEDED: 'Review admin_alerts table for detailed failure information.'
}

/**
 * Determines if an error is retryable
 */
export function isRetryableError(code: ProfileErrorCode): boolean {
  const nonRetryableErrors: ProfileErrorCode[] = [
    'SESSION_INVALID',
    'MANUAL_CREATION_FAILED',
    'MAX_RETRIES_EXCEEDED'
  ]
  return !nonRetryableErrors.includes(code)
}

/**
 * Creates a standardized ProfileError object
 */
export function createProfileError(
  code: ProfileErrorCode,
  technicalDetails?: string,
  originalError?: unknown,
  retryCount?: number
): ProfileError {
  return {
    code,
    message: ERROR_MESSAGES[code],
    userMessage: ERROR_MESSAGES[code],
    technicalDetails,
    timestamp: new Date(),
    retryable: isRetryableError(code),
    retryCount,
    originalError
  }
}

/**
 * Extracts error code from error object
 */
export function extractErrorCode(error: unknown): ProfileErrorCode {
  if (typeof error === 'object' && error !== null) {
    const err = error as { code?: string; message?: string }

    // Check for specific PostgreSQL error codes
    if (err.code === 'PGRST116') return 'PROFILE_NOT_FOUND'
    if (err.code === '42501') return 'RLS_PERMISSION_DENIED'
    if (err.code === 'PGRST301') return 'RLS_PERMISSION_DENIED'

    // Check for timeout errors
    if (err.message?.toLowerCase().includes('timeout')) return 'NETWORK_TIMEOUT'

    // Check for auth errors
    if (err.message?.toLowerCase().includes('jwt') ||
        err.message?.toLowerCase().includes('session')) {
      return 'SESSION_INVALID'
    }

    // Check for database errors
    if (err.message?.toLowerCase().includes('database') ||
        err.message?.toLowerCase().includes('postgres')) {
      return 'DATABASE_ERROR'
    }
  }

  return 'UNKNOWN_ERROR'
}

/**
 * Formats error for logging to admin alerts
 */
export function formatErrorForAlert(error: ProfileError): {
  error_message: string
  error_code: string
  stack_trace: string
} {
  return {
    error_message: `${error.message}${error.technicalDetails ? ': ' + error.technicalDetails : ''}`,
    error_code: error.code,
    stack_trace: JSON.stringify({
      code: error.code,
      message: error.message,
      technicalDetails: error.technicalDetails,
      timestamp: error.timestamp.toISOString(),
      retryCount: error.retryCount,
      originalError: error.originalError instanceof Error
        ? {
            name: error.originalError.name,
            message: error.originalError.message,
            stack: error.originalError.stack
          }
        : String(error.originalError)
    }, null, 2)
  }
}

/**
 * Creates initial recovery state
 */
export function createInitialRecoveryState(): ProfileRecoveryState {
  return {
    isRecovering: false,
    currentAttempt: 0,
    maxAttempts: DEFAULT_RETRY_CONFIG.maxAttempts,
    lastError: null,
    recoveryMethod: null
  }
}

/**
 * Sleep utility for retry delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Format retry attempt message for user
 */
export function getRetryMessage(attempt: number, maxAttempts: number): string {
  if (attempt === 1) return 'Loading your profile...'
  if (attempt === 2) return 'Retrying connection...'
  if (attempt === maxAttempts) return 'Finalizing setup...'
  return `Attempt ${attempt} of ${maxAttempts}...`
}

/**
 * Get support contact information based on error
 */
export function getSupportInfo(error: ProfileError): {
  shouldShowSupport: boolean
  supportMessage: string
} {
  const criticalErrors: ProfileErrorCode[] = [
    'MAX_RETRIES_EXCEEDED',
    'MANUAL_CREATION_FAILED',
    'SESSION_INVALID'
  ]

  return {
    shouldShowSupport: criticalErrors.includes(error.code),
    supportMessage: 'If this problem persists, please contact your administrator with the error details.'
  }
}
