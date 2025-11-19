-- ============================================================================
-- COMPREHENSIVE DATABASE FIX SCRIPT V2
-- Fixes: 500 errors on user_profiles queries, missing columns, RLS issues
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'PHASE 1: DIAGNOSTICS';
  RAISE NOTICE '=========================================';
END $$;

-- Check current table structure
DO $$
DECLARE
  col_record RECORD;
BEGIN
  RAISE NOTICE 'Current user_profiles columns:';
  FOR col_record IN
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '  - % (%) nullable:% default:%',
      col_record.column_name,
      col_record.data_type,
      col_record.is_nullable,
      COALESCE(col_record.column_default, 'none');
  END LOOP;
END $$;

-- Check auth users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  RAISE NOTICE 'Auth users:';
  FOR user_record IN SELECT id, email, created_at FROM auth.users LOOP
    RAISE NOTICE '  - % (%) created:%', user_record.email, user_record.id, user_record.created_at;
  END LOOP;
END $$;

-- Check user profiles
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  RAISE NOTICE 'User profiles:';
  FOR profile_record IN
    SELECT id, email, role, organization_id, active_vertical FROM user_profiles
  LOOP
    RAISE NOTICE '  - % role:% org:% vertical:%',
      profile_record.email,
      profile_record.role,
      COALESCE(profile_record.organization_id::text, 'NULL'),
      COALESCE(profile_record.active_vertical, 'NULL');
  END LOOP;
END $$;

-- Check RLS status
DO $$
DECLARE
  rls_enabled boolean;
BEGIN
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'user_profiles';
  RAISE NOTICE 'RLS Status on user_profiles: %', CASE WHEN rls_enabled THEN 'ENABLED' ELSE 'DISABLED' END;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'PHASE 2: SCHEMA FIXES';
  RAISE NOTICE '=========================================';
END $$;

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Add permission_overrides if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'permission_overrides'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN permission_overrides jsonb DEFAULT '{}'::jsonb;
    RAISE NOTICE '✓ Added permission_overrides column';
  ELSE
    RAISE NOTICE '  permission_overrides column already exists';
  END IF;

  -- Add default_permission_template if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'default_permission_template'
  ) THEN
    -- Check if ai_permission_templates table exists first
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_permission_templates') THEN
      ALTER TABLE user_profiles ADD COLUMN default_permission_template uuid REFERENCES ai_permission_templates(id) ON DELETE SET NULL;
      RAISE NOTICE '✓ Added default_permission_template column with foreign key';
    ELSE
      ALTER TABLE user_profiles ADD COLUMN default_permission_template uuid;
      RAISE NOTICE '✓ Added default_permission_template column (no FK - table does not exist)';
    END IF;
  ELSE
    RAISE NOTICE '  default_permission_template column already exists';
  END IF;

  -- Ensure active_vertical exists with proper constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'active_vertical'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN active_vertical text DEFAULT 'church';
    RAISE NOTICE '✓ Added active_vertical column';
  ELSE
    RAISE NOTICE '  active_vertical column already exists';
  END IF;
END $$;

-- Update any NULL active_vertical values
UPDATE user_profiles SET active_vertical = 'church' WHERE active_vertical IS NULL;

-- Update any NULL permission_overrides values
UPDATE user_profiles SET permission_overrides = '{}'::jsonb WHERE permission_overrides IS NULL;

DO $$
BEGIN
  RAISE NOTICE '✓ Updated NULL values in user_profiles';
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'PHASE 3: RLS POLICY RESET';
  RAISE NOTICE '=========================================';
END $$;

-- Drop ALL existing RLS policies on user_profiles
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'user_profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON user_profiles', policy_record.policyname);
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create clean, working RLS policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can view profiles in their organization"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    organization_id IS NOT NULL
    AND organization_id IN (
      SELECT up.organization_id
      FROM user_profiles up
      WHERE up.id = auth.uid() AND up.is_active = true
    )
  );

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update profiles in their organization"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IS NOT NULL
    AND organization_id IN (
      SELECT up.organization_id
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.role IN ('master_admin', 'admin')
        AND up.is_active = true
    )
  );

CREATE POLICY "Allow authenticated users to create their profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Service role full access"
  ON user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  RAISE NOTICE '✓ Created 6 new RLS policies on user_profiles';
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'PHASE 4: DATA FIXES';
  RAISE NOTICE '=========================================';
END $$;

-- Ensure master admin user has profile
DO $$
DECLARE
  admin_auth_id uuid;
  admin_profile_exists boolean;
  admin_org_id uuid;
BEGIN
  -- Find the auth user
  SELECT id INTO admin_auth_id
  FROM auth.users
  WHERE email = 'kyle.sean.krawczyk@gmail.com'
  LIMIT 1;

  IF admin_auth_id IS NULL THEN
    RAISE NOTICE '⚠ Master admin auth user not found! Please create via Supabase Auth.';
  ELSE
    RAISE NOTICE '✓ Found master admin auth user: %', admin_auth_id;

    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM user_profiles WHERE id = admin_auth_id)
    INTO admin_profile_exists;

    IF NOT admin_profile_exists THEN
      RAISE NOTICE '  Creating master admin profile...';

      -- Create or get organization
      SELECT id INTO admin_org_id FROM organizations LIMIT 1;

      IF admin_org_id IS NULL THEN
        INSERT INTO organizations (name, created_by, enabled_verticals)
        VALUES ('Master Organization', admin_auth_id, ARRAY['church', 'business', 'estate']::text[])
        RETURNING id INTO admin_org_id;
        RAISE NOTICE '  Created organization: %', admin_org_id;
      END IF;

      -- Create profile
      INSERT INTO user_profiles (
        id,
        email,
        full_name,
        role,
        organization_id,
        is_active,
        active_vertical,
        permission_overrides,
        created_at,
        updated_at
      ) VALUES (
        admin_auth_id,
        'kyle.sean.krawczyk@gmail.com',
        'Kyle Krawczyk',
        'master_admin',
        admin_org_id,
        true,
        'church',
        '{}'::jsonb,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        role = 'master_admin',
        is_active = true,
        active_vertical = COALESCE(user_profiles.active_vertical, 'church'),
        permission_overrides = COALESCE(user_profiles.permission_overrides, '{}'::jsonb),
        organization_id = COALESCE(user_profiles.organization_id, admin_org_id);

      RAISE NOTICE '✓ Master admin profile created/updated';
    ELSE
      RAISE NOTICE '✓ Master admin profile already exists';

      -- Ensure organization exists
      SELECT organization_id INTO admin_org_id FROM user_profiles WHERE id = admin_auth_id;
      
      IF admin_org_id IS NULL THEN
        SELECT id INTO admin_org_id FROM organizations LIMIT 1;
        
        IF admin_org_id IS NULL THEN
          INSERT INTO organizations (name, created_by, enabled_verticals)
          VALUES ('Master Organization', admin_auth_id, ARRAY['church', 'business', 'estate']::text[])
          RETURNING id INTO admin_org_id;
          RAISE NOTICE '  Created organization: %', admin_org_id;
        END IF;
      END IF;

      -- Update to ensure all fields are set
      UPDATE user_profiles
      SET
        role = 'master_admin',
        is_active = true,
        organization_id = COALESCE(organization_id, admin_org_id),
        active_vertical = COALESCE(active_vertical, 'church'),
        permission_overrides = COALESCE(permission_overrides, '{}'::jsonb)
      WHERE id = admin_auth_id;

      RAISE NOTICE '  Updated master admin profile fields';
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'PHASE 5: FIX AI_PAGE_CONTEXT TABLE';
  RAISE NOTICE '=========================================';
END $$;

-- Fix ai_page_context table if it exists
DO $$
DECLARE
  policy_record RECORD;
  has_org_id_column boolean;
  org_id_nullable boolean;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_page_context') THEN
    RAISE NOTICE 'Found ai_page_context table';
    
    -- Check if organization_id column exists
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'ai_page_context'
        AND column_name = 'organization_id'
    ) INTO has_org_id_column;
    
    IF has_org_id_column THEN
      -- Check if it's nullable
      SELECT is_nullable = 'YES' INTO org_id_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'ai_page_context'
        AND column_name = 'organization_id';
      
      IF NOT org_id_nullable THEN
        ALTER TABLE ai_page_context ALTER COLUMN organization_id DROP NOT NULL;
        RAISE NOTICE '✓ Made organization_id nullable in ai_page_context';
      ELSE
        RAISE NOTICE '  organization_id already nullable in ai_page_context';
      END IF;
    ELSE
      RAISE NOTICE '  organization_id column does not exist in ai_page_context';
    END IF;
    
    -- Drop existing policies
    FOR policy_record IN
      SELECT policyname
      FROM pg_policies
      WHERE tablename = 'ai_page_context' AND schemaname = 'public'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON ai_page_context', policy_record.policyname);
      RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;

    -- Recreate policies
    CREATE POLICY "Users can view own page context"
      ON ai_page_context FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert own page context"
      ON ai_page_context FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Service role full access on ai_page_context"
      ON ai_page_context FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    RAISE NOTICE '✓ Created 3 new RLS policies on ai_page_context';
  ELSE
    RAISE NOTICE '  ai_page_context table does not exist, skipping';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'PHASE 6: FIX AI_TOOL_ACCESS_REQUESTS';
  RAISE NOTICE '=========================================';
END $$;

-- Fix ai_tool_access_requests table if it exists
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_tool_access_requests') THEN
    RAISE NOTICE 'Found ai_tool_access_requests table';
    
    -- Drop existing policies
    FOR policy_record IN
      SELECT policyname
      FROM pg_policies
      WHERE tablename = 'ai_tool_access_requests' AND schemaname = 'public'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON ai_tool_access_requests', policy_record.policyname);
      RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;

    -- Recreate with fixed policies
    CREATE POLICY "Users can view their own requests"
      ON ai_tool_access_requests FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "Admins can view all requests"
      ON ai_tool_access_requests FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role IN ('master_admin', 'admin')
          AND user_profiles.is_active = true
        )
      );

    CREATE POLICY "Users can create requests"
      ON ai_tool_access_requests FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update own pending requests"
      ON ai_tool_access_requests FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id AND status = 'pending')
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Admins can update all requests"
      ON ai_tool_access_requests FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role IN ('master_admin', 'admin')
          AND user_profiles.is_active = true
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role IN ('master_admin', 'admin')
          AND user_profiles.is_active = true
        )
      );

    CREATE POLICY "Service role full access on requests"
      ON ai_tool_access_requests FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    RAISE NOTICE '✓ Created 6 new RLS policies on ai_tool_access_requests';
  ELSE
    RAISE NOTICE '  ai_tool_access_requests table does not exist, skipping';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'PHASE 7: VERIFICATION';
  RAISE NOTICE '=========================================';
END $$;

-- Test queries that were failing
DO $$
DECLARE
  admin_id uuid;
  test_active_vertical text;
  test_org_id uuid;
  test_role text;
  test_template uuid;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'kyle.sean.krawczyk@gmail.com' LIMIT 1;
  
  IF admin_id IS NOT NULL THEN
    RAISE NOTICE 'Testing user_profiles query with active_vertical and organization_id:';
    SELECT active_vertical, organization_id INTO test_active_vertical, test_org_id
    FROM user_profiles
    WHERE id = admin_id;
    RAISE NOTICE '  active_vertical: %, organization_id: %', test_active_vertical, COALESCE(test_org_id::text, 'NULL');

    RAISE NOTICE 'Testing user_profiles query with role and default_permission_template:';
    SELECT role, default_permission_template INTO test_role, test_template
    FROM user_profiles
    WHERE id = admin_id;
    RAISE NOTICE '  role: %, default_permission_template: %', test_role, COALESCE(test_template::text, 'NULL');

    RAISE NOTICE '✓ All verification queries passed';
  ELSE
    RAISE NOTICE '⚠ Cannot verify - admin user not found';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'FINAL STATUS';
  RAISE NOTICE '=========================================';
END $$;

-- Final status report
DO $$
DECLARE
  user_profile_count int;
  admin_count int;
  org_count int;
  context_count int;
BEGIN
  SELECT COUNT(*) INTO user_profile_count FROM user_profiles;
  SELECT COUNT(*) FILTER (WHERE role = 'master_admin') INTO admin_count FROM user_profiles;
  SELECT COUNT(*) INTO org_count FROM organizations;
  
  RAISE NOTICE 'Table Statistics:';
  RAISE NOTICE '  user_profiles: % rows (% master_admin)', user_profile_count, admin_count;
  RAISE NOTICE '  organizations: % rows', org_count;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_page_context') THEN
    SELECT COUNT(*) INTO context_count FROM ai_page_context;
    RAISE NOTICE '  ai_page_context: % rows', context_count;
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=========================================';
  RAISE NOTICE '✓ FIX COMPLETE!';
  RAISE NOTICE '=========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Refresh your application';
  RAISE NOTICE '2. Clear browser cache if needed';
  RAISE NOTICE '3. Log in with kyle.sean.krawczyk@gmail.com';
  RAISE NOTICE '';
END $$;
