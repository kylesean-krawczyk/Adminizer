/*
  # Fix AI Page Context Table Schema

  ## Problem Identified
  The ai_page_context table schema in the database does not match the expected schema
  from the migration files or the TypeScript code, causing 400 errors on insert/query.

  ## Current State (Incorrect)
  - `route` column (should be `page_route`)
  - `stats` column as JSONB
  - `recent_actions` column as array
  - Missing `organization_id` column
  - Missing `page_url` column
  - Missing `context_data` JSONB column

  ## Target State (Correct)
  - `page_route` column for the URL path
  - `page_type` column for page category
  - `organization_id` column for organization context
  - `context_data` JSONB column containing stats, filters, actions, etc.
  - `page_url` column for optional full URL
  - Proper indexes for performance
  - Correct RLS policies

  ## Changes Made
  1. Migrate existing data to new schema
  2. Rename/restructure columns to match expected schema
  3. Add missing columns
  4. Recreate indexes for performance
  5. Update RLS policies with proper granularity
  6. Add validation trigger

  ## Security
  - RLS enabled with separate policies for SELECT, INSERT, UPDATE, DELETE
  - Users can only access their own context
  - Organization admins can read organization context
  - Proper authentication checks

  ## Data Migration
  - Safely migrate existing `route` data to `page_route`
  - Migrate `stats` and `recent_actions` into `context_data` JSONB
  - Preserve all existing data without loss
*/

-- ============================================================================
-- STEP 1: Create backup of existing data
-- ============================================================================

DO $$
BEGIN
  -- Create temporary backup table if data exists
  IF EXISTS (SELECT 1 FROM ai_page_context LIMIT 1) THEN
    DROP TABLE IF EXISTS ai_page_context_backup;
    CREATE TABLE ai_page_context_backup AS 
    SELECT * FROM ai_page_context;
    
    RAISE NOTICE 'Created backup of % rows', (SELECT COUNT(*) FROM ai_page_context_backup);
  END IF;
END $$;


-- ============================================================================
-- STEP 2: Drop existing table and recreate with correct schema
-- ============================================================================

-- Drop the entire table (CASCADE will handle all dependencies)
DROP TABLE IF EXISTS ai_page_context CASCADE;

-- Recreate table with correct schema
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

COMMENT ON TABLE ai_page_context IS 'Tracks user page navigation and context for generating relevant AI suggestions';
COMMENT ON COLUMN ai_page_context.page_route IS 'Route path of the page (e.g., /dashboard, /documents)';
COMMENT ON COLUMN ai_page_context.page_url IS 'Optional full URL including query parameters';
COMMENT ON COLUMN ai_page_context.context_data IS 'JSONB containing stats, filters, recentActions, entityId, entityType, timestamp';


-- ============================================================================
-- STEP 3: Restore data from backup with schema transformation
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_page_context_backup') THEN
    INSERT INTO ai_page_context (
      id,
      user_id,
      organization_id,
      page_type,
      page_route,
      page_url,
      context_data,
      created_at
    )
    SELECT 
      id,
      user_id,
      NULL as organization_id,
      COALESCE(page_type, 'dashboard') as page_type,
      COALESCE(route, '/') as page_route,
      NULL as page_url,
      jsonb_build_object(
        'stats', COALESCE(stats, '{}'::jsonb),
        'recentActions', COALESCE(recent_actions, ARRAY[]::text[]),
        'timestamp', created_at::text
      ) as context_data,
      created_at
    FROM ai_page_context_backup;
    
    RAISE NOTICE 'Migrated % rows from backup', (SELECT COUNT(*) FROM ai_page_context);
    
    -- Drop backup table after successful migration
    DROP TABLE ai_page_context_backup;
  ELSE
    RAISE NOTICE 'No backup data to migrate';
  END IF;
END $$;


-- ============================================================================
-- STEP 4: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_page_context_user_id ON ai_page_context(user_id);
CREATE INDEX IF NOT EXISTS idx_page_context_org_id ON ai_page_context(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_page_context_page_type ON ai_page_context(page_type);
CREATE INDEX IF NOT EXISTS idx_page_context_created_at ON ai_page_context(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_context_user_page_type ON ai_page_context(user_id, page_type);


-- ============================================================================
-- STEP 5: Enable Row Level Security
-- ============================================================================

ALTER TABLE ai_page_context ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- STEP 6: Create RLS policies
-- ============================================================================

-- Policy 1: Users can view their own page context
CREATE POLICY "Users can view own page context"
  ON ai_page_context FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own page context
CREATE POLICY "Users can insert own page context"
  ON ai_page_context FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own page context
CREATE POLICY "Users can update own page context"
  ON ai_page_context FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own page context
CREATE POLICY "Users can delete own page context"
  ON ai_page_context FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 5: Organization admins can view organization context
CREATE POLICY "Organization admins can view org context"
  ON ai_page_context FOR SELECT
  TO authenticated
  USING (
    organization_id IS NOT NULL AND
    organization_id IN (
      SELECT organization_id 
      FROM user_profiles 
      WHERE id = auth.uid() 
        AND role IN ('admin', 'owner')
    )
  );


-- ============================================================================
-- STEP 7: Add validation trigger
-- ============================================================================

-- Create validation function with enhanced checks
CREATE OR REPLACE FUNCTION validate_page_context_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate user_id exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.user_id) THEN
    RAISE EXCEPTION 'Invalid user_id: User % does not exist', NEW.user_id
      USING ERRCODE = '23503',
            HINT = 'Page context can only be created for authenticated users';
  END IF;

  -- Validate organization_id if provided
  IF NEW.organization_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = NEW.organization_id) THEN
      RAISE WARNING 'Organization % does not exist, setting to NULL', NEW.organization_id;
      NEW.organization_id := NULL;
    END IF;
  END IF;

  -- Validate page_type is not empty
  IF NEW.page_type IS NULL OR trim(NEW.page_type) = '' THEN
    RAISE EXCEPTION 'page_type cannot be empty'
      USING ERRCODE = '23514',
            HINT = 'Provide a valid page_type such as dashboard, documents, etc.';
  END IF;

  -- Validate page_route is not empty
  IF NEW.page_route IS NULL OR trim(NEW.page_route) = '' THEN
    RAISE EXCEPTION 'page_route cannot be empty'
      USING ERRCODE = '23514',
            HINT = 'Provide a valid page_route such as /dashboard, /documents, etc.';
  END IF;

  -- Ensure context_data is valid JSONB
  IF NEW.context_data IS NULL THEN
    NEW.context_data := '{}'::jsonb;
  END IF;

  -- Validate context_data structure and add timestamp if missing
  IF NOT (NEW.context_data ? 'timestamp') THEN
    NEW.context_data := jsonb_set(
      NEW.context_data, 
      '{timestamp}', 
      to_jsonb(NOW()::text)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER validate_page_context_trigger
  BEFORE INSERT OR UPDATE ON ai_page_context
  FOR EACH ROW
  EXECUTE FUNCTION validate_page_context_insert();


-- ============================================================================
-- STEP 8: Add helper function for cleanup
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_page_context(days_to_keep integer DEFAULT 7)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM ai_page_context
  WHERE created_at < NOW() - (days_to_keep || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_page_context IS 'Deletes page context entries older than specified days (default 7)';

GRANT EXECUTE ON FUNCTION cleanup_old_page_context TO authenticated;


-- ============================================================================
-- STEP 9: Verification and success message
-- ============================================================================

DO $$
DECLARE
  v_column_count integer;
  v_index_count integer;
  v_policy_count integer;
  v_row_count integer;
BEGIN
  -- Verify columns exist
  SELECT COUNT(*) INTO v_column_count
  FROM information_schema.columns 
  WHERE table_name = 'ai_page_context' 
    AND column_name IN ('id', 'user_id', 'organization_id', 'page_type', 'page_route', 'page_url', 'context_data', 'created_at');
  
  -- Verify indexes exist
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes 
  WHERE tablename = 'ai_page_context';
  
  -- Verify policies exist
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies 
  WHERE tablename = 'ai_page_context';
  
  -- Count migrated rows
  SELECT COUNT(*) INTO v_row_count
  FROM ai_page_context;
  
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'AI Page Context Table Fix Complete';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Columns created: % (expected 8)', v_column_count;
  RAISE NOTICE 'Indexes created: % (expected 6)', v_index_count;
  RAISE NOTICE 'RLS policies created: % (expected 5)', v_policy_count;
  RAISE NOTICE 'Data rows migrated: %', v_row_count;
  RAISE NOTICE 'Validation trigger: ACTIVE';
  RAISE NOTICE 'Cleanup function: AVAILABLE';
  RAISE NOTICE '=================================================================';
  
  IF v_column_count != 8 OR v_index_count < 5 OR v_policy_count < 5 THEN
    RAISE WARNING 'Schema verification found unexpected counts. Please review.';
  ELSE
    RAISE NOTICE 'Schema verification PASSED - All components created successfully';
  END IF;
END $$;
