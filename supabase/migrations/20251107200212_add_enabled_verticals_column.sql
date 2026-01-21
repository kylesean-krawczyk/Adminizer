/*
  # Add enabled_verticals Column to Organizations Table

  ## Summary
  This migration adds the missing `enabled_verticals` column to the organizations table.
  The column stores an array of vertical types that are enabled for each organization.

  ## Changes
  1. New Column
    - `enabled_verticals` (text array) - List of enabled vertical types for the organization
    - Default value: ['church', 'business', 'estate']
    - Allows organizations to enable/disable specific verticals

  ## Notes
  - This column is referenced by the application code in useVerticalSwitcher hook
  - The missing column was causing "Database error querying schema" during login
  - Uses conditional logic to prevent errors if column already exists
*/

-- Add enabled_verticals column to organizations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'enabled_verticals'
  ) THEN
    ALTER TABLE organizations
    ADD COLUMN enabled_verticals TEXT[] DEFAULT '{church,business,estate}';

    RAISE LOG 'Added enabled_verticals column to organizations table';
  ELSE
    RAISE LOG 'Column enabled_verticals already exists in organizations table';
  END IF;
END $$;

-- Update existing organizations to have the default enabled verticals
UPDATE organizations
SET enabled_verticals = '{church,business,estate}'
WHERE enabled_verticals IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_organizations_enabled_verticals
ON organizations USING GIN (enabled_verticals);