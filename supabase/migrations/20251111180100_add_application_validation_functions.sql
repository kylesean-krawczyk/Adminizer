/*
  # Application-Level Validation Functions

  1. Purpose
    - Provide validation functions for application code to call before database operations
    - Prevent foreign key errors by validating references before inserts
    - Return user-friendly error messages for the UI
    - Enable dropdown filtering for valid options

  2. Validation Functions
    - validate_organization_exists: Check if organization exists
    - validate_user_profile_complete: Ensure user profile is ready for operations
    - validate_tool_access_prerequisites: Check all requirements for tool access
    - get_valid_organizations_for_user: Get list of valid organizations
    - check_can_create_record: Validate all foreign keys before insert

  3. Returns
    - All functions return JSONB with success/error information
    - Consistent error format for UI integration
*/

-- ============================================================================
-- SECTION 1: ORGANIZATION VALIDATION
-- ============================================================================

-- 1.1: Check if organization exists and user has access
CREATE OR REPLACE FUNCTION validate_organization_exists(
  p_organization_id uuid,
  p_check_user_access boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_exists boolean;
  v_user_has_access boolean := false;
  v_org_name text;
BEGIN
  -- Check if organization exists
  SELECT EXISTS(
    SELECT 1 FROM organizations WHERE id = p_organization_id
  ) INTO v_org_exists;

  IF NOT v_org_exists THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Organization does not exist',
      'error_code', 'ORG_NOT_FOUND',
      'organization_id', p_organization_id
    );
  END IF;

  -- Get organization name
  SELECT name INTO v_org_name
  FROM organizations
  WHERE id = p_organization_id;

  -- Check user access if requested
  IF p_check_user_access THEN
    SELECT EXISTS(
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND organization_id = p_organization_id
        AND is_active = true
    ) INTO v_user_has_access;

    IF NOT v_user_has_access THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'You do not have access to this organization',
        'error_code', 'ACCESS_DENIED',
        'organization_id', p_organization_id,
        'organization_name', v_org_name
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'organization_id', p_organization_id,
    'organization_name', v_org_name
  );
END;
$$;


-- 1.2: Get list of valid organizations for current user
CREATE OR REPLACE FUNCTION get_valid_organizations_for_user()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_organizations jsonb;
BEGIN
  -- Get user's organization
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', o.id,
      'name', o.name,
      'created_at', o.created_at,
      'is_current', o.id = up.organization_id
    )
  )
  INTO v_organizations
  FROM organizations o
  LEFT JOIN user_profiles up ON up.organization_id = o.id AND up.id = auth.uid()
  WHERE o.id IN (
    SELECT organization_id
    FROM user_profiles
    WHERE id = auth.uid()
  );

  RETURN jsonb_build_object(
    'success', true,
    'organizations', COALESCE(v_organizations, '[]'::jsonb),
    'count', jsonb_array_length(COALESCE(v_organizations, '[]'::jsonb))
  );
END;
$$;


-- ============================================================================
-- SECTION 2: USER PROFILE VALIDATION
-- ============================================================================

-- 2.1: Check if user profile is complete and ready for operations
CREATE OR REPLACE FUNCTION validate_user_profile_complete(
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_profile_exists boolean;
  v_has_organization boolean;
  v_is_active boolean;
  v_missing_fields text[] := ARRAY[]::text[];
  v_profile_data jsonb;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'User not authenticated',
      'error_code', 'NOT_AUTHENTICATED'
    );
  END IF;

  -- Check if profile exists
  SELECT EXISTS(
    SELECT 1 FROM user_profiles WHERE id = v_user_id
  ) INTO v_profile_exists;

  IF NOT v_profile_exists THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'User profile does not exist',
      'error_code', 'PROFILE_NOT_FOUND',
      'user_id', v_user_id,
      'action_required', 'create_profile'
    );
  END IF;

  -- Get profile data
  SELECT
    organization_id IS NOT NULL,
    is_active,
    jsonb_build_object(
      'id', id,
      'email', email,
      'role', role,
      'organization_id', organization_id,
      'is_active', is_active,
      'active_vertical', active_vertical
    )
  INTO v_has_organization, v_is_active, v_profile_data
  FROM user_profiles
  WHERE id = v_user_id;

  -- Check for missing required fields
  IF NOT v_has_organization THEN
    v_missing_fields := array_append(v_missing_fields, 'organization_id');
  END IF;

  IF NOT v_is_active THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'User profile is inactive',
      'error_code', 'PROFILE_INACTIVE',
      'profile', v_profile_data,
      'action_required', 'contact_admin'
    );
  END IF;

  -- Validate organization still exists
  IF v_has_organization THEN
    IF NOT EXISTS(
      SELECT 1 FROM organizations
      WHERE id = (v_profile_data->>'organization_id')::uuid
    ) THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'User organization no longer exists',
        'error_code', 'ORG_ORPHANED',
        'profile', v_profile_data,
        'action_required', 'reassign_organization'
      );
    END IF;
  END IF;

  IF array_length(v_missing_fields, 1) > 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'User profile is incomplete',
      'error_code', 'PROFILE_INCOMPLETE',
      'missing_fields', v_missing_fields,
      'profile', v_profile_data,
      'action_required', 'complete_profile'
    );
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'profile', v_profile_data
  );
END;
$$;


-- ============================================================================
-- SECTION 3: TOOL ACCESS VALIDATION
-- ============================================================================

-- 3.1: Validate prerequisites for tool access request
CREATE OR REPLACE FUNCTION validate_tool_access_prerequisites(
  p_tool_id uuid,
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_tool_exists boolean;
  v_tool_name text;
  v_user_valid jsonb;
  v_existing_access boolean;
  v_pending_request boolean;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());

  -- Validate user profile first
  v_user_valid := validate_user_profile_complete(v_user_id);

  IF NOT (v_user_valid->>'valid')::boolean THEN
    RETURN v_user_valid;
  END IF;

  -- Check if tool exists
  SELECT EXISTS(
    SELECT 1 FROM ai_tool_registry WHERE id = p_tool_id
  ), name
  INTO v_tool_exists, v_tool_name
  FROM ai_tool_registry
  WHERE id = p_tool_id;

  IF NOT v_tool_exists THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Tool does not exist in registry',
      'error_code', 'TOOL_NOT_FOUND',
      'tool_id', p_tool_id
    );
  END IF;

  -- Check if user already has access
  SELECT EXISTS(
    SELECT 1 FROM ai_tool_permissions
    WHERE user_id = v_user_id
      AND tool_id = p_tool_id
      AND granted = true
      AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO v_existing_access;

  IF v_existing_access THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'User already has access to this tool',
      'error_code', 'ACCESS_EXISTS',
      'tool_id', p_tool_id,
      'tool_name', v_tool_name
    );
  END IF;

  -- Check for pending request
  SELECT EXISTS(
    SELECT 1 FROM ai_tool_access_requests
    WHERE user_id = v_user_id
      AND tool_id = p_tool_id
      AND status = 'pending'
  ) INTO v_pending_request;

  IF v_pending_request THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'A request for this tool is already pending',
      'error_code', 'REQUEST_PENDING',
      'tool_id', p_tool_id,
      'tool_name', v_tool_name
    );
  END IF;

  -- All checks passed
  RETURN jsonb_build_object(
    'valid', true,
    'tool_id', p_tool_id,
    'tool_name', v_tool_name,
    'user_id', v_user_id
  );
END;
$$;


-- ============================================================================
-- SECTION 4: COMPREHENSIVE PRE-INSERT VALIDATION
-- ============================================================================

-- 4.1: Validate all foreign keys before creating a record
CREATE OR REPLACE FUNCTION check_can_create_record(
  p_table_name text,
  p_foreign_keys jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key text;
  v_value text;
  v_exists boolean;
  v_errors jsonb := '[]'::jsonb;
BEGIN
  -- Iterate through all foreign keys
  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_foreign_keys)
  LOOP
    -- Skip null values
    CONTINUE WHEN v_value IS NULL OR v_value = '';

    -- Check based on foreign key name
    CASE v_key
      WHEN 'organization_id' THEN
        SELECT EXISTS(SELECT 1 FROM organizations WHERE id = v_value::uuid)
        INTO v_exists;
        IF NOT v_exists THEN
          v_errors := v_errors || jsonb_build_object(
            'field', 'organization_id',
            'value', v_value,
            'error', 'Organization does not exist'
          );
        END IF;

      WHEN 'user_id' THEN
        SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = v_value::uuid)
        INTO v_exists;
        IF NOT v_exists THEN
          v_errors := v_errors || jsonb_build_object(
            'field', 'user_id',
            'value', v_value,
            'error', 'User does not exist'
          );
        END IF;

      WHEN 'tool_id' THEN
        SELECT EXISTS(SELECT 1 FROM ai_tool_registry WHERE id = v_value::uuid)
        INTO v_exists;
        IF NOT v_exists THEN
          v_errors := v_errors || jsonb_build_object(
            'field', 'tool_id',
            'value', v_value,
            'error', 'Tool does not exist in registry'
          );
        END IF;

      WHEN 'invited_by' THEN
        SELECT EXISTS(SELECT 1 FROM user_profiles WHERE id = v_value::uuid)
        INTO v_exists;
        IF NOT v_exists THEN
          v_errors := v_errors || jsonb_build_object(
            'field', 'invited_by',
            'value', v_value,
            'error', 'Inviting user does not exist'
          );
        END IF;

      ELSE
        -- Unknown foreign key, skip validation
        CONTINUE;
    END CASE;
  END LOOP;

  -- Return validation result
  IF jsonb_array_length(v_errors) > 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'table_name', p_table_name,
      'errors', v_errors,
      'error_count', jsonb_array_length(v_errors)
    );
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'table_name', p_table_name,
    'message', 'All foreign key validations passed'
  );
END;
$$;


-- ============================================================================
-- SECTION 5: BATCH VALIDATION FUNCTIONS
-- ============================================================================

-- 5.1: Validate multiple organizations at once
CREATE OR REPLACE FUNCTION validate_organizations_batch(
  p_organization_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_valid_ids uuid[];
  v_invalid_ids uuid[];
  v_id uuid;
BEGIN
  -- Check each organization
  FOREACH v_id IN ARRAY p_organization_ids
  LOOP
    IF EXISTS(SELECT 1 FROM organizations WHERE id = v_id) THEN
      v_valid_ids := array_append(v_valid_ids, v_id);
    ELSE
      v_invalid_ids := array_append(v_invalid_ids, v_id);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'valid_ids', COALESCE(v_valid_ids, ARRAY[]::uuid[]),
    'invalid_ids', COALESCE(v_invalid_ids, ARRAY[]::uuid[]),
    'valid_count', COALESCE(array_length(v_valid_ids, 1), 0),
    'invalid_count', COALESCE(array_length(v_invalid_ids, 1), 0),
    'all_valid', COALESCE(array_length(v_invalid_ids, 1), 0) = 0
  );
END;
$$;


-- ============================================================================
-- SECTION 6: VALIDATION HELPERS FOR UI
-- ============================================================================

-- 6.1: Get dropdown options for organizations
CREATE OR REPLACE FUNCTION get_organization_options()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_options jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'value', id,
      'label', name,
      'created_at', created_at
    ) ORDER BY name
  )
  INTO v_options
  FROM organizations
  WHERE id IN (
    SELECT organization_id
    FROM user_profiles
    WHERE id = auth.uid()
    UNION
    SELECT id FROM organizations WHERE true  -- Admins see all
  );

  RETURN COALESCE(v_options, '[]'::jsonb);
END;
$$;

-- 6.2: Get dropdown options for tools
CREATE OR REPLACE FUNCTION get_tool_options(
  p_include_restricted boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_options jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'value', id,
      'label', name,
      'description', description,
      'requires_permission', requires_permission,
      'category', category
    ) ORDER BY category, name
  )
  INTO v_options
  FROM ai_tool_registry
  WHERE p_include_restricted OR NOT requires_permission;

  RETURN COALESCE(v_options, '[]'::jsonb);
END;
$$;


-- ============================================================================
-- SECTION 7: GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION validate_organization_exists TO authenticated;
GRANT EXECUTE ON FUNCTION get_valid_organizations_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION validate_user_profile_complete TO authenticated;
GRANT EXECUTE ON FUNCTION validate_tool_access_prerequisites TO authenticated;
GRANT EXECUTE ON FUNCTION check_can_create_record TO authenticated;
GRANT EXECUTE ON FUNCTION validate_organizations_batch TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_options TO authenticated;
GRANT EXECUTE ON FUNCTION get_tool_options TO authenticated;


-- ============================================================================
-- SECTION 8: DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION validate_organization_exists IS 'Validates that an organization exists and optionally checks user access';
COMMENT ON FUNCTION get_valid_organizations_for_user IS 'Returns list of organizations the current user can access';
COMMENT ON FUNCTION validate_user_profile_complete IS 'Checks if user profile is complete and ready for operations';
COMMENT ON FUNCTION validate_tool_access_prerequisites IS 'Validates all prerequisites before creating a tool access request';
COMMENT ON FUNCTION check_can_create_record IS 'Validates all foreign keys before inserting a record';
COMMENT ON FUNCTION validate_organizations_batch IS 'Validates multiple organization IDs at once';
COMMENT ON FUNCTION get_organization_options IS 'Returns formatted organization options for dropdown UI';
COMMENT ON FUNCTION get_tool_options IS 'Returns formatted tool options for dropdown UI';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Application validation functions created successfully';
  RAISE NOTICE 'Use these functions before database operations to prevent foreign key errors';
END $$;
