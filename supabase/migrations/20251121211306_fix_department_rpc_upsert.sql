/*
  # Fix Department RPC Functions to Use UPSERT

  ## Problem
  The existing RPC functions use UPDATE only, which fails silently when the table is empty.
  When dragging a department for the first time, no rows exist to update, so the operation
  returns success but doesn't actually persist any data.

  ## Solution
  Replace UPDATE-only logic with INSERT...ON CONFLICT (UPSERT) pattern to handle both:
  - Creating new assignments when table is empty
  - Updating existing assignments when they already exist

  ## Changes
  1. Drop and recreate `move_department_to_section` with UPSERT logic
  2. Drop and recreate `bulk_update_department_order` with UPSERT logic
  3. Add row count tracking to verify operations succeeded
  4. Return affected row counts in response
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS move_department_to_section(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS bulk_update_department_order(UUID, TEXT, TEXT, JSONB);

-- Recreate move_department_to_section with UPSERT logic
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
  -- Get current user ID
  v_user_id := auth.uid();

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

  -- Return result with affected row count
  RETURN jsonb_build_object(
    'success', true,
    'department_id', p_department_id,
    'from_section', p_from_section_id,
    'to_section', p_to_section_id,
    'position', p_target_position,
    'affected_rows', v_affected_rows,
    'operation', CASE WHEN v_affected_rows > 0 THEN 'updated' ELSE 'no_change' END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate bulk_update_department_order with UPSERT logic
CREATE OR REPLACE FUNCTION bulk_update_department_order(
  p_organization_id UUID,
  p_vertical_id TEXT,
  p_section_id TEXT,
  p_updates JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_update JSONB;
  v_result JSONB := '[]'::jsonb;
  v_total_affected INTEGER := 0;
  v_current_affected INTEGER;
  v_user_id UUID;
  v_dept_id TEXT;
  v_display_order INTEGER;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();

  -- Process each update
  FOR v_update IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    v_dept_id := v_update->>'department_id';
    v_display_order := (v_update->>'display_order')::INTEGER;

    -- Use INSERT with ON CONFLICT (UPSERT)
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
      v_dept_id,
      v_dept_id,
      p_section_id,
      v_display_order,
      true,
      now(),
      now(),
      v_user_id,
      v_user_id
    )
    ON CONFLICT (organization_id, vertical_id, department_id)
    DO UPDATE SET
      display_order = EXCLUDED.display_order,
      updated_at = now(),
      updated_by = v_user_id
    RETURNING to_jsonb(department_section_assignments.*) INTO v_update;

    -- Get affected row count for this operation
    GET DIAGNOSTICS v_current_affected = ROW_COUNT;
    v_total_affected := v_total_affected + v_current_affected;

    -- Add to result array
    v_result := v_result || v_update;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'updated_count', jsonb_array_length(v_result),
    'affected_rows', v_total_affected,
    'updated_rows', v_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION move_department_to_section TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_department_order TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION move_department_to_section IS
  'Moves a department to a different section using UPSERT logic. Creates new assignment if none exists.';

COMMENT ON FUNCTION bulk_update_department_order IS
  'Bulk updates department display order within a section using UPSERT logic. Creates new assignments if none exist.';
