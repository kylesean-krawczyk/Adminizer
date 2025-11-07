# Troubleshooting Guide - Database Errors

## Quick Diagnosis

If you see "Database error querying schema" or similar errors during login:

### Step 1: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages with detailed information
4. Note the specific table/column mentioned

### Step 2: Verify Database Schema

The error usually means a required column is missing. Check these critical columns:

**organizations table**:
- `id` (uuid)
- `name` (text)
- `enabled_verticals` (text array)
- `vertical` (text)

**user_profiles table**:
- `id` (uuid)
- `email` (text)
- `organization_id` (uuid)
- `active_vertical` (text)
- `role` (text)

### Step 3: Quick Verification

Run this in Supabase SQL Editor:

```sql
-- Check organizations table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'organizations'
ORDER BY column_name;

-- Check user_profiles table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY column_name;
```

### Step 4: Add Missing Columns

If columns are missing, execute the corresponding SQL:

**For missing enabled_verticals**:
```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'enabled_verticals'
  ) THEN
    ALTER TABLE organizations
    ADD COLUMN enabled_verticals TEXT[] DEFAULT '{church,business,estate}';
  END IF;
END $$;

UPDATE organizations
SET enabled_verticals = '{church,business,estate}'
WHERE enabled_verticals IS NULL;
```

**For missing active_vertical**:
```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'active_vertical'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN active_vertical TEXT DEFAULT 'church'
    CHECK (active_vertical IN ('church', 'business', 'estate'));
  END IF;
END $$;

UPDATE user_profiles
SET active_vertical = 'church'
WHERE active_vertical IS NULL;
```

## Common Error Patterns

### Error: "column does not exist"

**Example**: `column organizations.enabled_verticals does not exist`

**Cause**: Code is querying a column that hasn't been added to the database.

**Fix**: Execute the SQL to add the missing column (see Step 4 above).

### Error: "relation does not exist"

**Example**: `relation "public.organizations" does not exist`

**Cause**: An entire table is missing.

**Fix**: Run the full migration files in order from `supabase/migrations/`.

### Error: "permission denied"

**Example**: `permission denied for table organizations`

**Cause**: Row Level Security (RLS) is blocking the query.

**Fix**: Check RLS policies in Supabase dashboard:

```sql
-- View current policies
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'organizations'
ORDER BY policyname;

-- Temporarily disable RLS for testing (NOT for production!)
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
```

### Error: Silent failure with no data returned

**Cause**: RLS policy exists but doesn't match the user's context.

**Fix**: Ensure user has an organization_id:

```sql
SELECT
  id,
  email,
  organization_id,
  active_vertical
FROM user_profiles
WHERE email = 'your-email@example.com';
```

If `organization_id` is NULL, the user can't access organization data.

## Prevention Checklist

Before making schema changes:

- [ ] Review existing schema with `SELECT * FROM information_schema.columns WHERE table_name = 'your_table'`
- [ ] Write SQL with conditional logic (IF NOT EXISTS)
- [ ] Test in Supabase SQL Editor first
- [ ] Add corresponding migration file
- [ ] Update code with defensive error handling
- [ ] Test with both existing and new users
- [ ] Document the change

## Emergency Recovery

If the application is completely broken:

1. **Check current schema state**
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

2. **Identify what's missing**
   - Compare with migration files
   - Check error messages in console
   - Review recent changes

3. **Apply fixes in order**
   - Start with base tables (organizations, user_profiles)
   - Add required columns
   - Update default values
   - Test after each change

4. **Verify RLS policies**
   ```sql
   -- Check if RLS is enabled
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```

5. **Test critical paths**
   - User login
   - Profile loading
   - Organization access
   - Document queries

## Using Schema Validator

The project includes a schema validation utility. Use it to diagnose issues:

```typescript
import { validateDatabaseSchema } from './utils/schemaValidator'

// In your code (e.g., admin panel or startup check)
const result = await validateDatabaseSchema()

if (!result.valid) {
  console.error('Schema validation failed!')
  console.error('Missing tables:', result.missingTables)
  console.error('Missing columns:', result.missingColumns)
  console.error('Errors:', result.errors)
}
```

Add this check to your application startup or create an admin diagnostic page.

## Getting Help

When reporting database errors, include:

1. **Error message** from browser console
2. **Query** that's failing (check console logs)
3. **Schema state** (output of column check SQL)
4. **RLS policies** (output of policies check)
5. **User context** (is user logged in? has organization?)
6. **Recent changes** (what was changed before error appeared)

## Related Documentation

- `DATABASE_WORKFLOW.md` - Full workflow guide
- `supabase/migrations/` - All migration files
- `src/utils/schemaValidator.ts` - Schema validation utility
- `src/contexts/VerticalContext.tsx` - Code that loads organization data
- `src/contexts/AuthContext.tsx` - Code that loads user profiles

## Quick Commands

```bash
# Build the project
npm run build

# Run in dev mode
npm run dev

# Check for TypeScript errors
npx tsc --noEmit
```

## Best Practice: Defensive Coding

Always write queries that handle missing data:

```typescript
// GOOD: Handles errors and missing columns
const { data: org, error } = await supabase
  .from('organizations')
  .select('enabled_verticals, vertical')
  .eq('id', orgId)
  .maybeSingle()

if (error) {
  console.error('Database error:', error)
  return DEFAULT_VERTICALS // Use fallback
}

const verticals = org?.enabled_verticals || DEFAULT_VERTICALS

// BAD: Assumes everything exists
const { data: org } = await supabase
  .from('organizations')
  .select('enabled_verticals, vertical')
  .eq('id', orgId)
  .single() // Throws if not found

const verticals = org.enabled_verticals // Crashes if org is null
```

## Summary

Most database errors can be resolved by:

1. Identifying the missing column/table from error messages
2. Adding it via Supabase SQL Editor
3. Updating the corresponding migration file
4. Adding defensive error handling in code
5. Testing thoroughly

Following the workflow in `DATABASE_WORKFLOW.md` prevents these issues from occurring in the first place.
