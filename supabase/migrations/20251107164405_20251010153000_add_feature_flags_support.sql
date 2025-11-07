/*
  # Add Feature Flags Support

  1. Schema Changes
    - Add `feature_flags` JSONB column to `organizations` table for storing feature overrides
    - Create `feature_flag_audit_log` table for tracking feature flag changes
    - Add indexes for efficient querying

  2. Security
    - Enable RLS on `feature_flag_audit_log` table
    - Add policies for admins to view audit logs
    - Add policies for master admins to modify feature flags

  3. Notes
    - Feature flags are stored as key-value pairs in JSONB format
    - Audit log tracks all changes with user information and timestamps
    - Only master admins can modify feature flags
    - All users can view audit logs for their organization
*/

-- Add feature_flags column to organizations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'feature_flags'
  ) THEN
    ALTER TABLE organizations ADD COLUMN feature_flags JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create feature_flag_audit_log table
CREATE TABLE IF NOT EXISTS feature_flag_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feature_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('enabled', 'disabled', 'override_added', 'override_removed')),
  changed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_value boolean NOT NULL DEFAULT false,
  new_value boolean NOT NULL DEFAULT false,
  timestamp timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_feature_flags_audit_org_id
  ON feature_flag_audit_log(organization_id);

CREATE INDEX IF NOT EXISTS idx_feature_flags_audit_timestamp
  ON feature_flag_audit_log(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_feature_flags_audit_feature_id
  ON feature_flag_audit_log(feature_id);

CREATE INDEX IF NOT EXISTS idx_organizations_feature_flags
  ON organizations USING gin(feature_flags);

-- Enable RLS on feature_flag_audit_log
ALTER TABLE feature_flag_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view audit logs for their organization
CREATE POLICY "Users can view org feature flag audit logs"
  ON feature_flag_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.organization_id = feature_flag_audit_log.organization_id
    )
  );

-- Policy: Master admins can insert audit logs
CREATE POLICY "Master admins can insert audit logs"
  ON feature_flag_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.organization_id = feature_flag_audit_log.organization_id
      AND user_profiles.role = 'master_admin'
    )
  );

-- Add comment to feature_flags column
COMMENT ON COLUMN organizations.feature_flags IS 'JSONB object storing feature flag overrides for this organization. Keys are feature IDs, values are boolean enabled/disabled states.';

-- Add comment to audit log table
COMMENT ON TABLE feature_flag_audit_log IS 'Audit log for tracking all feature flag changes across organizations. Includes who made changes, when, and what changed.';