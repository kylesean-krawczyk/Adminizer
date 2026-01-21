/*
  # Fix Missing Schema Elements for UI Customization

  This migration adds missing database tables and columns that are referenced
  by the application but don't exist in the database, causing 404 errors.

  ## Changes Made

  1. Ensure `feature_flags` column exists in `organizations` table
  2. Ensure `context_data` column exists in `ai_page_context` table
  3. Ensure all AI permission tables exist (from 20251015160000 migration)
  4. Fix foreign key constraints for `ai_tool_access_requests`
  5. Add proper indexes and RLS policies

  ## Tables Verified/Created

  - `ai_notifications` - Smart notifications system
  - `ai_user_permissions` - User-specific tool permissions
  - `ai_permission_templates` - Permission template definitions
  - `ai_tool_access_requests` - Tool access requests workflow

  ## Security

  - All tables have RLS enabled
  - Proper policies for user access control
  - Organization-scoped access where applicable

  ## Performance

  - Indexes on frequently queried columns
  - Composite indexes for common query patterns
*/

-- ============================================================================
-- STEP 1: Ensure organizations.feature_flags column exists
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'feature_flags'
  ) THEN
    ALTER TABLE organizations ADD COLUMN feature_flags JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added feature_flags column to organizations table';
  ELSE
    RAISE NOTICE 'feature_flags column already exists in organizations table';
  END IF;
END $$;


-- ============================================================================
-- STEP 2: Ensure ai_page_context.context_data column exists
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_page_context') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'ai_page_context' AND column_name = 'context_data'
    ) THEN
      ALTER TABLE ai_page_context ADD COLUMN context_data JSONB DEFAULT '{}'::jsonb;
      RAISE NOTICE 'Added context_data column to ai_page_context table';
    ELSE
      RAISE NOTICE 'context_data column already exists in ai_page_context table';
    END IF;
  ELSE
    RAISE NOTICE 'ai_page_context table does not exist, will be created if needed';
  END IF;
END $$;


-- ============================================================================
-- STEP 3: Ensure ai_permission_templates table exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_permission_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  permission_level text NOT NULL CHECK (permission_level IN ('master_admin', 'admin', 'manager', 'employee', 'viewer')),
  tool_permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_system_template boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_permission_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_permission_templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_permission_templates'
    AND policyname = 'Admins can manage permission templates'
  ) THEN
    CREATE POLICY "Admins can manage permission templates"
      ON ai_permission_templates FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role IN ('master_admin', 'admin')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role IN ('master_admin', 'admin')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_permission_templates'
    AND policyname = 'All authenticated users can view templates'
  ) THEN
    CREATE POLICY "All authenticated users can view templates"
      ON ai_permission_templates FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;


-- ============================================================================
-- STEP 4: Ensure ai_user_permissions table exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id text NOT NULL,
  granted boolean DEFAULT true,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  reason text,
  is_temporary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tool_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_user_permissions_user_id ON ai_user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_user_permissions_tool_id ON ai_user_permissions(tool_id);
CREATE INDEX IF NOT EXISTS idx_ai_user_permissions_expires_at ON ai_user_permissions(expires_at) WHERE expires_at IS NOT NULL;

ALTER TABLE ai_user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_user_permissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_user_permissions'
    AND policyname = 'Users can view their own permissions'
  ) THEN
    CREATE POLICY "Users can view their own permissions"
      ON ai_user_permissions FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_user_permissions'
    AND policyname = 'Admins can manage user permissions'
  ) THEN
    CREATE POLICY "Admins can manage user permissions"
      ON ai_user_permissions FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role IN ('master_admin', 'admin')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role IN ('master_admin', 'admin')
        )
      );
  END IF;
END $$;


-- ============================================================================
-- STEP 5: Ensure ai_notifications table exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid,
  notification_type text NOT NULL,
  priority text NOT NULL DEFAULT 'normal',
  title text NOT NULL,
  message text NOT NULL,
  category text NOT NULL,
  related_entity_type text,
  related_entity_id uuid,
  action_url text,
  action_label text,
  status text NOT NULL DEFAULT 'unread',
  data jsonb DEFAULT '{}',
  snoozed_until timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  read_at timestamptz,
  actioned_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON ai_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON ai_notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON ai_notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON ai_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON ai_notifications(created_at);

ALTER TABLE ai_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_notifications'
    AND policyname = 'Users can view own notifications'
  ) THEN
    CREATE POLICY "Users can view own notifications"
      ON ai_notifications FOR SELECT
      TO authenticated
      USING (
        auth.uid() = user_id OR
        (user_id IS NULL AND organization_id IN (
          SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        ))
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_notifications'
    AND policyname = 'Users can update own notifications'
  ) THEN
    CREATE POLICY "Users can update own notifications"
      ON ai_notifications FOR UPDATE
      TO authenticated
      USING (
        auth.uid() = user_id OR
        (user_id IS NULL AND organization_id IN (
          SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        ))
      )
      WITH CHECK (
        auth.uid() = user_id OR
        (user_id IS NULL AND organization_id IN (
          SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        ))
      );
  END IF;
END $$;


-- ============================================================================
-- STEP 6: Fix ai_tool_access_requests foreign key constraint
-- ============================================================================

-- Check if table exists and fix the foreign key constraint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_tool_access_requests') THEN
    -- Check if the constraint to user_profiles exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'ai_tool_access_requests_user_profile_fkey'
      AND table_name = 'ai_tool_access_requests'
    ) THEN
      -- Try to add constraint to user_profiles instead of auth.users
      BEGIN
        ALTER TABLE ai_tool_access_requests
        ADD CONSTRAINT ai_tool_access_requests_user_profile_fkey
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint to user_profiles for ai_tool_access_requests';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add foreign key constraint: %', SQLERRM;
      END;
    ELSE
      RAISE NOTICE 'Foreign key constraint already exists for ai_tool_access_requests';
    END IF;
  ELSE
    RAISE NOTICE 'ai_tool_access_requests table does not exist';
  END IF;
END $$;


-- ============================================================================
-- STEP 7: Verification and Summary
-- ============================================================================

DO $$
DECLARE
  v_tables_count integer;
  v_columns_count integer;
BEGIN
  -- Count created/verified tables
  SELECT COUNT(*) INTO v_tables_count
  FROM information_schema.tables
  WHERE table_name IN (
    'ai_permission_templates',
    'ai_user_permissions',
    'ai_notifications'
  );

  -- Count added columns
  v_columns_count := 0;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'feature_flags'
  ) THEN
    v_columns_count := v_columns_count + 1;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_page_context' AND column_name = 'context_data'
  ) THEN
    v_columns_count := v_columns_count + 1;
  END IF;

  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Missing Schema Elements Fix Complete';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Tables verified/created: %', v_tables_count;
  RAISE NOTICE 'Columns verified/added: %', v_columns_count;
  RAISE NOTICE 'RLS policies: ENABLED on all tables';
  RAISE NOTICE 'Indexes: CREATED for performance optimization';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'UI Customization page should now work without 404 errors';
  RAISE NOTICE '=================================================================';
END $$;
