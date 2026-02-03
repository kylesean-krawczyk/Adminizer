import { supabase } from '../lib/supabase'

export interface SchemaValidationResult {
  valid: boolean
  missingColumns: string[]
  missingTables: string[]
  errors: string[]
}

export interface RequiredColumn {
  table: string
  column: string
  required: boolean
}

const REQUIRED_SCHEMA: RequiredColumn[] = [
  { table: 'organizations', column: 'id', required: true },
  { table: 'organizations', column: 'name', required: true },
  { table: 'organizations', column: 'enabled_verticals', required: true },
  { table: 'organizations', column: 'vertical', required: true },
  { table: 'user_profiles', column: 'id', required: true },
  { table: 'user_profiles', column: 'email', required: true },
  { table: 'user_profiles', column: 'organization_id', required: false },
  { table: 'user_profiles', column: 'active_vertical', required: true },
  { table: 'user_profiles', column: 'role', required: true },
  { table: 'documents', column: 'id', required: true },
  { table: 'documents', column: 'name', required: true },
  { table: 'documents', column: 'organization_id', required: false }
]

export async function validateDatabaseSchema(): Promise<SchemaValidationResult> {
  const result: SchemaValidationResult = {
    valid: true,
    missingColumns: [],
    missingTables: [],
    errors: []
  }

  try {
    const tablesByName = new Map<string, Set<string>>()

    for (const schema of REQUIRED_SCHEMA) {
      if (!tablesByName.has(schema.table)) {
        tablesByName.set(schema.table, new Set())
      }
      tablesByName.get(schema.table)!.add(schema.column)
    }

    for (const [tableName, columns] of tablesByName.entries()) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select(Array.from(columns).join(','))
          .limit(0)

        if (error) {
          if (error.message.includes('does not exist') || error.code === '42P01') {
            result.missingTables.push(tableName)
            result.valid = false
          } else if (error.message.includes('column') && error.message.includes('does not exist')) {
            const columnMatch = error.message.match(/column "([^"]+)" does not exist/)
            if (columnMatch) {
              result.missingColumns.push(`${tableName}.${columnMatch[1]}`)
              result.valid = false
            }
          } else {
            result.errors.push(`${tableName}: ${error.message}`)
            result.valid = false
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        result.errors.push(`${tableName}: ${errorMsg}`)
        result.valid = false
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    result.errors.push(`Schema validation failed: ${errorMsg}`)
    result.valid = false
  }

  return result
}

export async function checkColumnExists(
  tableName: string,
  columnName: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(0)

    return !error
  } catch {
    return false
  }
}

export async function getSchemaHealth(): Promise<{
  healthy: boolean
  details: string
  timestamp: string
}> {
  const validation = await validateDatabaseSchema()

  let details = 'Database schema is healthy'

  if (!validation.valid) {
    const issues: string[] = []

    if (validation.missingTables.length > 0) {
      issues.push(`Missing tables: ${validation.missingTables.join(', ')}`)
    }

    if (validation.missingColumns.length > 0) {
      issues.push(`Missing columns: ${validation.missingColumns.join(', ')}`)
    }

    if (validation.errors.length > 0) {
      issues.push(`Errors: ${validation.errors.join('; ')}`)
    }

    details = issues.join(' | ')
  }

  return {
    healthy: validation.valid,
    details,
    timestamp: new Date().toISOString()
  }
}
