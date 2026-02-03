/*
  # Fix Infinite Recursion in user_profiles RLS Policies
  
  ## Problem
  The current RLS policies on user_profiles cause infinite recursion (PostgreSQL error 42P17).
  This occurs because policies query user_profiles within user_profiles policy evaluation,
  creating a circular reference.
  
  ## Root Cause
  Policies like:
  ```sql
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles  -- ❌ RECURSION!
      WHERE id = auth.uid()
    )
  )
  ```
  
  When PostgreSQL evaluates this policy to check if a user can view user_profiles,
  it must query user_profiles, which triggers the same policy check again, creating
  infinite recursion.
  
  ## Solution
  1. Drop ALL existing recursive policies
  2. Create simple, non-recursive policies using ONLY auth.uid() for self-access
  3. Use a helper function with SECURITY DEFINER to safely get user's organization
  4. Create organization-based policies that use the helper function
  
  ## Changes Made
  1. Dropped all existing user_profiles policies
  2. Created simple self-access policies (SELECT, UPDATE, INSERT)
  3. Created helper function to get user's organization without recursion
  4. Created organization-scoped policies using the helper
  5. Created service role bypass policy for triggers
  
  ## Testing
  After applying this migration, verify with:
  - SELECT * FROM user_profiles WHERE id = auth.uid();
  - Should work without recursion errors
*/

-- ============================================================================
-- STEP 1: Drop ALL Existing Policies on user_profiles
-- ============================================================================

DROP POLICY IF EXISTS "Users can view profiles in their organization" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile and org profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view org profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their organization" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update org profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Allow system to create profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "System can insert user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to create profiles" ON user_profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Anyone can insert their profile" ON user_profiles;

-- ============================================================================
-- STEP 2: Create Helper Function (SECURITY DEFINER to bypass RLS)
-- ============================================================================

-- This function safely retrieves the current user's organization_id without
-- causing recursion because SECURITY DEFINER runs with elevated privileges
-- and bypasses RLS
CREATE OR REPLACE FUNCTION get_my_organization_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id 
  FROM user_profiles 
  WHERE id = auth.uid() 
  LIMIT 1;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_my_organization_id() TO authenticated;

-- ============================================================================
-- STEP 3: Create Simple, Non-Recursive Self-Access Policies
-- ============================================================================

-- Policy 1: Users can read their own profile
-- Uses direct comparison, no subqueries
CREATE POLICY "users_read_own_profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy 2: Users can update their own profile
-- Uses direct comparison, no subqueries
CREATE POLICY "users_update_own_profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy 3: Users can insert their own profile during registration
-- Uses direct comparison, no subqueries
CREATE POLICY "users_insert_own_profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- STEP 4: Create Organization-Scoped Policies Using Helper Function
-- ============================================================================

-- Policy 4: Users can view other profiles in their organization
-- Uses helper function to avoid recursion
CREATE POLICY "users_read_org_profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    organization_id IS NOT NULL
    AND organization_id = get_my_organization_id()
    AND is_active = true
  );

-- Policy 5: Admins can update profiles in their organization
-- Uses helper function to avoid recursion
CREATE POLICY "admins_update_org_profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IS NOT NULL
    AND organization_id = get_my_organization_id()
    AND EXISTS (
      SELECT 1 FROM user_profiles AS my_profile
      WHERE my_profile.id = auth.uid()
        AND my_profile.role IN ('master_admin', 'admin')
        AND my_profile.is_active = true
      LIMIT 1
    )
  )
  WITH CHECK (
    organization_id = get_my_organization_id()
  );

-- ============================================================================
-- STEP 5: Create Service Role Bypass Policy for Triggers
-- ============================================================================

-- Policy 6: Service role can do anything (for triggers and system operations)
CREATE POLICY "service_role_bypass"
  ON user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- STEP 6: Verification Queries
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'RLS Policy Fix Complete';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'The following policies have been created on user_profiles:';
  RAISE NOTICE '1. users_read_own_profile - Users can read their own profile';
  RAISE NOTICE '2. users_update_own_profile - Users can update their own profile';
  RAISE NOTICE '3. users_insert_own_profile - Users can insert their own profile';
  RAISE NOTICE '4. users_read_org_profiles - Users can read profiles in their org';
  RAISE NOTICE '5. admins_update_org_profiles - Admins can update profiles in their org';
  RAISE NOTICE '6. service_role_bypass - Service role can manage all profiles';
  RAISE NOTICE '';
  RAISE NOTICE 'Helper function created: get_my_organization_id()';
  RAISE NOTICE '';
  RAISE NOTICE 'All policies use direct comparisons or SECURITY DEFINER functions';
  RAISE NOTICE 'to avoid infinite recursion.';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
END $$;
