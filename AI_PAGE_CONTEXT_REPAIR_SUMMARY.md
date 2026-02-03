# AI Page Context Table Repair Summary

## Problem Identified

The `ai_page_context` table in the database had a schema mismatch causing 400 errors when the TypeScript code attempted to insert or query data.

### Issues Found

1. **Column Name Mismatch**: Table had `route` instead of `page_route`
2. **Missing Columns**:
   - `organization_id` was missing
   - `page_url` was missing
   - `context_data` JSONB was missing
3. **Incorrect Structure**: Had separate `stats` (JSONB) and `recent_actions` (array) columns instead of unified `context_data`
4. **Incomplete RLS Policies**: Single "ALL" policy instead of granular SELECT/INSERT/UPDATE/DELETE policies
5. **Missing Indexes**: Only had primary key index, missing performance indexes
6. **No Validation**: Missing trigger-based validation

## Solution Implemented

### 1. Database Migration (`fix_ai_page_context_schema_v2`)

Created comprehensive migration that:
- Backed up existing data
- Dropped and recreated table with correct schema
- Migrated old data to new schema structure
- Added all required columns with proper constraints
- Created performance indexes
- Implemented granular RLS policies
- Added validation trigger with descriptive error messages

### 2. Enhanced TypeScript Service

Updated `contextTrackingService.ts` with:
- **Input Validation**: Validates all required fields before database operations
- **Data Sanitization**: Ensures data types and structure are correct
- **Detailed Logging**: Comprehensive logging with `[ContextTracking]` prefix for debugging
- **Error Handling**: Better error catching with specific error type handling
- **Null Safety**: Handles undefined/null values gracefully

## Database Schema (Corrected)

```sql
CREATE TABLE ai_page_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid,
  page_type text NOT NULL,
  page_route text NOT NULL,
  page_url text,
  context_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
```

### Columns

- `id`: Unique identifier
- `user_id`: Foreign key to auth.users (required)
- `organization_id`: Optional organization context
- `page_type`: Type of page (dashboard, documents, etc.) (required)
- `page_route`: URL path/route (required)
- `page_url`: Optional full URL with query params
- `context_data`: JSONB containing stats, filters, recentActions, entityId, entityType, timestamp
- `created_at`: Timestamp of context capture

### Indexes (6 total)

1. `ai_page_context_pkey` - Primary key on id
2. `idx_page_context_user_id` - Index on user_id
3. `idx_page_context_org_id` - Partial index on organization_id (where not null)
4. `idx_page_context_page_type` - Index on page_type
5. `idx_page_context_created_at` - Descending index on created_at
6. `idx_page_context_user_page_type` - Composite index on (user_id, page_type)

### RLS Policies (5 total)

1. **Users can view own page context** (SELECT)
   - Users can only see their own context entries

2. **Users can insert own page context** (INSERT)
   - Users can only create context for themselves

3. **Users can update own page context** (UPDATE)
   - Users can only update their own context entries

4. **Users can delete own page context** (DELETE)
   - Users can only delete their own context entries

5. **Organization admins can view org context** (SELECT)
   - Admins and owners can view organization-wide context

### Validation Trigger

`validate_page_context_trigger` runs before INSERT/UPDATE:
- Validates user_id exists in auth.users
- Validates organization_id exists in organizations (or sets to NULL)
- Ensures page_type is not empty
- Ensures page_route is not empty
- Validates context_data is valid JSONB
- Adds timestamp to context_data if missing

## TypeScript Enhancements

### New Features

1. **Pre-insert Validation**
   ```typescript
   validateContextData(contextData: PageContextData): { valid: boolean; error?: string }
   ```
   - Validates all required fields before database call
   - Returns descriptive error messages

2. **Data Sanitization**
   ```typescript
   sanitizeContextData(contextData: PageContextData): Record<string, any>
   ```
   - Ensures proper data types
   - Provides safe defaults for optional fields
   - Converts arrays properly

3. **Enhanced Error Logging**
   - All log messages prefixed with `[ContextTracking]`
   - Logs include operation details, error codes, and context
   - Separate logs for validation failures vs database errors

4. **Input Validation for All Methods**
   - `trackPageContext`: Validates userId and contextData
   - `getRecentContext`: Validates userId and limit
   - `getCurrentPageContext`: Validates userId and pageType
   - `cleanupOldContext`: Validates daysToKeep parameter

## Testing Results

### Schema Verification
- ✅ 8 columns created (all required columns present)
- ✅ 6 indexes created (performance optimized)
- ✅ 5 RLS policies created (proper security)
- ✅ Validation trigger active
- ✅ Cleanup function available

### Build Verification
- ✅ TypeScript compilation successful
- ✅ No type errors
- ✅ Vite build completed successfully

## Usage Example

```typescript
import { ContextTrackingService } from './services/contextTrackingService';

// Track page context
const result = await ContextTrackingService.trackPageContext(
  user.id,
  organization?.id,
  {
    pageType: 'dashboard',
    route: '/dashboard',
    timestamp: new Date().toISOString(),
    stats: { totalDocuments: 42 },
    filters: { status: 'active' },
    recentActions: ['viewed', 'searched']
  }
);

// Get recent contexts
const recent = await ContextTrackingService.getRecentContext(user.id, 5);

// Get current page context
const current = await ContextTrackingService.getCurrentPageContext(
  user.id,
  'dashboard'
);

// Cleanup old contexts (older than 7 days)
const cleaned = await ContextTrackingService.cleanupOldContext(7);
```

## Migration Safety

The migration includes:
- Automatic backup of existing data
- Safe data transformation during migration
- Rollback capability (backup table preserved until successful migration)
- Validation at multiple levels (trigger + application)
- Non-destructive approach (preserves all data)

## Benefits

1. **Eliminates 400 Errors**: Schema now matches TypeScript expectations
2. **Improved Security**: Granular RLS policies with proper authentication checks
3. **Better Performance**: Optimized indexes for common query patterns
4. **Enhanced Debugging**: Comprehensive logging throughout the stack
5. **Data Integrity**: Validation at both database and application layers
6. **Future-Proof**: Extensible JSONB structure for context_data

## Helper Functions Available

### Database Function
```sql
cleanup_old_page_context(days_to_keep integer DEFAULT 7) RETURNS integer
```
Deletes context entries older than specified days.

### TypeScript Methods
- `trackPageContext()` - Create new context entry
- `getRecentContext()` - Get recent context entries for user
- `getCurrentPageContext()` - Get latest context for specific page type
- `cleanupOldContext()` - Delete old context entries
- `buildContextSummary()` - Generate human-readable context summary

## Next Steps

The ai_page_context table is now fully functional and ready for use. The 400 errors should be resolved. If you encounter any issues:

1. Check browser console for `[ContextTracking]` logs
2. Verify user is authenticated (auth.uid() must exist)
3. Ensure organization exists if providing organization_id
4. Check that page_type and page_route are not empty strings

## Files Modified

1. `/supabase/migrations/20251111XXXXXX_fix_ai_page_context_schema_v2.sql` - Database migration
2. `/src/services/contextTrackingService.ts` - Enhanced TypeScript service

## Verification Commands

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ai_page_context';

-- Check policies
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'ai_page_context';

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE tablename = 'ai_page_context';

-- Test insert (as authenticated user)
INSERT INTO ai_page_context (user_id, page_type, page_route, context_data)
VALUES (auth.uid(), 'dashboard', '/dashboard', '{"test": true}'::jsonb);
```
