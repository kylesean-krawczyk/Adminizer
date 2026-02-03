/*
  # Add Visual Customization Fields to Department Assignments

  1. Schema Changes
    - Add `icon_name`, `emoji`, `color_theme`, and `display_name` columns to department_section_assignments
    - These fields allow storing visual customization directly with the department assignment

  2. Migration Notes
    - Uses ALTER TABLE IF EXISTS for safety
    - All new columns are nullable to maintain backwards compatibility
    - icon_name stores Lucide icon names
    - emoji stores emoji characters for visual identification
    - color_theme stores color scheme preferences
    - display_name stores the default department name from vertical config
*/

-- Add visual customization fields
DO $$
BEGIN
  -- Add icon_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'department_section_assignments' AND column_name = 'icon_name'
  ) THEN
    ALTER TABLE department_section_assignments ADD COLUMN icon_name TEXT;
  END IF;

  -- Add emoji column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'department_section_assignments' AND column_name = 'emoji'
  ) THEN
    ALTER TABLE department_section_assignments ADD COLUMN emoji TEXT;
  END IF;

  -- Add color_theme column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'department_section_assignments' AND column_name = 'color_theme'
  ) THEN
    ALTER TABLE department_section_assignments ADD COLUMN color_theme TEXT;
  END IF;

  -- Add display_name column if it doesn't exist (default department name from vertical config)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'department_section_assignments' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE department_section_assignments ADD COLUMN display_name TEXT;
  END IF;
END $$;

-- Add comment explaining the new fields
COMMENT ON COLUMN department_section_assignments.icon_name IS 'Lucide icon name for the department (e.g., "Users", "FileText")';
COMMENT ON COLUMN department_section_assignments.emoji IS 'Emoji character for visual identification';
COMMENT ON COLUMN department_section_assignments.color_theme IS 'Color theme for the department (e.g., "blue", "green")';
COMMENT ON COLUMN department_section_assignments.display_name IS 'Default department name from vertical configuration';
