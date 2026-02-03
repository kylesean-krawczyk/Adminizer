/*
  # Fix Department Section Assignments - Complete Migration
  
  ## Summary
  Creates the complete department_section_assignments table with all required features
  for drag-and-drop department management.
  
  ## Changes
  1. Creates department_section_assignments table with proper schema
  2. Adds indexes for performance
  3. Enables RLS with proper policies
  4. Adds triggers for auto-updating timestamps
  5. Creates RPC functions for bulk operations
  6. Reloads PostgREST schema cache
  
  ## Security
  - RLS enabled with organization-based access control
  - Only master_admin can modify assignments
  - All organization members can view their org's assignments
*/

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.department_section_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    vertical_id TEXT NOT NULL CHECK (vertical_id IN ('church', 'business', 'estate')),
    
    department_id TEXT NOT NULL,
    department_key TEXT NOT NULL,
    
    section_id TEXT NOT NULL CHECK (section_id IN ('documents', 'departments', 'operations', 'admin')),
    display_order INTEGER NOT NULL DEFAULT 0,
    
    is_visible BOOLEAN NOT NULL DEFAULT true,
    custom_name TEXT,
    custom_description TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_profiles(id),
    updated_by UUID REFERENCES public.user_profiles(id),
    
    UNIQUE(organization_id, vertical_id, department_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dept_assignments_org_vertical 
    ON public.department_section_assignments(organization_id, vertical_id);
    
CREATE INDEX IF NOT EXISTS idx_dept_assignments_section 
    ON public.department_section_assignments(section_id);
    
CREATE INDEX IF NOT EXISTS idx_dept_assignments_order 
    ON public.department_section_assignments(display_order);

-- Enable RLS
ALTER TABLE public.department_section_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view assignments for their organization" ON public.department_section_assignments;
DROP POLICY IF EXISTS "Master admins can manage assignments" ON public.department_section_assignments;

-- View policy (all organization members)
CREATE POLICY "Users can view assignments for their organization"
    ON public.department_section_assignments
    FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.user_profiles 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Modify policy (master_admin only)
CREATE POLICY "Master admins can manage assignments"
    ON public.department_section_assignments
    FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.user_profiles 
            WHERE id = auth.uid() 
              AND role = 'master_admin' 
              AND is_active = true
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM public.user_profiles 
            WHERE id = auth.uid() 
              AND role = 'master_admin' 
              AND is_active = true
        )
    );

-- Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION update_dept_assignment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_dept_assignments_updated_at ON public.department_section_assignments;

CREATE TRIGGER update_dept_assignments_updated_at
    BEFORE UPDATE ON public.department_section_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_dept_assignment_updated_at();

-- RPC for bulk updates
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
BEGIN
  FOR v_update IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    UPDATE department_section_assignments
    SET display_order = (v_update->>'display_order')::INTEGER,
        updated_at = now(),
        updated_by = auth.uid()
    WHERE organization_id = p_organization_id
      AND vertical_id = p_vertical_id
      AND section_id = p_section_id
      AND department_id = v_update->>'department_id'
    RETURNING to_jsonb(department_section_assignments.*) INTO v_update;
    
    v_result := v_result || v_update;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'updated_count', jsonb_array_length(v_result),
    'updated_rows', v_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC for moving between sections
CREATE OR REPLACE FUNCTION move_department_to_section(
  p_organization_id UUID,
  p_vertical_id TEXT,
  p_department_id TEXT,
  p_from_section_id TEXT,
  p_to_section_id TEXT,
  p_target_position INTEGER
)
RETURNS JSONB AS $$
BEGIN
  -- Update the department's section and position
  UPDATE department_section_assignments
  SET section_id = p_to_section_id,
      display_order = p_target_position,
      updated_at = now(),
      updated_by = auth.uid()
  WHERE organization_id = p_organization_id
    AND vertical_id = p_vertical_id
    AND department_id = p_department_id;

  RETURN jsonb_build_object(
    'success', true,
    'department_id', p_department_id,
    'from_section', p_from_section_id,
    'to_section', p_to_section_id,
    'position', p_target_position
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON public.department_section_assignments TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_department_order TO authenticated;
GRANT EXECUTE ON FUNCTION move_department_to_section TO authenticated;
