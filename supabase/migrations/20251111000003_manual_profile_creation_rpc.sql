/*
  # Manual Profile Creation RPC Function

  1. Purpose
    - Provides fallback mechanism for profile creation when trigger fails
    - Can be called directly from application code
    - Uses SECURITY DEFINER to bypass RLS policies
    - Validates inputs before creation
    - Logs creation attempts

  2. Parameters
    - p_user_id: UUID of the user (must match auth.uid())
    - p_email: Email address (optional, defaults to auth email)
    - p_active_vertical: Preferred vertical (optional, defaults to 'church')

  3. Returns
    - JSON object with success status and profile data

  4. Security
    - Only authenticated users can call
    - Can only create profile for themselves (auth.uid())
    - Validates all inputs before insert
*/

-- Create manual profile creation function
CREATE OR REPLACE FUNCTION create_user_profile_manual(
  p_user_id uuid DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_active_vertical text DEFAULT 'church'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_profile_exists boolean;
  v_auth_email text;
  v_result jsonb;
BEGIN
  -- Get authenticated user ID
  v_user_id := COALESCE(p_user_id, auth.uid());

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authenticated',
      'error_code', 'NOT_AUTHENTICATED'
    );
  END IF;

  -- Security check: user can only create their own profile
  IF v_user_id != auth.uid() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot create profile for another user',
      'error_code', 'PERMISSION_DENIED'
    );
  END IF;

  -- Check if profile already exists
  SELECT EXISTS(
    SELECT 1 FROM user_profiles WHERE id = v_user_id
  ) INTO v_profile_exists;

  IF v_profile_exists THEN
    RAISE LOG 'Profile already exists for user %', v_user_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Profile already exists',
      'error_code', 'PROFILE_EXISTS'
    );
  END IF;

  -- Get email from auth.users if not provided
  IF p_email IS NULL OR p_email = '' THEN
    SELECT email INTO v_auth_email
    FROM auth.users
    WHERE id = v_user_id;

    v_email := COALESCE(v_auth_email, '');
  ELSE
    v_email := p_email;
  END IF;

  -- Validate vertical
  IF p_active_vertical NOT IN ('church', 'business', 'estate') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid vertical. Must be church, business, or estate',
      'error_code', 'INVALID_VERTICAL'
    );
  END IF;

  -- Create the profile
  BEGIN
    INSERT INTO user_profiles (
      id,
      email,
      role,
      is_active,
      active_vertical,
      created_at,
      updated_at
    )
    VALUES (
      v_user_id,
      v_email,
      'user',
      true,
      p_active_vertical,
      NOW(),
      NOW()
    );

    RAISE LOG 'Manually created profile for user % with email %', v_user_id, v_email;

    -- Build success response with profile data
    SELECT jsonb_build_object(
      'success', true,
      'profile', jsonb_build_object(
        'id', id,
        'email', email,
        'role', role,
        'is_active', is_active,
        'active_vertical', active_vertical,
        'organization_id', organization_id,
        'created_at', created_at
      ),
      'creation_method', 'manual'
    )
    INTO v_result
    FROM user_profiles
    WHERE id = v_user_id;

    RETURN v_result;

  EXCEPTION
    WHEN unique_violation THEN
      RAISE LOG 'Profile creation failed - already exists: %', v_user_id;
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Profile already exists',
        'error_code', 'PROFILE_EXISTS'
      );

    WHEN foreign_key_violation THEN
      RAISE LOG 'Profile creation failed - foreign key violation: %', SQLERRM;
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Database constraint violation: ' || SQLERRM,
        'error_code', 'FOREIGN_KEY_VIOLATION'
      );

    WHEN check_violation THEN
      RAISE LOG 'Profile creation failed - check violation: %', SQLERRM;
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Invalid data: ' || SQLERRM,
        'error_code', 'CHECK_VIOLATION'
      );

    WHEN OTHERS THEN
      RAISE LOG 'Profile creation failed - unexpected error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;

      -- Log to admin alerts
      PERFORM log_profile_creation_failure(
        v_user_id,
        v_email,
        'Manual profile creation failed: ' || SQLERRM,
        'MANUAL_CREATION_ERROR_' || SQLSTATE,
        1,
        'Function: create_user_profile_manual - ' || SQLSTATE || ': ' || SQLERRM
      );

      RETURN jsonb_build_object(
        'success', false,
        'error', 'Failed to create profile: ' || SQLERRM,
        'error_code', 'CREATION_FAILED',
        'sql_state', SQLSTATE
      );
  END;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_user_profile_manual TO authenticated;

-- Create function to check profile status
CREATE OR REPLACE FUNCTION check_profile_status(p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_profile_exists boolean;
  v_has_organization boolean;
  v_profile_data jsonb;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'authenticated', false,
      'profile_exists', false,
      'has_organization', false
    );
  END IF;

  -- Check if profile exists
  SELECT EXISTS(
    SELECT 1 FROM user_profiles WHERE id = v_user_id
  ) INTO v_profile_exists;

  IF NOT v_profile_exists THEN
    RETURN jsonb_build_object(
      'authenticated', true,
      'profile_exists', false,
      'has_organization', false,
      'user_id', v_user_id
    );
  END IF;

  -- Get profile data
  SELECT jsonb_build_object(
    'id', id,
    'email', email,
    'role', role,
    'is_active', is_active,
    'active_vertical', active_vertical,
    'organization_id', organization_id,
    'has_organization', organization_id IS NOT NULL,
    'created_at', created_at
  )
  INTO v_profile_data
  FROM user_profiles
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'authenticated', true,
    'profile_exists', true,
    'profile', v_profile_data
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_profile_status TO authenticated;
GRANT EXECUTE ON FUNCTION check_profile_status TO anon;

COMMENT ON FUNCTION create_user_profile_manual IS 'Manually creates a user profile as fallback when automatic trigger fails';
COMMENT ON FUNCTION check_profile_status IS 'Checks the current status of user profile and returns detailed information';
