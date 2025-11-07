# Database Workflow for Bolt Environment

## Overview

This project uses a **hybrid database workflow** where Bolt.new is directly connected to a Supabase database. Understanding how to manage schema changes is critical to avoid errors like "Database error querying schema".

## Architecture

```
Bolt Environment → Direct Connection → Supabase Database
                                            ↑
Local Development → Migration Files ────────┘
```

## Key Principles

### 1. Bolt Makes Direct Database Changes

When you make database-related changes in Bolt, these changes are applied **directly** to your Supabase database. This means:

- Schema changes happen immediately in production
- No migration files are automatically generated
- Changes persist across Bolt sessions
- Local migrations can cause conflicts if run after Bolt changes

### 2. Migration Files as Documentation

Migration files in `supabase/migrations/` serve as:

- **Historical record** of schema changes
- **Documentation** for what columns/tables exist
- **Recovery mechanism** if you need to recreate the database
- **Reference** for understanding the schema evolution

### 3. Never Run Local Migrations Against Production

**CRITICAL**: Do NOT run Supabase CLI migrations locally against the production database that Bolt uses. This will:

- Create conflicts with existing schema
- Potentially delete progress
- Cause duplicate constraint errors
- Break the application

## Workflow Guide

### Making Schema Changes in Bolt

When you need to add/modify database schema:

1. **Execute SQL directly in Supabase Dashboard**
   - Log into [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Navigate to SQL Editor
   - Write and execute your SQL
   - Test the changes

2. **Document the change in a migration file**
   - Create a new migration file in `supabase/migrations/`
   - Use timestamp naming: `YYYYMMDDHHMMSS_descriptive_name.sql`
   - Include the exact SQL you executed
   - Add comprehensive comments explaining the change

3. **Update code that depends on the schema**
   - Add defensive checks for new columns
   - Handle missing data gracefully
   - Test error scenarios

### Example Migration File Structure

```sql
/*
  # Add Feature X Support

  ## Summary
  This migration adds support for feature X by adding columns Y and Z.

  ## Changes
  1. New Columns
    - `table.column_name` (type) - description

  2. Security
    - RLS policy changes

  ## Dependencies
  - VerticalContext.tsx requires enabled_verticals column
  - AuthContext.tsx requires active_vertical column
*/

-- Add column with conditional logic to prevent errors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'table_name' AND column_name = 'column_name'
  ) THEN
    ALTER TABLE table_name
    ADD COLUMN column_name type DEFAULT 'value';
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_name ON table_name(column_name);
```

## Schema Validation

The project includes a schema validation utility at `src/utils/schemaValidator.ts`:

### Using Schema Validation

```typescript
import { validateDatabaseSchema, getSchemaHealth } from '../utils/schemaValidator'

// Full validation
const result = await validateDatabaseSchema()
console.log('Valid:', result.valid)
console.log('Missing columns:', result.missingColumns)
console.log('Missing tables:', result.missingTables)
console.log('Errors:', result.errors)

// Quick health check
const health = await getSchemaHealth()
console.log('Healthy:', health.healthy)
console.log('Details:', health.details)
```

### When to Validate

- After making schema changes in Supabase dashboard
- Before deploying new features that depend on schema
- When debugging "Database error" issues
- During application startup (optional)

## Common Issues and Solutions

### Issue: "Database error querying schema"

**Cause**: Code is trying to access a column that doesn't exist in the database.

**Solution**:
1. Check browser console for specific error details
2. Identify which query is failing
3. Verify the column exists in Supabase dashboard
4. If missing, execute the SQL to add it
5. Add defensive error handling in the code

### Issue: Migration conflicts

**Cause**: Running local migrations after Bolt has already made changes.

**Solution**:
1. Never run `supabase db push` or `supabase migration up` against production
2. Use migration files as reference only
3. Make changes via Supabase dashboard SQL editor
4. Keep migration files in sync manually

### Issue: RLS policy blocking queries

**Cause**: Row Level Security policies preventing data access.

**Solution**:
1. Check policies in Supabase dashboard
2. Test queries in SQL Editor with proper role context
3. Add logging to identify which policy is blocking
4. Update policies as needed

## Best Practices

### 1. Always Use Conditional Logic

```sql
-- GOOD: Won't fail if column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'my_table' AND column_name = 'my_column'
  ) THEN
    ALTER TABLE my_table ADD COLUMN my_column TEXT;
  END IF;
END $$;

-- BAD: Will fail if column exists
ALTER TABLE my_table ADD COLUMN my_column TEXT;
```

### 2. Add Defensive Code

```typescript
// GOOD: Handles missing columns gracefully
const { data: org, error } = await supabase
  .from('organizations')
  .select('enabled_verticals, vertical')
  .maybeSingle()

if (error) {
  console.error('Database error:', error)
  // Use fallback values
}

const verticals = org?.enabled_verticals || ['church', 'business', 'estate']
```

### 3. Test Schema Changes

After making changes:

1. **Verify in SQL Editor**
   ```sql
   SELECT column_name, data_type, column_default
   FROM information_schema.columns
   WHERE table_name = 'your_table';
   ```

2. **Test queries that use new columns**
   ```sql
   SELECT * FROM your_table LIMIT 1;
   ```

3. **Check RLS policies allow access**
   ```sql
   -- Test as authenticated user
   SET LOCAL role TO authenticated;
   SET LOCAL request.jwt.claims TO '{"sub": "user-id-here"}';
   SELECT * FROM your_table;
   ```

### 4. Document Dependencies

In migration files, always note which code depends on the schema:

```sql
/*
  ## Code Dependencies
  - src/contexts/VerticalContext.tsx:84-88 - queries enabled_verticals
  - src/hooks/useVerticalSwitcher.ts:45-49 - queries enabled_verticals
  - src/components/Settings/VerticalConfigurationSettings.tsx - displays verticals
*/
```

## Troubleshooting Checklist

When encountering database errors:

- [ ] Check browser console for error details
- [ ] Verify column exists in Supabase dashboard
- [ ] Check if RLS policy is blocking access
- [ ] Test query in Supabase SQL Editor
- [ ] Review migration files for expected schema
- [ ] Run schema validation utility
- [ ] Check if defensive error handling exists in code
- [ ] Verify default values are set for new columns
- [ ] Test with both existing and new user accounts

## Schema Health Monitoring

Consider adding a health check endpoint or admin panel that displays:

- Database connection status
- Required columns present/missing
- RLS policy status
- Last schema validation timestamp
- Recent error patterns

This helps quickly diagnose issues before they affect users.

## Recovery Procedures

### If Schema Becomes Corrupted

1. **Backup current database**
   ```bash
   # Use Supabase dashboard to create backup
   ```

2. **Identify missing schema elements**
   ```typescript
   const validation = await validateDatabaseSchema()
   console.log(validation)
   ```

3. **Re-apply missing migrations**
   - Review migration files
   - Execute missing SQL in Supabase dashboard
   - Verify with schema validation

4. **Test application thoroughly**
   - Login flow
   - Data retrieval
   - User creation
   - Organization setup

## Version Control

- **DO** commit migration files
- **DO** commit schema documentation
- **DO** commit code that references schema
- **DO NOT** commit database dumps
- **DO NOT** commit `.env` files with credentials

## Summary

The key to success with this workflow:

1. **Schema changes = Supabase dashboard + migration file**
2. **Never run local migrations against production**
3. **Always add defensive error handling**
4. **Use conditional logic in all migrations**
5. **Document dependencies between code and schema**
6. **Test changes thoroughly before committing**

Following these practices will prevent "Database error querying schema" and similar issues.
