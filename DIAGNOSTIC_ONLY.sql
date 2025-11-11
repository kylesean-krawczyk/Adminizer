-- ============================================================================
-- DIAGNOSTIC SCRIPT - Find the Problem
-- This script only reads data, makes NO changes
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'DIAGNOSTIC: Organizations Table';
  RAISE NOTICE '=========================================';
END $$;

-- Check organizations table structure
DO $$
DECLARE
  col_record RECORD;
BEGIN
  RAISE NOTICE 'Organizations table columns:';
  FOR col_record IN
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'organizations'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '  - % (%) nullable:% default:%',
      col_record.column_name,
      col_record.data_type,
      col_record.is_nullable,
      COALESCE(col_record.column_default, 'none');
  END LOOP;
END $$;

-- Check organizations table data
DO $$
DECLARE
  org_record RECORD;
  org_count int;
BEGIN
  SELECT COUNT(*) INTO org_count FROM organizations;
  RAISE NOTICE '';
  RAISE NOTICE 'Organizations table has % rows', org_count;
  
  IF org_count > 0 THEN
    RAISE NOTICE 'Organization records:';
    FOR org_record IN SELECT * FROM organizations LOOP
      RAISE NOTICE '  ID: %', org_record.id;
      RAISE NOTICE '    name: %', org_record.name;
      RAISE NOTICE '    created_by: %', COALESCE(org_record.created_by::text, 'NULL');
      
      -- Try to show enabled_verticals if it exists
      BEGIN
        RAISE NOTICE '    enabled_verticals: %', org_record.enabled_verticals;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '    enabled_verticals: (column does not exist)';
      END;
    END LOOP;
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'DIAGNOSTIC: User Profiles Table';
  RAISE NOTICE '=========================================';
END $$;

-- Check user_profiles table structure
DO $$
DECLARE
  col_record RECORD;
BEGIN
  RAISE NOTICE 'User_profiles table columns:';
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

-- Check user_profiles data
DO $$
DECLARE
  profile_record RECORD;
  profile_count int;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM user_profiles;
  RAISE NOTICE '';
  RAISE NOTICE 'User_profiles table has % rows', profile_count;
  
  IF profile_count > 0 THEN
    RAISE NOTICE 'User profile records:';
    FOR profile_record IN SELECT * FROM user_profiles LOOP
      RAISE NOTICE '  ID: %', profile_record.id;
      RAISE NOTICE '    email: %', profile_record.email;
      RAISE NOTICE '    role: %', profile_record.role;
      RAISE NOTICE '    organization_id: %', COALESCE(profile_record.organization_id::text, 'NULL');
      RAISE NOTICE '    is_active: %', profile_record.is_active;
      
      BEGIN
        RAISE NOTICE '    active_vertical: %', COALESCE(profile_record.active_vertical, 'NULL');
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '    active_vertical: (column does not exist)';
      END;
      
      BEGIN
        RAISE NOTICE '    permission_overrides: %', COALESCE(profile_record.permission_overrides::text, 'NULL');
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '    permission_overrides: (column does not exist)';
      END;
    END LOOP;
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'DIAGNOSTIC: Auth Users';
  RAISE NOTICE '=========================================';
END $$;

-- Check auth users
DO $$
DECLARE
  user_record RECORD;
  user_count int;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  RAISE NOTICE 'Auth.users table has % rows', user_count;
  
  IF user_count > 0 THEN
    RAISE NOTICE 'Auth user records:';
    FOR user_record IN SELECT id, email, created_at FROM auth.users LOOP
      RAISE NOTICE '  - % (%) created:%', user_record.email, user_record.id, user_record.created_at;
    END LOOP;
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'DIAGNOSTIC: RLS Policies';
  RAISE NOTICE '=========================================';
END $$;

-- Check RLS policies
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE 'RLS Policies on user_profiles:';
  FOR policy_record IN
    SELECT policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE tablename = 'user_profiles' AND schemaname = 'public'
  LOOP
    RAISE NOTICE '  - % (%) USING: % WITH CHECK: %',
      policy_record.policyname,
      policy_record.cmd,
      COALESCE(policy_record.qual, 'none'),
      COALESCE(policy_record.with_check, 'none');
  END LOOP;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'DIAGNOSTIC COMPLETE';
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'Review the output above to identify:';
  RAISE NOTICE '1. Missing columns in user_profiles or organizations';
  RAISE NOTICE '2. Bad data (like "standard" instead of UUID)';
  RAISE NOTICE '3. Mismatched auth users vs user profiles';
  RAISE NOTICE '';
END $$;
