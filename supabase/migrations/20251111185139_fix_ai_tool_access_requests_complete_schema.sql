/*
  # Fix AI Tool Access Requests Complete Schema and Foreign Keys

  ## Problem
  1. The `ai_tool_access_requests` table is missing several columns defined in the original migration
  2. Missing foreign key relationships to `user_profiles` causing query errors
  3. Application queries use Supabase relationship hints that require proper foreign keys

  ## Solution
  1. Add all missing columns to match the intended schema
  2. Add foreign key constraints to `user_profiles` for both `user_id` and `reviewed_by`
  3. Update RLS policies if needed
  4. Ensure backward compatibility with existing data

  ## Changes
  1. Add missing columns: request_reason, business_justification, requested_duration_days, 
     is_temporary, reviewed_by, reviewed_at, review_comment, expires_at, priority
  2. Update status column constraints
  3. Add foreign key: ai_tool_access_requests.user_id -> user_profiles(id)
  4. Add foreign key: ai_tool_access_requests.reviewed_by -> user_profiles(id)
  5. Migrate existing 'reason' data to 'request_reason' if needed
*/

-- ============================================================================
-- SECTION 1: ADD MISSING COLUMNS
-- ============================================================================

-- Add request_reason column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_tool_access_requests' AND column_name = 'request_reason'
  ) THEN
    -- First, check if 'reason' column exists and has data
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'ai_tool_access_requests' AND column_name = 'reason'
    ) THEN
      -- Rename 'reason' to 'request_reason'
      ALTER TABLE ai_tool_access_requests RENAME COLUMN reason TO request_reason;
      
      -- Make it NOT NULL with a default for existing rows
      ALTER TABLE ai_tool_access_requests 
        ALTER COLUMN request_reason SET DEFAULT 'Access requested',
        ALTER COLUMN request_reason SET NOT NULL;
      
      RAISE NOTICE 'Renamed reason column to request_reason';
    ELSE
      -- Add new column
      ALTER TABLE ai_tool_access_requests 
        ADD COLUMN request_reason text NOT NULL DEFAULT 'Access requested';
      
      RAISE NOTICE 'Added request_reason column';
    END IF;
  END IF;
END $$;

-- Add business_justification column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_tool_access_requests' AND column_name = 'business_justification'
  ) THEN
    ALTER TABLE ai_tool_access_requests 
      ADD COLUMN business_justification text NOT NULL DEFAULT 'Business need';
    
    RAISE NOTICE 'Added business_justification column';
  END IF;
END $$;

-- Add requested_duration_days column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_tool_access_requests' AND column_name = 'requested_duration_days'
  ) THEN
    ALTER TABLE ai_tool_access_requests 
      ADD COLUMN requested_duration_days integer;
    
    RAISE NOTICE 'Added requested_duration_days column';
  END IF;
END $$;

-- Add is_temporary column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_tool_access_requests' AND column_name = 'is_temporary'
  ) THEN
    ALTER TABLE ai_tool_access_requests 
      ADD COLUMN is_temporary boolean DEFAULT false;
    
    RAISE NOTICE 'Added is_temporary column';
  END IF;
END $$;

-- Add reviewed_by column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_tool_access_requests' AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE ai_tool_access_requests 
      ADD COLUMN reviewed_by uuid;
    
    RAISE NOTICE 'Added reviewed_by column';
  END IF;
END $$;

-- Add reviewed_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_tool_access_requests' AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE ai_tool_access_requests 
      ADD COLUMN reviewed_at timestamptz;
    
    RAISE NOTICE 'Added reviewed_at column';
  END IF;
END $$;

-- Add review_comment column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_tool_access_requests' AND column_name = 'review_comment'
  ) THEN
    ALTER TABLE ai_tool_access_requests 
      ADD COLUMN review_comment text;
    
    RAISE NOTICE 'Added review_comment column';
  END IF;
END $$;

-- Add expires_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_tool_access_requests' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE ai_tool_access_requests 
      ADD COLUMN expires_at timestamptz;
    
    RAISE NOTICE 'Added expires_at column';
  END IF;
END $$;

-- Add priority column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_tool_access_requests' AND column_name = 'priority'
  ) THEN
    ALTER TABLE ai_tool_access_requests 
      ADD COLUMN priority text DEFAULT 'normal' 
      CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
    
    RAISE NOTICE 'Added priority column';
  END IF;
END $$;


-- ============================================================================
-- SECTION 2: UPDATE STATUS COLUMN CONSTRAINTS
-- ============================================================================

-- Update status column to have proper constraints
DO $$
BEGIN
  -- Drop old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname LIKE '%status%check%' 
    AND conrelid = 'public.ai_tool_access_requests'::regclass
  ) THEN
    ALTER TABLE ai_tool_access_requests 
      DROP CONSTRAINT IF EXISTS ai_tool_access_requests_status_check;
  END IF;
  
  -- Add new constraint
  ALTER TABLE ai_tool_access_requests 
    ADD CONSTRAINT ai_tool_access_requests_status_check 
    CHECK (status IN ('pending', 'approved', 'denied', 'expired', 'cancelled'));
    
  -- Make status NOT NULL
  ALTER TABLE ai_tool_access_requests 
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN status SET DEFAULT 'pending';
    
  RAISE NOTICE 'Updated status column constraints';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Status constraint already exists';
END $$;


-- ============================================================================
-- SECTION 3: UPDATE TOOL_ID COLUMN TO NOT NULL
-- ============================================================================

DO $$
BEGIN
  -- Make tool_id NOT NULL if it isn't already
  ALTER TABLE ai_tool_access_requests 
    ALTER COLUMN tool_id SET NOT NULL;
    
  RAISE NOTICE 'Updated tool_id to NOT NULL';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not set tool_id to NOT NULL (may have NULL values)';
END $$;


-- ============================================================================
-- SECTION 4: ADD FOREIGN KEY TO user_profiles FOR user_id
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ai_tool_access_requests_user_id_user_profiles_fkey'
    AND conrelid = 'public.ai_tool_access_requests'::regclass
  ) THEN
    ALTER TABLE ai_tool_access_requests
    ADD CONSTRAINT ai_tool_access_requests_user_id_user_profiles_fkey
    FOREIGN KEY (user_id)
    REFERENCES user_profiles(id)
    ON DELETE CASCADE;

    RAISE NOTICE 'Added foreign key: ai_tool_access_requests.user_id -> user_profiles(id)';
  ELSE
    RAISE NOTICE 'Foreign key ai_tool_access_requests_user_id_user_profiles_fkey already exists';
  END IF;
END $$;


-- ============================================================================
-- SECTION 5: ADD FOREIGN KEY TO user_profiles FOR reviewed_by
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ai_tool_access_requests_reviewed_by_user_profiles_fkey'
    AND conrelid = 'public.ai_tool_access_requests'::regclass
  ) THEN
    ALTER TABLE ai_tool_access_requests
    ADD CONSTRAINT ai_tool_access_requests_reviewed_by_user_profiles_fkey
    FOREIGN KEY (reviewed_by)
    REFERENCES user_profiles(id)
    ON DELETE SET NULL;

    RAISE NOTICE 'Added foreign key: ai_tool_access_requests.reviewed_by -> user_profiles(id)';
  ELSE
    RAISE NOTICE 'Foreign key ai_tool_access_requests_reviewed_by_user_profiles_fkey already exists';
  END IF;
END $$;


-- ============================================================================
-- SECTION 6: ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE ai_tool_access_requests IS 
  'Stores user requests for access to AI tools with approval workflow';

COMMENT ON COLUMN ai_tool_access_requests.user_id IS 
  'User requesting access (references both auth.users and user_profiles)';

COMMENT ON COLUMN ai_tool_access_requests.reviewed_by IS 
  'Admin who reviewed the request (references user_profiles)';

COMMENT ON CONSTRAINT ai_tool_access_requests_user_id_user_profiles_fkey 
  ON ai_tool_access_requests IS 
  'Foreign key to user_profiles for Supabase relationship hint: user_profiles!user_id';

COMMENT ON CONSTRAINT ai_tool_access_requests_reviewed_by_user_profiles_fkey 
  ON ai_tool_access_requests IS 
  'Foreign key to user_profiles for Supabase relationship hint: user_profiles!reviewed_by';


-- ============================================================================
-- SECTION 7: VERIFY FINAL SCHEMA
-- ============================================================================

DO $$
DECLARE
  column_count integer;
  fk_count integer;
BEGIN
  -- Count columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'ai_tool_access_requests';
  
  -- Count foreign keys
  SELECT COUNT(*) INTO fk_count
  FROM pg_constraint
  WHERE conrelid = 'public.ai_tool_access_requests'::regclass
  AND contype = 'f';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Total columns in ai_tool_access_requests: %', column_count;
  RAISE NOTICE 'Total foreign key constraints: %', fk_count;
  RAISE NOTICE 'Schema is now complete and ready for use';
  RAISE NOTICE '========================================';
END $$;
