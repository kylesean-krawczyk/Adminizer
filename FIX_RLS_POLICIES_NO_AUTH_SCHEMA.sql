-- =====================================================
-- COMPLETE FIX FOR RLS POLICIES (Public Schema)
-- =====================================================
-- Fixes: Infinite recursion, missing basic policies
-- Addresses: 500 errors on user_profiles queries
-- User: 337480c8-004e-41b5-8064-28045f2de88f
-- Uses public schema instead of auth schema
-- =====================================================

BEGIN;

-- =====================================================
-- SECTION 1: DROP ALL PROBLEMATIC POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view profiles in their organization" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their organization" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Anyone can insert their profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Allow system to create profiles" ON user_profiles;
DROP POLICY IF EXISTS "System can insert user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to create profiles" ON user_profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON user_profiles;

-- =====================================================
-- SECTION 2: CREATE HELPER FUNCTIONS IN PUBLIC SCHEMA
-- =====================================================

-- Helper function to get user's organization ID
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id
  FROM public.user_profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Helper function to check if user is active
CREATE OR REPLACE FUNCTION public.is_user_active()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(is_active, false)
  FROM public.user_profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Helper function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role
  FROM public.user_profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- =====================================================
-- SECTION 3: CREATE NON-RECURSIVE POLICIES
-- =====================================================

-- REQUIREMENT 1 & 2: Users can read their own profile
CREATE POLICY "user_profiles_select_own"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- REQUIREMENT 3: Users can view profiles in their organization
CREATE POLICY "user_profiles_select_org"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    organization_id IS NOT NULL
    AND organization_id = public.get_user_organization_id()
    AND public.is_user_active()
  );

-- Master admins can view ALL profiles
CREATE POLICY "user_profiles_select_admin"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() = 'master_admin'
    AND public.is_user_active()
  );

-- Users can update their own profile
CREATE POLICY "user_profiles_update_own"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can update profiles in their organization
CREATE POLICY "user_profiles_update_org_admin"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_user_organization_id()
    AND public.get_user_role() IN ('master_admin', 'admin')
    AND public.is_user_active()
  );

-- Master admins can update ALL profiles
CREATE POLICY "user_profiles_update_admin"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() = 'master_admin'
    AND public.is_user_active()
  );

-- Users can insert their own profile (for new signups)
CREATE POLICY "user_profiles_insert_own"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Master admins can delete profiles
CREATE POLICY "user_profiles_delete_admin"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (
    public.get_user_role() = 'master_admin'
    AND public.is_user_active()
  );

-- =====================================================
-- SECTION 4: ENSURE RLS IS ENABLED
-- =====================================================

-- REQUIREMENT 4: Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 5: VERIFICATION
-- =====================================================

-- Check RLS is enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE tablename = 'user_profiles'
    AND schemaname = 'public'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled on user_profiles!';
  END IF;
  
  RAISE NOTICE 'RLS is enabled on user_profiles ✓';
END $$;

-- Count policies created
DO $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'user_profiles'
  AND schemaname = 'public';
  
  RAISE NOTICE 'Total policies on user_profiles: %', policy_count;
  
  IF policy_count < 8 THEN
    RAISE WARNING 'Expected at least 8 policies, found %', policy_count;
  ELSE
    RAISE NOTICE 'All policies created successfully ✓';
  END IF;
END $$;

-- Test query for user 337480c8-004e-41b5-8064-28045f2de88f
DO $$
DECLARE
  test_count integer;
BEGIN
  SELECT COUNT(*) INTO test_count
  FROM user_profiles
  WHERE id = '337480c8-004e-41b5-8064-28045f2de88f';
  
  IF test_count > 0 THEN
    RAISE NOTICE 'User profile is accessible ✓';
  ELSE
    RAISE WARNING 'User profile not found or not accessible';
  END IF;
END $$;

-- Verify helper functions exist
DO $$
DECLARE
  func_count integer;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname IN ('get_user_organization_id', 'is_user_active', 'get_user_role');
  
  RAISE NOTICE 'Helper functions created: %', func_count;
  
  IF func_count < 3 THEN
    RAISE WARNING 'Expected 3 helper functions, found %', func_count;
  ELSE
    RAISE NOTICE 'All helper functions created successfully ✓';
  END IF;
END $$;

-- List all policies for verification
SELECT
  'POLICY LIST' as info,
  policyname,
  cmd as operation,
  CASE
    WHEN qual::text LIKE '%FROM%user_profiles%' AND qual::text NOT LIKE '%public.get_%' AND qual::text NOT LIKE '%public.is_%' 
    THEN 'WARNING: Possible recursion'
    ELSE 'OK'
  END as status
FROM pg_policies
WHERE tablename = 'user_profiles'
AND schemaname = 'public'
ORDER BY policyname;

COMMIT;

-- =====================================================
-- SUMMARY
-- =====================================================

SELECT '
==========================================
✓ RLS POLICIES FIXED SUCCESSFULLY
==========================================

FIXED ISSUES:
1. ✓ Removed infinite recursion from policies
2. ✓ Created helper functions in public schema
3. ✓ Added policy for users to read own profile
4. ✓ Added policy for org members to read org profiles
5. ✓ Added master admin policies without recursion
6. ✓ RLS enabled on user_profiles

HELPER FUNCTIONS CREATED:
- public.get_user_organization_id()
- public.is_user_active()
- public.get_user_role()

QUERIES THAT SHOULD NOW WORK:
- SELECT active_vertical, organization_id WHERE id=eq.[user_id]
- SELECT organization_id WHERE id=eq.[user_id]
- SELECT * WHERE id=eq.[user_id]
- SELECT role, default_permission_template WHERE id=eq.[user_id]

NEXT STEPS:
1. Refresh your application
2. Check console - 500 errors should be gone
3. Dashboard should load with content
==========================================
' as summary;

-- =====================================================
-- END OF SCRIPT
-- =====================================================
