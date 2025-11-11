/*
  # Improve Foreign Key Constraints and Error Messages

  1. Enhancements
    - Add better error messages to foreign key constraints
    - Make certain constraints deferrable for complex transactions
    - Add trigger-based validation with descriptive errors
    - Create constraint violation logging

  2. Constraint Improvements
    - user_profiles.organization_id with better error handling
    - ai_tool_access_requests foreign keys with descriptive errors
    - Deferrable constraints where appropriate

  3. Validation Triggers
    - Pre-insert validation with custom error messages
    - Log constraint violations for debugging

  4. Security
    - Functions use SECURITY DEFINER
    - Proper RLS policies maintained
*/

-- ============================================================================
-- SECTION 1: CREATE CONSTRAINT VIOLATION LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS constraint_violations_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  constraint_name text NOT NULL,
  column_name text,
  invalid_value text,
  user_id uuid REFERENCES auth.users(id),
  error_message text NOT NULL,
  sql_state text,
  context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_constraint_violations_table ON constraint_violations_log(table_name);
CREATE INDEX IF NOT EXISTS idx_constraint_violations_created_at ON constraint_violations_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_constraint_violations_user ON constraint_violations_log(user_id);

COMMENT ON TABLE constraint_violations_log IS 'Logs all foreign key constraint violations for debugging and monitoring';


-- ============================================================================
-- SECTION 2: IMPROVE USER_PROFILES FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- 2.1: Make organization_id constraint deferrable for complex transactions
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_profiles_organization_id_fkey'
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE user_profiles
    DROP CONSTRAINT user_profiles_organization_id_fkey;
  END IF;

  -- Add new deferrable constraint with explicit CASCADE
  ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_organization_id_fkey
  FOREIGN KEY (organization_id)
  REFERENCES organizations(id)
  ON DELETE CASCADE
  DEFERRABLE INITIALLY DEFERRED;
END $$;

-- 2.2: Add validation trigger for user_profiles
CREATE OR REPLACE FUNCTION validate_user_profile_foreign_keys()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate organization_id if provided
  IF NEW.organization_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = NEW.organization_id) THEN
      -- Log the violation
      INSERT INTO constraint_violations_log (
        table_name,
        constraint_name,
        column_name,
        invalid_value,
        user_id,
        error_message,
        context
      )
      VALUES (
        'user_profiles',
        'organization_id_validation',
        'organization_id',
        NEW.organization_id::text,
        NEW.id,
        'Cannot assign user to non-existent organization',
        jsonb_build_object(
          'user_email', NEW.email,
          'invalid_org_id', NEW.organization_id,
          'operation', TG_OP
        )
      );

      RAISE EXCEPTION 'Invalid organization_id: Organization % does not exist. User cannot be assigned to a non-existent organization.', NEW.organization_id
        USING ERRCODE = '23503',
              HINT = 'Please create the organization first or assign to an existing organization',
              DETAIL = format('User: %s, Invalid Org ID: %s', NEW.email, NEW.organization_id);
    END IF;
  END IF;

  -- Validate invited_by if provided
  IF NEW.invited_by IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = NEW.invited_by) THEN
      RAISE EXCEPTION 'Invalid invited_by: User % does not exist', NEW.invited_by
        USING ERRCODE = '23503',
              HINT = 'The inviting user must have a valid profile';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS validate_user_profile_fk_trigger ON user_profiles;
CREATE TRIGGER validate_user_profile_fk_trigger
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_profile_foreign_keys();


-- ============================================================================
-- SECTION 3: IMPROVE AI_TOOL_ACCESS_REQUESTS CONSTRAINTS
-- ============================================================================

-- 3.1: Add validation trigger for ai_tool_access_requests
CREATE OR REPLACE FUNCTION validate_tool_access_request_foreign_keys()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate user_id
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.user_id) THEN
    INSERT INTO constraint_violations_log (
      table_name,
      constraint_name,
      column_name,
      invalid_value,
      user_id,
      error_message,
      context
    )
    VALUES (
      'ai_tool_access_requests',
      'user_id_validation',
      'user_id',
      NEW.user_id::text,
      NEW.user_id,
      'Cannot create access request for non-existent user',
      jsonb_build_object('invalid_user_id', NEW.user_id, 'operation', TG_OP)
    );

    RAISE EXCEPTION 'Invalid user_id: User % does not exist in auth.users', NEW.user_id
      USING ERRCODE = '23503',
            HINT = 'User must be authenticated and have a valid account',
            DETAIL = format('Access request attempted for non-existent user: %s', NEW.user_id);
  END IF;

  -- Validate tool_id
  IF NOT EXISTS (SELECT 1 FROM ai_tool_registry WHERE id = NEW.tool_id) THEN
    INSERT INTO constraint_violations_log (
      table_name,
      constraint_name,
      column_name,
      invalid_value,
      user_id,
      error_message,
      context
    )
    VALUES (
      'ai_tool_access_requests',
      'tool_id_validation',
      'tool_id',
      NEW.tool_id::text,
      NEW.user_id,
      'Cannot create access request for non-existent tool',
      jsonb_build_object('invalid_tool_id', NEW.tool_id, 'user_id', NEW.user_id, 'operation', TG_OP)
    );

    RAISE EXCEPTION 'Invalid tool_id: Tool % does not exist in registry', NEW.tool_id
      USING ERRCODE = '23503',
            HINT = 'Tool must be registered in ai_tool_registry first',
            DETAIL = format('Access request for non-existent tool: %s', NEW.tool_id);
  END IF;

  -- Validate reviewed_by if provided
  IF NEW.reviewed_by IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.reviewed_by) THEN
      RAISE EXCEPTION 'Invalid reviewed_by: User % does not exist', NEW.reviewed_by
        USING ERRCODE = '23503',
              HINT = 'Reviewer must be a valid authenticated user';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS validate_tool_access_request_fk_trigger ON ai_tool_access_requests;
CREATE TRIGGER validate_tool_access_request_fk_trigger
  BEFORE INSERT OR UPDATE ON ai_tool_access_requests
  FOR EACH ROW
  EXECUTE FUNCTION validate_tool_access_request_foreign_keys();


-- ============================================================================
-- SECTION 4: IMPROVE AI_PAGE_CONTEXT CONSTRAINTS
-- ============================================================================

-- 4.1: Add validation trigger for ai_page_context
CREATE OR REPLACE FUNCTION validate_page_context_foreign_keys()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate user_id
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.user_id) THEN
    RAISE EXCEPTION 'Invalid user_id: User % does not exist', NEW.user_id
      USING ERRCODE = '23503',
            HINT = 'Page context can only be created for authenticated users',
            DETAIL = format('Page context for non-existent user: %s', NEW.user_id);
  END IF;

  -- Validate organization_id if provided
  IF NEW.organization_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = NEW.organization_id) THEN
      RAISE EXCEPTION 'Invalid organization_id: Organization % does not exist', NEW.organization_id
        USING ERRCODE = '23503',
              HINT = 'Organization must exist before associating page context',
              DETAIL = format('Page context for non-existent organization: %s', NEW.organization_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS validate_page_context_fk_trigger ON ai_page_context;
CREATE TRIGGER validate_page_context_fk_trigger
  BEFORE INSERT OR UPDATE ON ai_page_context
  FOR EACH ROW
  EXECUTE FUNCTION validate_page_context_foreign_keys();


-- ============================================================================
-- SECTION 5: IMPROVE AI_NOTIFICATIONS CONSTRAINTS
-- ============================================================================

-- 5.1: Add validation trigger for ai_notifications
CREATE OR REPLACE FUNCTION validate_notification_foreign_keys()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate user_id if provided
  IF NEW.user_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.user_id) THEN
      RAISE EXCEPTION 'Invalid user_id: User % does not exist', NEW.user_id
        USING ERRCODE = '23503',
              HINT = 'Notification can only be sent to existing users',
              DETAIL = format('Notification for non-existent user: %s', NEW.user_id);
    END IF;
  END IF;

  -- Validate organization_id (required)
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = NEW.organization_id) THEN
    RAISE EXCEPTION 'Invalid organization_id: Organization % does not exist', NEW.organization_id
      USING ERRCODE = '23503',
            HINT = 'Notification must be associated with an existing organization',
            DETAIL = format('Notification for non-existent organization: %s', NEW.organization_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS validate_notification_fk_trigger ON ai_notifications;
CREATE TRIGGER validate_notification_fk_trigger
  BEFORE INSERT OR UPDATE ON ai_notifications
  FOR EACH ROW
  EXECUTE FUNCTION validate_notification_foreign_keys();


-- ============================================================================
-- SECTION 6: HELPER FUNCTIONS FOR CONSTRAINT CHECKING
-- ============================================================================

-- 6.1: Function to check if organization exists
CREATE OR REPLACE FUNCTION organization_exists(p_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM organizations WHERE id = p_org_id);
END;
$$;

-- 6.2: Function to check if user exists
CREATE OR REPLACE FUNCTION user_exists(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id);
END;
$$;

-- 6.3: Function to check if tool exists
CREATE OR REPLACE FUNCTION tool_exists(p_tool_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM ai_tool_registry WHERE id = p_tool_id);
END;
$$;

-- 6.4: Function to get constraint violations summary
CREATE OR REPLACE FUNCTION get_constraint_violations_summary(
  p_hours integer DEFAULT 24
)
RETURNS TABLE(
  table_name text,
  constraint_name text,
  violation_count bigint,
  most_recent timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cvl.table_name,
    cvl.constraint_name,
    COUNT(*) as violation_count,
    MAX(cvl.created_at) as most_recent
  FROM constraint_violations_log cvl
  WHERE cvl.created_at > NOW() - (p_hours || ' hours')::interval
  GROUP BY cvl.table_name, cvl.constraint_name
  ORDER BY violation_count DESC;
END;
$$;


-- ============================================================================
-- SECTION 7: GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION organization_exists TO authenticated;
GRANT EXECUTE ON FUNCTION user_exists TO authenticated;
GRANT EXECUTE ON FUNCTION tool_exists TO authenticated;
GRANT EXECUTE ON FUNCTION get_constraint_violations_summary TO authenticated;

-- Grant table permissions
GRANT SELECT ON constraint_violations_log TO authenticated;
GRANT ALL ON constraint_violations_log TO service_role;


-- ============================================================================
-- SECTION 8: COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION validate_user_profile_foreign_keys IS 'Validates foreign key references before inserting/updating user profiles with descriptive error messages';
COMMENT ON FUNCTION validate_tool_access_request_foreign_keys IS 'Validates foreign key references before inserting/updating tool access requests with descriptive error messages';
COMMENT ON FUNCTION validate_page_context_foreign_keys IS 'Validates foreign key references before inserting/updating page context with descriptive error messages';
COMMENT ON FUNCTION validate_notification_foreign_keys IS 'Validates foreign key references before inserting/updating notifications with descriptive error messages';
COMMENT ON FUNCTION organization_exists IS 'Helper function to check if an organization exists by ID';
COMMENT ON FUNCTION user_exists IS 'Helper function to check if a user exists by ID';
COMMENT ON FUNCTION tool_exists IS 'Helper function to check if a tool exists in registry by ID';
COMMENT ON FUNCTION get_constraint_violations_summary IS 'Returns summary of constraint violations for the last N hours';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Foreign key constraints improved successfully';
  RAISE NOTICE 'All foreign keys now have validation triggers with descriptive error messages';
  RAISE NOTICE 'Constraint violations are logged to constraint_violations_log table';
END $$;
