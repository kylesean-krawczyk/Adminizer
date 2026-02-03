import { useState, useEffect, useCallback } from 'react'
import { checkTableExists } from '../services/departmentAssignmentService'

export type MigrationStatus = 'checking' | 'ready' | 'pending' | 'error'

interface UseMigrationStatusReturn {
  migrationStatus: MigrationStatus
  tableExists: boolean
  isReady: boolean
  recheckStatus: () => Promise<void>
  error: string | null
}

/**
 * Hook to check if department_section_assignments table exists
 * and track migration status with caching
 */
export const useMigrationStatus = (): UseMigrationStatusReturn => {
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>('checking')
  const [tableExists, setTableExists] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const CACHE_KEY = 'department_migration_status'
  const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

  /**
   * Checks the status and updates state
   */
  const checkStatus = useCallback(async () => {
    setMigrationStatus('checking')
    setError(null)

    try {
      const exists = await checkTableExists()

      setTableExists(exists)
      setMigrationStatus(exists ? 'ready' : 'pending')

      // Cache the result
      const cacheData = {
        exists,
        timestamp: Date.now()
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))

      if (!exists) {
        console.warn('[useMigrationStatus] Table not found - migration required')
      } else {
        console.log('[useMigrationStatus] Table exists - ready for use')
      }
    } catch (err) {
      console.error('[useMigrationStatus] Error checking status:', err)
      setMigrationStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to check migration status')
    }
  }, [])

  /**
   * Force recheck (bypasses cache)
   */
  const recheckStatus = useCallback(async () => {
    localStorage.removeItem(CACHE_KEY)
    await checkStatus()
  }, [checkStatus])

  /**
   * Check cached status on mount
   */
  useEffect(() => {
    const checkCachedStatus = async () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY)

        if (cached) {
          const { exists, timestamp } = JSON.parse(cached)
          const age = Date.now() - timestamp

          if (age < CACHE_DURATION) {
            // Use cached value
            setTableExists(exists)
            setMigrationStatus(exists ? 'ready' : 'pending')
            console.log('[useMigrationStatus] Using cached status:', exists ? 'ready' : 'pending')
            return
          }
        }
      } catch (err) {
        console.warn('[useMigrationStatus] Failed to read cache:', err)
      }

      // No valid cache - check live
      await checkStatus()
    }

    checkCachedStatus()
  }, [checkStatus])

  return {
    migrationStatus,
    tableExists,
    isReady: migrationStatus === 'ready',
    recheckStatus,
    error
  }
}
