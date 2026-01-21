/*
  # Add Vertical Configuration Support

  This migration adds vertical (church/business/estate) configuration support to the organizations table.

  ## Changes
  - Add vertical column to organizations
  - Add vertical_changed_at timestamp
  - Add vertical_change_history for audit trail
  - Add enabled_verticals array column
*/

-- Add vertical columns to organizations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'vertical'
  ) THEN
    ALTER TABLE organizations
    ADD COLUMN vertical TEXT DEFAULT 'church'
    CHECK (vertical IN ('church', 'business', 'estate'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'vertical_changed_at'
  ) THEN
    ALTER TABLE organizations
    ADD COLUMN vertical_changed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'vertical_change_history'
  ) THEN
    ALTER TABLE organizations
    ADD COLUMN vertical_change_history JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'enabled_verticals'
  ) THEN
    ALTER TABLE organizations
    ADD COLUMN enabled_verticals TEXT[] DEFAULT '{church,business,estate}';
  END IF;
END $$;

-- Update existing organizations
UPDATE organizations
SET vertical = 'church', enabled_verticals = '{church,business,estate}'
WHERE vertical IS NULL OR enabled_verticals IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organizations_vertical ON organizations(vertical);
CREATE INDEX IF NOT EXISTS idx_organizations_enabled_verticals ON organizations USING GIN (enabled_verticals);
