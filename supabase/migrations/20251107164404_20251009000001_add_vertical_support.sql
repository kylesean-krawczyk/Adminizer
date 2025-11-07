/*
  # Add Vertical Configuration Support

  This migration adds vertical (church/business/estate) configuration support to the organizations table.

  ## Changes
  - Add vertical column to organizations
  - Add vertical_changed_at timestamp
  - Add vertical_change_history for audit trail
  - Create vertical_change_requests table
  - Add RLS policies
  - Create trigger for logging changes
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
END $$;

-- Create vertical_change_requests table
CREATE TABLE IF NOT EXISTS vertical_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requested_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_vertical TEXT NOT NULL CHECK (current_vertical IN ('church', 'business', 'estate')),
  requested_vertical TEXT NOT NULL CHECK (requested_vertical IN ('church', 'business', 'estate')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  reviewed_at TIMESTAMPTZ,
  reviewed_by_user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  CONSTRAINT different_verticals CHECK (current_vertical != requested_vertical)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organizations_vertical ON organizations(vertical);
CREATE INDEX IF NOT EXISTS idx_vertical_change_requests_org ON vertical_change_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_vertical_change_requests_status ON vertical_change_requests(status);

-- Enable RLS
ALTER TABLE vertical_change_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own organization vertical change requests"
  ON vertical_change_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.organization_id = vertical_change_requests.organization_id
    )
  );

CREATE POLICY "Master admins can create vertical change requests"
  ON vertical_change_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.organization_id = vertical_change_requests.organization_id
      AND user_profiles.role = 'master_admin'
    )
  );

-- Update existing organizations
UPDATE organizations
SET vertical = 'church'
WHERE vertical IS NULL;

-- Function to log vertical changes
CREATE OR REPLACE FUNCTION log_vertical_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vertical IS DISTINCT FROM OLD.vertical THEN
    NEW.vertical_changed_at = now();
    NEW.vertical_change_history = COALESCE(NEW.vertical_change_history, '[]'::jsonb) ||
      jsonb_build_object(
        'timestamp', now(),
        'old_vertical', OLD.vertical,
        'new_vertical', NEW.vertical,
        'changed_by', current_setting('request.jwt.claims', true)::jsonb->>'sub'
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_log_vertical_change ON organizations;
CREATE TRIGGER trigger_log_vertical_change
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION log_vertical_change();