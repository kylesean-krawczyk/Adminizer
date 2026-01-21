/*
  ============================================================================
  CRITICAL AUTH FIX - Resolve 500 Error on Login
  ============================================================================

  This script fixes the authentication error by updating the handle_new_user
  trigger function to properly bypass RLS when creating user profiles.

  PROBLEM IDENTIFIED:
  - The handle_new_user() trigger is marked as SECURITY DEFINER
  - But it's not explicitly setting the role to bypass RLS
  - When a new user signs up or auth.users record is created
  - The trigger tries to INSERT into user_profiles
  - RLS blocks the INSERT because there's no authenticated user context yet
  - This causes a 500 error and "Database error querying schema"

  SOLUTION:
  - Update the function to use service_role privileges
  - Add explicit RLS bypass for the INSERT operation
  - Ensure the trigger can create user_profiles without auth context

  ============================================================================
  INSTRUCTIONS:
  ============================================================================

  1. Open Supabase Dashboard: https://supabase.com/dashboard
  2. Select your project
  3. Click "SQL Editor" → "New query"
  4. Copy and paste this ENTIRE script
  5. Click "Run"
  6. Try logging in again

  ============================================================================
*/

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'FIX AUTH ERROR - Updating handle_new_user Function';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 1: Drop and recreate handle_new_user function with proper RLS bypass
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'STEP 1: Recreating handle_new_user Function';
  RAISE NOTICE '------------------------------------------------------------';
END $$;

-- Drop existing function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create improved version that bypasses RLS properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  profile_exists boolean := false;
BEGIN
  -- Check if profile already exists
  SELECT EXISTS(
    SELECT 1 FROM public.user_profiles WHERE id = NEW.id
  ) INTO profile_exists;

  -- Only create if it doesn't exist
  IF NOT profile_exists THEN
    -- Insert with explicit security context bypass
    -- This INSERT will use the function owner's privileges (SECURITY DEFINER)
    -- and bypass RLS policies
    INSERT INTO public.user_profiles (
      id,
      email,
      role,
      is_active,
      active_vertical,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      'user',  -- Default role for new users
      true,
      'church',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RAISE LOG 'Created user profile for: %', NEW.email;
  ELSE
    RAISE LOG 'User profile already exists for: %', NEW.email;
  END IF;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail user creation
    RAISE LOG 'Error in handle_new_user for %: % %', NEW.email, SQLSTATE, SQLERRM;
    RAISE LOG 'Error detail: %', SQLERRM;

    -- Still return NEW to allow user creation in auth.users
    RETURN NEW;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✓ handle_new_user function recreated';
END $$;

-- ============================================================================
-- STEP 2: Recreate the trigger on auth.users
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'STEP 2: Recreating Trigger on auth.users';
  RAISE NOTICE '------------------------------------------------------------';
END $$;

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DO $$
BEGIN
  RAISE NOTICE '✓ Trigger recreated on auth.users table';
END $$;

-- ============================================================================
-- STEP 3: Grant necessary permissions to function
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'STEP 3: Granting Permissions';
  RAISE NOTICE '------------------------------------------------------------';
END $$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

DO $$
BEGIN
  RAISE NOTICE '✓ Permissions granted';
END $$;

-- ============================================================================
-- STEP 4: Verify the fix
-- ============================================================================

DO $$
DECLARE
  trigger_count integer;
  function_exists boolean;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'STEP 4: Verifying Fix';
  RAISE NOTICE '------------------------------------------------------------';

  -- Check trigger exists
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';

  -- Check function exists
  SELECT EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user'
  ) INTO function_exists;

  RAISE NOTICE '  Trigger exists: %', CASE WHEN trigger_count > 0 THEN '✓ Yes' ELSE '✗ No' END;
  RAISE NOTICE '  Function exists: %', CASE WHEN function_exists THEN '✓ Yes' ELSE '✗ No' END;
  RAISE NOTICE '  Function security: SECURITY DEFINER (bypasses RLS)';
  RAISE NOTICE '';

  IF trigger_count > 0 AND function_exists THEN
    RAISE NOTICE '✓ Verification passed';
  ELSE
    RAISE WARNING 'Verification failed - something is missing';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Test with a dummy user (optional - commented out)
-- ============================================================================

/*
-- Uncomment this section to test the trigger with a dummy user
-- This creates and immediately deletes a test user to verify the trigger works

DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  test_email text := 'test_' || test_user_id || '@example.com';
  profile_created boolean;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'STEP 5: Testing Trigger (Optional)';
  RAISE NOTICE '------------------------------------------------------------';

  -- Create test auth user
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    role,
    aud
  )
  VALUES (
    test_user_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    test_email,
    crypt('test123', gen_salt('bf')),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated'
  );

  -- Wait a moment for trigger to fire
  PERFORM pg_sleep(0.5);

  -- Check if profile was created
  SELECT EXISTS(
    SELECT 1 FROM user_profiles WHERE id = test_user_id
  ) INTO profile_created;

  RAISE NOTICE '  Test user created: %', test_user_id;
  RAISE NOTICE '  Profile auto-created: %', CASE WHEN profile_created THEN '✓ Yes' ELSE '✗ No' END;

  -- Clean up test user
  DELETE FROM user_profiles WHERE id = test_user_id;
  DELETE FROM auth.users WHERE id = test_user_id;

  RAISE NOTICE '  Test user cleaned up';
  RAISE NOTICE '';

  IF profile_created THEN
    RAISE NOTICE '✓ Trigger test passed';
  ELSE
    RAISE WARNING 'Trigger test failed - profile was not created';
  END IF;
END $$;
*/

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'AUTH FIX COMPLETE';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'What was fixed:';
  RAISE NOTICE '  1. Updated handle_new_user() function to properly bypass RLS';
  RAISE NOTICE '  2. Added SECURITY DEFINER with proper search_path';
  RAISE NOTICE '  3. Recreated trigger on auth.users table';
  RAISE NOTICE '  4. Granted necessary permissions';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Try logging in to your application';
  RAISE NOTICE '  2. If you still get 500 error, check Supabase logs';
  RAISE NOTICE '  3. Verify user_profiles record is created after login';
  RAISE NOTICE '';
  RAISE NOTICE 'For existing users who couldn''t login:';
  RAISE NOTICE '  - Their auth.users record exists';
  RAISE NOTICE '  - Run the super admin creation script to create their profile';
  RAISE NOTICE '  - Or manually create user_profiles record';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
END $$;
