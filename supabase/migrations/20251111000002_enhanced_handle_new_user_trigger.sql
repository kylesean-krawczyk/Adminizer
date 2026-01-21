/*
  # Enhanced Handle New User Trigger with Error Logging

  1. Improvements
    - Add comprehensive error logging
    - Use UPSERT pattern with ON CONFLICT for idempotency
    - Validate email before insert
    - Set all required defaults explicitly
    - Log trigger execution attempts
    - Create admin alerts on failures
    - Add detailed RAISE LOG statements for debugging

  2. Error Handling
    - Catch all exceptions and log them
    - Don't fail auth user creation even if profile creation fails
    - Log errors to PostgreSQL logs
    - Create admin alerts for failed attempts

  3. Defaults Set
    - role: 'user'
    - is_active: true
    - active_vertical: 'church'
    - All timestamps: NOW()
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create enhanced trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  profile_exists boolean := false;
  email_value text;
  error_detail text;
BEGIN
  -- Log trigger execution
  RAISE LOG 'handle_new_user triggered for user ID: %, email: %', NEW.id, NEW.email;

  -- Validate email
  email_value := COALESCE(NEW.email, '');

  IF email_value = '' THEN
    RAISE WARNING 'User % has no email address', NEW.id;
    -- Create admin alert for missing email
    PERFORM log_profile_creation_failure(
      NEW.id,
      'no-email@unknown.com',
      'User created without email address',
      'MISSING_EMAIL',
      0,
      'Trigger: handle_new_user - User has no email in auth.users'
    );
  END IF;

  -- Check if profile already exists
  SELECT EXISTS(
    SELECT 1 FROM public.user_profiles WHERE id = NEW.id
  ) INTO profile_exists;

  IF profile_exists THEN
    RAISE LOG 'User profile already exists for: % (ID: %)', email_value, NEW.id;
    RETURN NEW;
  END IF;

  -- Attempt to create profile with UPSERT pattern
  BEGIN
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
      email_value,
      'user',
      true,
      'church',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = NOW();

    RAISE LOG 'Successfully created user profile for: % (ID: %)', email_value, NEW.id;

  EXCEPTION
    WHEN unique_violation THEN
      RAISE LOG 'Profile already exists (unique violation) for: %', email_value;
      -- This is OK, profile exists

    WHEN foreign_key_violation THEN
      error_detail := SQLERRM;
      RAISE WARNING 'Foreign key violation creating profile for %: %', email_value, error_detail;

      -- Create admin alert
      PERFORM log_profile_creation_failure(
        NEW.id,
        email_value,
        'Foreign key violation: ' || error_detail,
        'FOREIGN_KEY_VIOLATION',
        0,
        'Trigger: handle_new_user - ' || SQLSTATE || ': ' || SQLERRM
      );

    WHEN check_violation THEN
      error_detail := SQLERRM;
      RAISE WARNING 'Check constraint violation creating profile for %: %', email_value, error_detail;

      -- Create admin alert
      PERFORM log_profile_creation_failure(
        NEW.id,
        email_value,
        'Check constraint violation: ' || error_detail,
        'CHECK_VIOLATION',
        0,
        'Trigger: handle_new_user - ' || SQLSTATE || ': ' || SQLERRM
      );

    WHEN OTHERS THEN
      error_detail := SQLERRM;
      RAISE WARNING 'Unexpected error creating profile for %: % (SQLSTATE: %)', email_value, error_detail, SQLSTATE;

      -- Create admin alert
      PERFORM log_profile_creation_failure(
        NEW.id,
        email_value,
        'Unexpected error: ' || error_detail,
        'TRIGGER_ERROR_' || SQLSTATE,
        0,
        'Trigger: handle_new_user - ' || SQLSTATE || ': ' || SQLERRM
      );
  END;

  -- Always return NEW to allow auth user creation
  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Catch any error in the outer block
    RAISE LOG 'Critical error in handle_new_user for %: % %', NEW.email, SQLSTATE, SQLERRM;

    -- Try to create admin alert (may fail if admin_alerts table issues)
    BEGIN
      PERFORM log_profile_creation_failure(
        NEW.id,
        COALESCE(NEW.email, 'unknown'),
        'Critical trigger failure: ' || SQLERRM,
        'CRITICAL_TRIGGER_FAILURE',
        0,
        'Outer exception handler - ' || SQLSTATE || ': ' || SQLERRM
      );
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Failed to create admin alert: % %', SQLSTATE, SQLERRM;
    END;

    -- Don't fail the user creation even if profile creation fails
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Ensure table permissions are correct
GRANT ALL ON public.user_profiles TO service_role;
GRANT INSERT, SELECT ON public.user_profiles TO authenticated;

COMMENT ON FUNCTION public.handle_new_user IS 'Enhanced trigger function that creates user profile with comprehensive error logging and admin alerts';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Automatically creates user profile when new auth user is created';
