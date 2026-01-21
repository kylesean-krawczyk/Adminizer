/*
  ============================================================================
  CREATE SUPER ADMIN USER - COMPLETE SETUP SCRIPT
  ============================================================================

  This script creates a super admin user from scratch for your Supabase application.

  WHAT THIS SCRIPT DOES:
  1. Creates a primary organization (if it doesn't exist)
  2. Creates a super admin user in Supabase Auth (auth.users)
  3. Creates the corresponding user profile with master_admin role
  4. Links the organization to the super admin
  5. Verifies everything was created successfully

  CREDENTIALS (CHANGE AFTER FIRST LOGIN):
  Email: admin@yourdomain.com
  Password: TempPassword123!

  ============================================================================
  INSTRUCTIONS:
  ============================================================================

  1. Open your Supabase Dashboard: https://supabase.com/dashboard
  2. Select your project
  3. Click "SQL Editor" in the left sidebar
  4. Click "New query" button
  5. IMPORTANT: Replace admin@yourdomain.com with YOUR email address (line 57)
  6. Copy and paste this ENTIRE script
  7. Click "Run" button (or press Ctrl+Enter)
  8. Check the "Messages" tab for success confirmation

  ============================================================================
*/

DO $$
DECLARE
  v_org_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_user_id uuid := gen_random_uuid();
  v_admin_email text := 'admin@yourdomain.com';  -- ⚠️ CHANGE THIS TO YOUR EMAIL
  v_temp_password text := 'TempPassword123!';
  v_org_count integer;
  v_user_count integer;
  v_profile_count integer;
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'CREATING SUPER ADMIN USER';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Email: %', v_admin_email;
  RAISE NOTICE 'Password: %', v_temp_password;
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 1: Create Primary Organization
  -- ============================================================================

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'STEP 1: Creating Primary Organization...';
  RAISE NOTICE '------------------------------------------------------------';

  INSERT INTO organizations (
    id,
    name,
    vertical,
    enabled_verticals,
    created_at,
    updated_at
  )
  VALUES (
    v_org_id,
    'Primary Organization',
    'church',
    '{church,business,estate}',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = now();

  SELECT COUNT(*) INTO v_org_count
  FROM organizations
  WHERE id = v_org_id;

  IF v_org_count > 0 THEN
    RAISE NOTICE '✓ Primary organization created/updated (ID: %)', v_org_id;
  ELSE
    RAISE EXCEPTION 'Failed to create primary organization';
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 2: Create Super Admin Auth User
  -- ============================================================================

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'STEP 2: Creating Super Admin Auth User...';
  RAISE NOTICE '------------------------------------------------------------';

  -- Check if user already exists
  SELECT COUNT(*) INTO v_user_count
  FROM auth.users
  WHERE email = v_admin_email;

  IF v_user_count > 0 THEN
    RAISE NOTICE '⚠ User with email % already exists. Skipping auth user creation.', v_admin_email;

    -- Get existing user ID
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_admin_email
    LIMIT 1;

    RAISE NOTICE '  Using existing user ID: %', v_user_id;
  ELSE
    -- Create new auth user
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud,
      confirmation_token,
      email_change_token_current,
      email_change_token_new
    )
    VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      v_admin_email,
      crypt(v_temp_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Super Admin"}'::jsonb,
      false,
      'authenticated',
      'authenticated',
      '',
      '',
      ''
    );

    RAISE NOTICE '✓ Super admin auth user created';
    RAISE NOTICE '  Email: %', v_admin_email;
    RAISE NOTICE '  User ID: %', v_user_id;
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 3: Create Super Admin User Profile
  -- ============================================================================

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'STEP 3: Creating Super Admin User Profile...';
  RAISE NOTICE '------------------------------------------------------------';

  -- Set constraints to deferred to handle circular dependency
  SET CONSTRAINTS organizations_created_by_fkey DEFERRED;

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
    v_org_id,
    true,
    'church',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    organization_id = EXCLUDED.organization_id,
    is_active = EXCLUDED.is_active,
    updated_at = now();

  SELECT COUNT(*) INTO v_profile_count
  FROM user_profiles
  WHERE id = v_user_id AND role = 'master_admin';

  IF v_profile_count > 0 THEN
    RAISE NOTICE '✓ Super admin user profile created';
    RAISE NOTICE '  Role: master_admin';
    RAISE NOTICE '  Organization: Primary Organization';
  ELSE
    RAISE EXCEPTION 'Failed to create super admin user profile';
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 4: Link Organization to Super Admin
  -- ============================================================================

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'STEP 4: Linking Organization to Super Admin...';
  RAISE NOTICE '------------------------------------------------------------';

  UPDATE organizations
  SET created_by = v_user_id,
      updated_at = now()
  WHERE id = v_org_id;

  RAISE NOTICE '✓ Organization linked to super admin';
  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 5: Verify Setup
  -- ============================================================================

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'STEP 5: Verifying Setup...';
  RAISE NOTICE '------------------------------------------------------------';

  -- Verify organization
  SELECT COUNT(*) INTO v_org_count
  FROM organizations
  WHERE id = v_org_id;

  -- Verify auth user
  SELECT COUNT(*) INTO v_user_count
  FROM auth.users
  WHERE id = v_user_id;

  -- Verify profile
  SELECT COUNT(*) INTO v_profile_count
  FROM user_profiles
  WHERE id = v_user_id AND role = 'master_admin';

  RAISE NOTICE '  Organizations: %', CASE WHEN v_org_count > 0 THEN '✓ Created' ELSE '✗ Missing' END;
  RAISE NOTICE '  Auth Users: %', CASE WHEN v_user_count > 0 THEN '✓ Created' ELSE '✗ Missing' END;
  RAISE NOTICE '  User Profiles: %', CASE WHEN v_profile_count > 0 THEN '✓ Created' ELSE '✗ Missing' END;
  RAISE NOTICE '';

  -- ============================================================================
  -- SUCCESS!
  -- ============================================================================

  IF v_org_count > 0 AND v_user_count > 0 AND v_profile_count > 0 THEN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '✓✓✓ SUCCESS! Super Admin User Created! ✓✓✓';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now login with:';
    RAISE NOTICE '  Email: %', v_admin_email;
    RAISE NOTICE '  Password: %', v_temp_password;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: Change your password immediately after first login!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Go to your application login page';
    RAISE NOTICE '  2. Login with the credentials above';
    RAISE NOTICE '  3. Navigate to Settings > Change Password';
    RAISE NOTICE '  4. Set a strong, secure password';
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
  ELSE
    RAISE EXCEPTION 'Setup verification failed! Please check the errors above.';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '✗✗✗ ERROR: Super Admin Creation Failed ✗✗✗';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Error: % %', SQLSTATE, SQLERRM;
    RAISE NOTICE '';
    RAISE NOTICE 'Please check:';
    RAISE NOTICE '  1. The email address is correct and not already in use';
    RAISE NOTICE '  2. The organizations and user_profiles tables exist';
    RAISE NOTICE '  3. All required extensions (pgcrypto) are enabled';
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE;
END $$;
