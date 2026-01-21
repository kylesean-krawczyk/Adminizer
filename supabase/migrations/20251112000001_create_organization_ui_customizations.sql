/*
  # Create Organization UI Customizations System

  ## Summary
  Creates tables and functions for per-vertical organization UI customizations allowing
  master admins to customize dashboard, navigation, branding, and departments independently
  for each vertical (church, business, estate).

  ## New Tables
  1. `organization_ui_customizations`
    - Stores customization configurations per organization and vertical
    - UNIQUE constraint on (organization_id, vertical_id)
    - Columns for dashboard, navigation, branding, stats, department configs
    - Logo metadata: url, format, size, upload timestamp

  2. `organization_customization_history`
    - Tracks version history of all customization changes
    - Supports milestone flagging for important versions
    - Includes change notes and user attribution

  ## Security
  - RLS enabled on both tables
  - master_admin can INSERT/UPDATE/DELETE
  - Organization members can SELECT (read-only)
  - Service role has full access

  ## Notes
  - Each vertical maintains independent customization state
  - Customizations override vertical defaults when present
  - History retention: last 20 changes, last 90 days, milestones indefinitely
*/

-- Create organization_ui_customizations table
CREATE TABLE IF NOT EXISTS organization_ui_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vertical_id TEXT NOT NULL CHECK (vertical_id IN ('church', 'business', 'estate')),

  -- Configuration JSON fields
  dashboard_config JSONB DEFAULT '{}'::jsonb,
  navigation_config JSONB DEFAULT '{}'::jsonb,
  branding_config JSONB DEFAULT '{}'::jsonb,
  stats_config JSONB DEFAULT '{}'::jsonb,
  department_config JSONB DEFAULT '{}'::jsonb,

  -- Logo metadata
  logo_url TEXT,
  logo_format TEXT CHECK (logo_format IN ('image/svg+xml', 'image/png', 'image/jpeg')),
  logo_file_size INTEGER,
  logo_uploaded_at TIMESTAMPTZ,

  -- Version and tracking
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES user_profiles(id),
  updated_by UUID REFERENCES user_profiles(id),

  -- Ensure one config per organization per vertical
  CONSTRAINT unique_org_vertical UNIQUE (organization_id, vertical_id)
);

-- Create organization_customization_history table
CREATE TABLE IF NOT EXISTS organization_customization_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customization_id UUID REFERENCES organization_ui_customizations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vertical_id TEXT NOT NULL CHECK (vertical_id IN ('church', 'business', 'estate')),

  -- Snapshot of configuration at this version
  config_snapshot JSONB NOT NULL,

  -- Change tracking
  changed_by UUID REFERENCES user_profiles(id),
  change_description TEXT,
  change_note TEXT,

  -- Milestone tracking
  is_milestone BOOLEAN DEFAULT false,
  milestone_name TEXT,

  -- Version number
  version_number INTEGER NOT NULL,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Index for efficient queries
  CONSTRAINT valid_milestone CHECK (
    (is_milestone = false) OR
    (is_milestone = true AND milestone_name IS NOT NULL)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_custom_org_vertical
  ON organization_ui_customizations(organization_id, vertical_id);

CREATE INDEX IF NOT EXISTS idx_org_custom_organization
  ON organization_ui_customizations(organization_id);

CREATE INDEX IF NOT EXISTS idx_custom_history_org_vertical
  ON organization_customization_history(organization_id, vertical_id);

CREATE INDEX IF NOT EXISTS idx_custom_history_customization
  ON organization_customization_history(customization_id);

CREATE INDEX IF NOT EXISTS idx_history_milestone
  ON organization_customization_history(is_milestone) WHERE is_milestone = true;

CREATE INDEX IF NOT EXISTS idx_history_created_at
  ON organization_customization_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE organization_ui_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_customization_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_ui_customizations

-- Master admins can do everything
CREATE POLICY "Master admins can manage organization customizations"
  ON organization_ui_customizations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = organization_ui_customizations.organization_id
        AND user_profiles.role = 'master_admin'
        AND user_profiles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = organization_ui_customizations.organization_id
        AND user_profiles.role = 'master_admin'
        AND user_profiles.is_active = true
    )
  );

-- Organization members can view customizations
CREATE POLICY "Organization members can view customizations"
  ON organization_ui_customizations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = organization_ui_customizations.organization_id
        AND user_profiles.is_active = true
    )
  );

-- RLS Policies for organization_customization_history

-- Master admins can manage history
CREATE POLICY "Master admins can manage customization history"
  ON organization_customization_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = organization_customization_history.organization_id
        AND user_profiles.role = 'master_admin'
        AND user_profiles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = organization_customization_history.organization_id
        AND user_profiles.role = 'master_admin'
        AND user_profiles.is_active = true
    )
  );

-- Organization members can view history
CREATE POLICY "Organization members can view customization history"
  ON organization_customization_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = organization_customization_history.organization_id
        AND user_profiles.is_active = true
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organization_customization_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS update_org_customization_timestamp ON organization_ui_customizations;
CREATE TRIGGER update_org_customization_timestamp
  BEFORE UPDATE ON organization_ui_customizations
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_customization_timestamp();

-- Grant permissions
GRANT ALL ON organization_ui_customizations TO authenticated;
GRANT ALL ON organization_customization_history TO authenticated;
GRANT ALL ON organization_ui_customizations TO service_role;
GRANT ALL ON organization_customization_history TO service_role;
