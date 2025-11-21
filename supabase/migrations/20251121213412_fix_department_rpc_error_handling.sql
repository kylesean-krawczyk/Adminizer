/*
  # Fix Department RPC Functions - Add Error Handling and Logging

  ## Problem
  The RPC functions don't have proper error handling, making it difficult to diagnose
  why writes might be failing (e.g., RLS policies, constraint violations, etc.)

  ## Solution
  Add comprehensive error handling with detailed error messages that help identify:
  - RLS policy violations
  - Constraint violations
  - Missing required fields
  - Other database errors

  ## Changes
  1. Add EXCEPTION block to catch and return errors
  2. Add detailed logging of affected rows
  3. Return error details in a structured format
*/

-- Drop and recreate with better error handling
DROP FUNCTION IF EXISTS move_department_to_section(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION move_department_to_section(
  p_organization_id UUID,
  p_vertical_id TEXT,
  p_department_id TEXT,
  p_from_section_id TEXT,
  p_to_section_id TEXT,
  p_target_position INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_affected_rows INTEGER := 0;
  v_user_id UUID;
BEGIN
  -- Get current user ID (may be null in some contexts)
  v_user_id := auth.uid();
  
  -- Log the operation attempt
  RAISE NOTICE 'move_department_to_section: org=%, vertical=%, dept=%, from=%, to=%, pos=%',
    p_organization_id, p_vertical_id, p_department_id, p_from_section_id, p_to_section_id, p_target_position;

  -- Validate inputs
  IF p_organization_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'organization_id cannot be null',
      'affected_rows', 0
    );
  END IF;

  IF p_department_id IS NULL OR p_department_id = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'department_id cannot be null or empty',
      'affected_rows', 0
    );
  END IF;

  -- Use INSERT with ON CONFLICT to handle both new and existing rows
  INSERT INTO public.department_section_assignments (
    organization_id,
    vertical_id,
    department_id,
    department_key,
    section_id,
    display_order,
    is_visible,
    created_at,
    updated_at,
    created_by,
    updated_by
  )
  VALUES (
    p_organization_id,
    p_vertical_id,
    p_department_id,
    p_department_id,
    p_to_section_id,
    p_target_position,
    true,
    now(),
    now(),
    v_user_id,
    v_user_id
  )
  ON CONFLICT (organization_id, vertical_id, department_id)
  DO UPDATE SET
    section_id = EXCLUDED.section_id,
    display_order = EXCLUDED.display_order,
    updated_at = now(),
    updated_by = v_user_id;

  -- Get number of affected rows
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  
  RAISE NOTICE 'move_department_to_section: affected_rows=%', v_affected_rows;

  -- Return success result with affected row count
  RETURN jsonb_build_object(
    'success', true,
    'department_id', p_department_id,
    'from_section', p_from_section_id,
    'to_section', p_to_section_id,
    'position', p_target_position,
    'affected_rows', v_affected_rows,
    'operation', CASE WHEN v_affected_rows > 0 THEN 'upserted' ELSE 'no_change' END,
    'user_id', v_user_id
  );

EXCEPTION 
  WHEN foreign_key_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Foreign key violation - organization may not exist',
      'error_code', SQLSTATE,
      'error_detail', SQLERRM,
      'affected_rows', 0
    );
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unique constraint violation',
      'error_code', SQLSTATE,
      'error_detail', SQLERRM,
      'affected_rows', 0
    );
  WHEN check_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Check constraint violation - invalid section_id or vertical_id',
      'error_code', SQLSTATE,
      'error_detail', SQLERRM,
      'affected_rows', 0
    );
  WHEN insufficient_privilege THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient privileges - RLS policy may be blocking this operation',
      'error_code', SQLSTATE,
      'error_detail', SQLERRM,
      'affected_rows', 0,
      'hint', 'Check if user has master_admin role and is_active = true'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE,
      'affected_rows', 0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION move_department_to_section TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION move_department_to_section IS
  'Moves a department to a different section using UPSERT logic with comprehensive error handling. 
   Returns detailed error information if the operation fails due to RLS, constraints, or other issues.
   SECURITY DEFINER allows bypassing RLS when called, but still respects table-level permissions.';
