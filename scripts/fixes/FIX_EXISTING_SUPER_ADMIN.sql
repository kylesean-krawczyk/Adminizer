/*
  ============================================================================
  FIX EXISTING SUPER ADMIN USER
  ============================================================================

  This script fixes an existing super admin user who can't login due to
  the auth trigger error. It ensures:
  - Auth user exists and is properly configured
  - User profile exists with correct role
  - Email is confirmed
  - User is active

  Run this AFTER running FIX_AUTH_ERROR.sql

  ============================================================================
  INSTRUCTIONS:
  ============================================================================

  1. First run FIX_AUTH_ERROR.sql to fix the trigger
  2. Then run this script to fix your super admin user
  3. Update the email variable below (line 35) with your actual email
  4. Copy and paste this ENTIRE script in Supabase SQL Editor
  5. Click "Run"
  6. Try logging in again

  ============================================================================
*/

DO $$
DECLARE
  -- ⚠️ CHANGE THIS TO YOUR SUPER ADMIN EMAIL
  v_admin_email text := 'admin@yourdomain.com';  -- ⚠️ UPDATE THIS

  v_user_id uuid;
  v_auth_exists boolean := false;
  v_profile_exists boolean := false;
  v_email_confirmed boolean := false;
  v_current_role text;
  v_is_active boolean;
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'FIXING SUPER ADMIN USER';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Super admin email: %', v_admin_email;
  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 1: Check Auth User
  -- ============================================================================

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'STEP 1: Checking Auth User';
  RAISE NOTICE '------------------------------------------------------------';

  SELECT
    id,
    email_confirmed_at IS NOT NULL
  INTO v_user_id, v_email_confirmed
  FROM auth.users
  WHERE email = v_admin_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE '❌ Auth user NOT found for: %', v_admin_email;
    RAISE NOTICE '   ACTION: Run CREATE_SUPER_ADMIN.sql to create the user';
    RAISE NOTICE '';
    RAISE NOTICE 'Aborting - user does not exist in auth.users';
    RETURN;
  ELSE
    v_auth_exists := true;
    RAISE NOTICE '✓ Auth user exists';
    RAISE NOTICE '  User ID: %', v_user_id;
    RAISE NOTICE '  Email confirmed: %', v_email_confirmed;
  END IF;

  -- Fix email confirmation if needed
  IF NOT v_email_confirmed THEN
    RAISE NOTICE '';
    RAISE NOTICE '  Fixing: Setting email as confirmed...';

    UPDATE auth.users
    SET email_confirmed_at = now()
    WHERE id = v_user_id;

    RAISE NOTICE '  ✓ Email confirmed';
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 2: Check User Profile
  -- ============================================================================

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'STEP 2: Checking User Profile';
  RAISE NOTICE '------------------------------------------------------------';

  SELECT
    role,
    is_active
  INTO v_current_role, v_is_active
  FROM user_profiles
  WHERE id = v_user_id;

  IF v_current_role IS NULL THEN
    RAISE NOTICE '❌ User profile NOT found';
    RAISE NOTICE '   Creating user profile...';

    -- Create the user profile
    INSERT INTO user_profiles (
      id,
      email,
      full_name,
      role,
      organization_id,
      is_active,
      active_vertical,
      created_at,
      updated_at
    )
    VALUES (
      v_user_id,
      v_admin_email,
      'Super Admin',
      'master_admin',
      '00000000-0000-0000-0000-000000000001'::uuid,
      true,
      'church',
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'master_admin',
      is_active = true,
      updated_at = now();

    RAISE NOTICE '  ✓ User profile created';
    v_profile_exists := true;
    v_current_role := 'master_admin';
    v_is_active := true;
  ELSE
    v_profile_exists := true;
    RAISE NOTICE '✓ User profile exists';
    RAISE NOTICE '  Current role: %', v_current_role;
    RAISE NOTICE '  Is active: %', v_is_active;
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 3: Fix Role if Needed
  -- ============================================================================

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'STEP 3: Checking Role';
  RAISE NOTICE '------------------------------------------------------------';

  IF v_current_role != 'master_admin' THEN
    RAISE NOTICE '  Current role is: %', v_current_role;
    RAISE NOTICE '  Updating to: master_admin...';

    UPDATE user_profiles
    SET
      role = 'master_admin',
      is_active = true,
      updated_at = now()
    WHERE id = v_user_id;

    RAISE NOTICE '  ✓ Role updated to master_admin';
  ELSE
    RAISE NOTICE '✓ Role is correct (master_admin)';
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 4: Activate User if Needed
  -- ============================================================================

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'STEP 4: Checking Active Status';
  RAISE NOTICE '------------------------------------------------------------';

  IF NOT v_is_active THEN
    RAISE NOTICE '  User is inactive, activating...';

    UPDATE user_profiles
    SET
      is_active = true,
      updated_at = now()
    WHERE id = v_user_id;

    RAISE NOTICE '  ✓ User activated';
  ELSE
    RAISE NOTICE '✓ User is active';
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 5: Ensure Organization Exists
  -- ============================================================================

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'STEP 5: Checking Organization';
  RAISE NOTICE '------------------------------------------------------------';

  -- Create organization if it doesn't exist
  INSERT INTO organizations (
    id,
    name,
    vertical,
    enabled_verticals,
    created_by,
    created_at,
    updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Primary Organization',
    'church',
    '{church,business,estate}',
    v_user_id,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    created_by = v_user_id,
    updated_at = now();

  RAISE NOTICE '✓ Organization verified/created';
  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 6: Final Verification
  -- ============================================================================

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'STEP 6: Final Verification';
  RAISE NOTICE '------------------------------------------------------------';

  -- Re-check everything
  SELECT
    u.id,
    u.email,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    p.role,
    p.is_active,
    p.organization_id IS NOT NULL as has_org
  FROM auth.users u
  LEFT JOIN user_profiles p ON p.id = u.id
  WHERE u.email = v_admin_email
  INTO v_user_id, v_admin_email, v_email_confirmed, v_current_role, v_is_active, v_profile_exists;

  RAISE NOTICE '  User ID: %', v_user_id;
  RAISE NOTICE '  Email: %', v_admin_email;
  RAISE NOTICE '  Email Confirmed: %', CASE WHEN v_email_confirmed THEN '✓ Yes' ELSE '✗ No' END;
  RAISE NOTICE '  Role: %', v_current_role;
  RAISE NOTICE '  Active: %', CASE WHEN v_is_active THEN '✓ Yes' ELSE '✗ No' END;
  RAISE NOTICE '  Has Organization: %', CASE WHEN v_profile_exists THEN '✓ Yes' ELSE '✗ No' END;
  RAISE NOTICE '';

  -- ============================================================================
  -- SUCCESS!
  -- ============================================================================

  IF v_email_confirmed AND v_current_role = 'master_admin' AND v_is_active THEN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '✓✓✓ SUCCESS! Super Admin User Fixed! ✓✓✓';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Your super admin user is now properly configured.';
    RAISE NOTICE '';
    RAISE NOTICE 'Try logging in with:';
    RAISE NOTICE '  Email: %', v_admin_email;
    RAISE NOTICE '  Password: (your password)';
    RAISE NOTICE '';
    RAISE NOTICE 'If you don''t know your password:';
    RAISE NOTICE '  1. Go to Supabase Dashboard → Authentication → Users';
    RAISE NOTICE '  2. Find your user';
    RAISE NOTICE '  3. Click "Reset Password"';
    RAISE NOTICE '  4. Set a new password';
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
  ELSE
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '⚠️  INCOMPLETE SETUP';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Some issues remain:';
    IF NOT v_email_confirmed THEN
      RAISE NOTICE '  ✗ Email not confirmed';
    END IF;
    IF v_current_role != 'master_admin' THEN
      RAISE NOTICE '  ✗ Role is not master_admin (current: %)', v_current_role;
    END IF;
    IF NOT v_is_active THEN
      RAISE NOTICE '  ✗ User is not active';
    END IF;
    RAISE NOTICE '';
    RAISE NOTICE 'Please review the output above and fix manually if needed.';
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '✗✗✗ ERROR ✗✗✗';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Error: % %', SQLSTATE, SQLERRM;
    RAISE NOTICE '';
    RAISE NOTICE 'Please check:';
    RAISE NOTICE '  1. The email address is correct';
    RAISE NOTICE '  2. The organizations and user_profiles tables exist';
    RAISE NOTICE '  3. You ran FIX_AUTH_ERROR.sql first';
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE;
END $$;
