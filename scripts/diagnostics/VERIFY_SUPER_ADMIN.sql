/*
  ============================================================================
  VERIFY SUPER ADMIN SETUP
  ============================================================================

  This script checks if your super admin user was created successfully
  and all permissions are properly configured.

  INSTRUCTIONS:
  1. Open Supabase Dashboard → SQL Editor → New query
  2. Copy and paste this ENTIRE script
  3. Click "Run" button
  4. Review the results to verify everything is correct

  ============================================================================
*/

DO $$
DECLARE
  v_admin_email text := 'admin@yourdomain.com';  -- ⚠️ CHANGE THIS TO YOUR EMAIL
  v_auth_user_count integer;
  v_profile_count integer;
  v_org_count integer;
  v_policy_count integer;
  v_user_id uuid;
  v_user_role text;
  v_is_active boolean;
  v_org_id uuid;
  v_org_name text;
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'SUPER ADMIN VERIFICATION REPORT';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Checking setup for: %', v_admin_email;
  RAISE NOTICE '';

  -- ============================================================================
  -- CHECK 1: Auth User Exists
  -- ============================================================================

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'CHECK 1: Authentication User';
  RAISE NOTICE '------------------------------------------------------------';

  SELECT COUNT(*), MAX(id) INTO v_auth_user_count, v_user_id
  FROM auth.users
  WHERE email = v_admin_email;

  IF v_auth_user_count > 0 THEN
    RAISE NOTICE '✅ PASS: Auth user exists';
    RAISE NOTICE '   User ID: %', v_user_id;
    RAISE NOTICE '   Email: %', v_admin_email;
  ELSE
    RAISE NOTICE '❌ FAIL: Auth user NOT found';
    RAISE NOTICE '   Email searched: %', v_admin_email;
    RAISE NOTICE '   ACTION: Run CREATE_SUPER_ADMIN.sql script';
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- CHECK 2: User Profile Exists with Correct Role
  -- ============================================================================

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'CHECK 2: User Profile & Role';
  RAISE NOTICE '------------------------------------------------------------';

  SELECT COUNT(*), MAX(role), MAX(is_active), MAX(organization_id)
  INTO v_profile_count, v_user_role, v_is_active, v_org_id
  FROM user_profiles
  WHERE email = v_admin_email;

  IF v_profile_count > 0 THEN
    RAISE NOTICE '✅ PASS: User profile exists';
    RAISE NOTICE '   Role: %', v_user_role;
    RAISE NOTICE '   Active: %', v_is_active;
    RAISE NOTICE '   Organization ID: %', v_org_id;

    IF v_user_role = 'master_admin' THEN
      RAISE NOTICE '✅ PASS: Role is master_admin (super admin)';
    ELSE
      RAISE NOTICE '⚠️  WARNING: Role is "%" (expected "master_admin")', v_user_role;
      RAISE NOTICE '   ACTION: Update role to master_admin';
    END IF;

    IF v_is_active = true THEN
      RAISE NOTICE '✅ PASS: User is active';
    ELSE
      RAISE NOTICE '❌ FAIL: User is inactive';
      RAISE NOTICE '   ACTION: Activate user in user_profiles table';
    END IF;
  ELSE
    RAISE NOTICE '❌ FAIL: User profile NOT found';
    RAISE NOTICE '   ACTION: Run CREATE_SUPER_ADMIN.sql script';
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- CHECK 3: Organization Exists
  -- ============================================================================

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'CHECK 3: Organization';
  RAISE NOTICE '------------------------------------------------------------';

  IF v_org_id IS NOT NULL THEN
    SELECT COUNT(*), MAX(name) INTO v_org_count, v_org_name
    FROM organizations
    WHERE id = v_org_id;

    IF v_org_count > 0 THEN
      RAISE NOTICE '✅ PASS: Organization exists';
      RAISE NOTICE '   Organization ID: %', v_org_id;
      RAISE NOTICE '   Organization Name: %', v_org_name;
    ELSE
      RAISE NOTICE '❌ FAIL: Organization NOT found';
      RAISE NOTICE '   Expected ID: %', v_org_id;
      RAISE NOTICE '   ACTION: Create organization or fix organization_id';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  WARNING: User has no organization assigned';
    RAISE NOTICE '   ACTION: Assign user to an organization';
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- CHECK 4: Super Admin RLS Policies
  -- ============================================================================

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'CHECK 4: Super Admin RLS Policies';
  RAISE NOTICE '------------------------------------------------------------';

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND policyname LIKE 'Super admins%';

  RAISE NOTICE '   Total super admin policies: %', v_policy_count;

  IF v_policy_count >= 16 THEN
    RAISE NOTICE '✅ PASS: Super admin policies configured (expected: 16+)';
  ELSIF v_policy_count > 0 THEN
    RAISE NOTICE '⚠️  WARNING: Only % policies found (expected: 16+)', v_policy_count;
    RAISE NOTICE '   ACTION: Run UPDATE_RLS_POLICIES.sql script';
  ELSE
    RAISE NOTICE '❌ FAIL: No super admin policies found';
    RAISE NOTICE '   ACTION: Run UPDATE_RLS_POLICIES.sql script';
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- CHECK 5: Policy Breakdown by Table
  -- ============================================================================

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'CHECK 5: Policy Breakdown';
  RAISE NOTICE '------------------------------------------------------------';

  FOR rec IN
    SELECT
      tablename,
      COUNT(*) as policy_count,
      string_agg(cmd, ', ' ORDER BY cmd) as operations
    FROM pg_policies
    WHERE schemaname = 'public'
    AND policyname LIKE 'Super admins%'
    GROUP BY tablename
    ORDER BY tablename
  LOOP
    RAISE NOTICE '   % - % policies (%)', rec.tablename, rec.policy_count, rec.operations;
  END LOOP;

  RAISE NOTICE '';

  -- ============================================================================
  -- CHECK 6: Test Access Permissions
  -- ============================================================================

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'CHECK 6: Access Test (if user exists)';
  RAISE NOTICE '------------------------------------------------------------';

  IF v_user_id IS NOT NULL THEN
    DECLARE
      v_can_read_profiles boolean := false;
      v_can_read_orgs boolean := false;
      v_can_read_docs boolean := false;
    BEGIN
      -- Note: These are simplified checks, actual RLS evaluation happens at runtime
      SELECT EXISTS(
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'user_profiles'
        AND policyname LIKE 'Super admins%'
        AND cmd IN ('SELECT', 'ALL')
      ) INTO v_can_read_profiles;

      SELECT EXISTS(
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'organizations'
        AND policyname LIKE 'Super admins%'
        AND cmd IN ('SELECT', 'ALL')
      ) INTO v_can_read_orgs;

      SELECT EXISTS(
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'documents'
        AND policyname LIKE 'Super admins%'
        AND cmd IN ('SELECT', 'ALL')
      ) INTO v_can_read_docs;

      RAISE NOTICE '   User Profiles: %', CASE WHEN v_can_read_profiles THEN '✅ Accessible' ELSE '❌ No access' END;
      RAISE NOTICE '   Organizations: %', CASE WHEN v_can_read_orgs THEN '✅ Accessible' ELSE '❌ No access' END;
      RAISE NOTICE '   Documents: %', CASE WHEN v_can_read_docs THEN '✅ Accessible' ELSE '❌ No access' END;
    END;
  ELSE
    RAISE NOTICE '   ⚠️  Skipped: User not found';
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- FINAL SUMMARY
  -- ============================================================================

  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'SUMMARY';
  RAISE NOTICE '============================================================================';

  IF v_auth_user_count > 0 AND v_profile_count > 0 AND v_user_role = 'master_admin'
     AND v_is_active = true AND v_org_count > 0 AND v_policy_count >= 16 THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅✅✅ ALL CHECKS PASSED! ✅✅✅';
    RAISE NOTICE '';
    RAISE NOTICE 'Your super admin user is fully configured and ready to use!';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now login with:';
    RAISE NOTICE '  Email: %', v_admin_email;
    RAISE NOTICE '  Password: (the one you set)';
    RAISE NOTICE '';
    RAISE NOTICE 'Features available:';
    RAISE NOTICE '  ✅ Full access to all user profiles';
    RAISE NOTICE '  ✅ Full access to all organizations';
    RAISE NOTICE '  ✅ Full access to all documents';
    RAISE NOTICE '  ✅ Full access to all invitations';
    RAISE NOTICE '  ✅ All admin features unlocked';
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '⚠️⚠️⚠️ SETUP INCOMPLETE ⚠️⚠️⚠️';
    RAISE NOTICE '';
    RAISE NOTICE 'Some checks failed. Review the errors above and:';
    RAISE NOTICE '';

    IF v_auth_user_count = 0 OR v_profile_count = 0 THEN
      RAISE NOTICE '  1. Run CREATE_SUPER_ADMIN.sql to create the user';
    END IF;

    IF v_user_role != 'master_admin' THEN
      RAISE NOTICE '  2. Update user role to master_admin';
    END IF;

    IF v_is_active = false THEN
      RAISE NOTICE '  3. Activate the user (set is_active = true)';
    END IF;

    IF v_org_count = 0 THEN
      RAISE NOTICE '  4. Create or assign an organization';
    END IF;

    IF v_policy_count < 16 THEN
      RAISE NOTICE '  5. Run UPDATE_RLS_POLICIES.sql to grant full access';
    END IF;

    RAISE NOTICE '';
  END IF;

  RAISE NOTICE '============================================================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '❌ VERIFICATION ERROR';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Error: % %', SQLSTATE, SQLERRM;
    RAISE NOTICE '';
    RAISE NOTICE 'This might indicate:';
    RAISE NOTICE '  - Tables do not exist';
    RAISE NOTICE '  - Database schema is incomplete';
    RAISE NOTICE '  - Permission issues';
    RAISE NOTICE '';
    RAISE NOTICE 'ACTION: Run the full database setup script first';
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
END $$;

-- Show current user for reference
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Script executed as: %', current_user;
  RAISE NOTICE 'Script executed at: %', now();
END $$;
