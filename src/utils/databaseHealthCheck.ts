import { supabase } from '../lib/supabase'

export interface HealthCheckResult {
  healthy: boolean
  checks: {
    name: string
    passed: boolean
    error?: string
    details?: any
  }[]
  timestamp: string
}

/**
 * Performs a comprehensive health check of the database schema and connectivity
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const checks: HealthCheckResult['checks'] = []
  const timestamp = new Date().toISOString()

  // Check 1: Can we connect to Supabase?
  try {
    const { data, error } = await supabase.auth.getSession()
    checks.push({
      name: 'Supabase Connection',
      passed: !error,
      error: error?.message,
      details: { hasSession: !!data.session }
    })
  } catch (error) {
    checks.push({
      name: 'Supabase Connection',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Check 2: Can we query user_profiles table?
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)

    checks.push({
      name: 'user_profiles table access',
      passed: !error,
      error: error?.message,
      details: { canQuery: !error, rowCount: data?.length || 0 }
    })
  } catch (error) {
    checks.push({
      name: 'user_profiles table access',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Check 3: Can we query organizations table?
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)

    checks.push({
      name: 'organizations table access',
      passed: !error,
      error: error?.message,
      details: { canQuery: !error, rowCount: data?.length || 0 }
    })
  } catch (error) {
    checks.push({
      name: 'organizations table access',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Check 4: Can we query documents table?
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('id')
      .limit(1)

    checks.push({
      name: 'documents table access',
      passed: !error,
      error: error?.message,
      details: { canQuery: !error, rowCount: data?.length || 0 }
    })
  } catch (error) {
    checks.push({
      name: 'documents table access',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Check 5: Verify environment variables
  const hasSupabaseUrl = !!import.meta.env.VITE_SUPABASE_URL
  const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY
  checks.push({
    name: 'Environment variables',
    passed: hasSupabaseUrl && hasSupabaseKey,
    details: {
      VITE_SUPABASE_URL: hasSupabaseUrl ? 'Set' : 'Missing',
      VITE_SUPABASE_ANON_KEY: hasSupabaseKey ? 'Set' : 'Missing',
      VITE_DEMO_MODE: import.meta.env.VITE_DEMO_MODE || 'Not set'
    }
  })

  const allPassed = checks.every(check => check.passed)

  return {
    healthy: allPassed,
    checks,
    timestamp
  }
}

/**
 * Quick check to see if database is accessible
 */
export async function quickHealthCheck(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)
    return !error
  } catch {
    return false
  }
}

/**
 * Log health check results to console
 */
export async function logHealthCheck(): Promise<void> {
  const result = await performHealthCheck()

  console.group('🏥 Database Health Check')
  console.log('Overall Status:', result.healthy ? '✅ Healthy' : '❌ Unhealthy')
  console.log('Timestamp:', result.timestamp)
  console.log('\nChecks:')

  result.checks.forEach(check => {
    const icon = check.passed ? '✅' : '❌'
    console.group(`${icon} ${check.name}`)
    if (check.error) {
      console.error('Error:', check.error)
    }
    if (check.details) {
      console.log('Details:', check.details)
    }
    console.groupEnd()
  })

  console.groupEnd()
}
