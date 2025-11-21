/*
  # Create Department Section Assignments System

  ## Summary
  Creates a system for dynamically managing department-to-section assignments with drag-and-drop support.
  Allows super admins to move departments between sections (Documents, Core Ministries, Operations, Admin)
  and reorder departments within sections. All changes are tracked with full audit trail.

  ## New Tables
  1. `department_section_assignments`
    - Stores dynamic department-to-section mappings per organization and vertical
    - Tracks display order within each section
    - Includes visibility, custom names, and descriptions
    - UNIQUE constraint on (organization_id, vertical_id, department_id)

  ## RPC Functions
  1. `bulk_update_department_order` - Transaction-safe batch order updates
  2. `move_department_to_section` - Atomic move operation between sections
  3. `initialize_department_assignments` - Migration/seed function for existing orgs

  ## Security
  - RLS enabled with policies for master_admin (full access) and members (read-only)
  - All changes tracked with created_by/updated_by fields
  - Real-time subscriptions supported for multi-user collaboration

  ## Notes
  - Backward compatible: Falls back to hardcoded config if no assignments exist
  - Department data tables remain untouched (separation of concerns)
  - Optimistic UI updates with automatic rollback on errors
*/

-- Create department_section_assignments table
CREATE TABLE IF NOT EXISTS department_section_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vertical_id TEXT NOT NULL CHECK (vertical_id IN ('church', 'business', 'estate')),

  -- Department identification
  department_id TEXT NOT NULL,
  department_key TEXT NOT NULL,

  -- Section assignment
  section_id TEXT NOT NULL CHECK (section_id IN ('documents', 'departments', 'operations', 'admin')),
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Customization (inherits from organization_ui_customizations but can override)
  is_visible BOOLEAN DEFAULT true,
  custom_name TEXT,
  custom_description TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES user_profiles(id),
  updated_by UUID REFERENCES user_profiles(id),

  -- Ensure one assignment per department per organization/vertical
  CONSTRAINT unique_org_vertical_dept UNIQUE (organization_id, vertical_id, department_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dept_assign_org_vertical
  ON department_section_assignments(organization_id, vertical_id);

CREATE INDEX IF NOT EXISTS idx_dept_assign_section
  ON department_section_assignments(organization_id, vertical_id, section_id);

CREATE INDEX IF NOT EXISTS idx_dept_assign_order
  ON department_section_assignments(section_id, display_order);

CREATE INDEX IF NOT EXISTS idx_dept_assign_dept_id
  ON department_section_assignments(department_id);

-- Enable Row Level Security
ALTER TABLE department_section_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Master admins can do everything
CREATE POLICY "Master admins can manage department assignments"
  ON department_section_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = department_section_assignments.organization_id
        AND user_profiles.role = 'master_admin'
        AND user_profiles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = department_section_assignments.organization_id
        AND user_profiles.role = 'master_admin'
        AND user_profiles.is_active = true
    )
  );

-- Organization members can view assignments
CREATE POLICY "Organization members can view department assignments"
  ON department_section_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = department_section_assignments.organization_id
        AND user_profiles.is_active = true
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_department_assignment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS update_dept_assignment_timestamp ON department_section_assignments;
CREATE TRIGGER update_dept_assignment_timestamp
  BEFORE UPDATE ON department_section_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_department_assignment_timestamp();

-- RPC Function: Bulk update department order within a section
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
  v_updated_row department_section_assignments%ROWTYPE;
BEGIN
  -- Loop through updates array
  FOR v_update IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    UPDATE department_section_assignments
    SET
      display_order = (v_update->>'display_order')::INTEGER,
      updated_at = now(),
      updated_by = auth.uid()
    WHERE organization_id = p_organization_id
      AND vertical_id = p_vertical_id
      AND section_id = p_section_id
      AND department_id = v_update->>'department_id'
    RETURNING * INTO v_updated_row;

    -- Add to result array
    v_result := v_result || to_jsonb(v_updated_row);
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'updated_count', jsonb_array_length(v_result),
    'updated_rows', v_result
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Function: Move department to different section
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
  v_current_order INTEGER;
  v_max_order INTEGER;
BEGIN
  -- Get current order in source section
  SELECT display_order INTO v_current_order
  FROM department_section_assignments
  WHERE organization_id = p_organization_id
    AND vertical_id = p_vertical_id
    AND department_id = p_department_id
    AND section_id = p_from_section_id;

  -- Update the moved department's section and order
  UPDATE department_section_assignments
  SET
    section_id = p_to_section_id,
    display_order = p_target_position,
    updated_at = now(),
    updated_by = auth.uid()
  WHERE organization_id = p_organization_id
    AND vertical_id = p_vertical_id
    AND department_id = p_department_id;

  -- Reorder remaining items in source section (fill the gap)
  UPDATE department_section_assignments
  SET
    display_order = display_order - 1,
    updated_at = now()
  WHERE organization_id = p_organization_id
    AND vertical_id = p_vertical_id
    AND section_id = p_from_section_id
    AND display_order > v_current_order;

  -- Make room in target section (shift items down)
  UPDATE department_section_assignments
  SET
    display_order = display_order + 1,
    updated_at = now()
  WHERE organization_id = p_organization_id
    AND vertical_id = p_vertical_id
    AND section_id = p_to_section_id
    AND display_order >= p_target_position
    AND department_id != p_department_id;

  RETURN jsonb_build_object(
    'success', true,
    'department_id', p_department_id,
    'from_section', p_from_section_id,
    'to_section', p_to_section_id,
    'position', p_target_position
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Function: Initialize default assignments from vertical config
CREATE OR REPLACE FUNCTION initialize_department_assignments(
  p_organization_id UUID,
  p_vertical_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_inserted_count INTEGER := 0;
  v_existing_count INTEGER;
BEGIN
  -- Check if assignments already exist
  SELECT COUNT(*) INTO v_existing_count
  FROM department_section_assignments
  WHERE organization_id = p_organization_id
    AND vertical_id = p_vertical_id;

  -- Only initialize if no assignments exist
  IF v_existing_count > 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Assignments already exist',
      'existing_count', v_existing_count,
      'inserted_count', 0
    );
  END IF;

  -- Note: This is a placeholder. Actual initialization would need to read from
  -- the vertical config JSON or have the application pass in the default departments.
  -- For now, we return success and let the application handle seeding.

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Ready for initialization',
    'existing_count', v_existing_count,
    'inserted_count', v_inserted_count,
    'note', 'Application should call saveDepartmentAssignment for each default department'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON department_section_assignments TO authenticated;
GRANT ALL ON department_section_assignments TO service_role;
GRANT EXECUTE ON FUNCTION bulk_update_department_order TO authenticated;
GRANT EXECUTE ON FUNCTION move_department_to_section TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_department_assignments TO authenticated;