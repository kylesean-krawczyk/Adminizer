/*
  # Create Department Integrations and Quick Actions System

  ## Summary
  Creates comprehensive system for department integrations and quick actions including:
  - Integration platforms with OAuth configuration
  - Quick action buttons for common tasks
  - Visual settings for department customization

  ## New Tables
  1. `department_integrations`
    - Integration platforms (Salesforce, BambooHR, etc.)
    - OAuth configuration and connection status
    - Badges, features, and external links
    - Contact management and status tracking

  2. `quick_actions`
    - Quick action buttons for department pages
    - Support for internal routes, external links, and modals
    - OAuth requirement tracking
    - Customizable button styles

  3. `department_visual_settings`
    - Centralized visual configuration per department
    - Icon, emoji, color theme, and custom CSS

  ## Security
  - RLS enabled on all tables
  - Master admins: full CRUD access
  - Organization members: read-only access
  - All data scoped by organization_id

  ## Notes
  - Integrations support OAuth configuration via JSONB
  - Quick actions can trigger routes, external links, or modals
  - Badges and features stored as text arrays for flexibility
  - Display order enables drag-and-drop reordering
*/

-- ============================================================================
-- Table 1: Department Integrations
-- ============================================================================

CREATE TABLE IF NOT EXISTS department_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vertical_id TEXT NOT NULL CHECK (vertical_id IN ('church', 'business', 'estate')),
  department_id TEXT NOT NULL,

  -- Integration Information
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 150),
  description TEXT CHECK (description IS NULL OR length(description) <= 1000),
  icon TEXT DEFAULT 'Plug',
  logo_url TEXT,

  -- Visual Elements
  badges TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',

  -- OAuth Configuration
  oauth_enabled BOOLEAN DEFAULT false,
  oauth_provider TEXT,
  oauth_config JSONB DEFAULT '{}'::jsonb,

  -- External Link
  external_link TEXT,

  -- Contact and Status
  primary_contact_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),

  -- Display Settings
  is_enabled BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES user_profiles(id),
  updated_by UUID REFERENCES user_profiles(id),

  -- Unique constraint
  CONSTRAINT unique_dept_integration_order UNIQUE (organization_id, vertical_id, department_id, display_order)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_integrations_org_vertical_dept
  ON department_integrations(organization_id, vertical_id, department_id);

CREATE INDEX IF NOT EXISTS idx_integrations_display_order
  ON department_integrations(organization_id, vertical_id, department_id, display_order);

CREATE INDEX IF NOT EXISTS idx_integrations_status
  ON department_integrations(organization_id, status);

-- ============================================================================
-- Table 2: Quick Actions
-- ============================================================================

CREATE TABLE IF NOT EXISTS quick_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vertical_id TEXT NOT NULL CHECK (vertical_id IN ('church', 'business', 'estate')),
  department_id TEXT NOT NULL,

  -- Action Details
  label TEXT NOT NULL CHECK (length(label) >= 1 AND length(label) <= 100),
  icon TEXT NOT NULL DEFAULT 'Zap',
  action_url TEXT NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'route' CHECK (action_type IN ('route', 'external', 'modal')),

  -- OAuth Configuration
  requires_oauth BOOLEAN DEFAULT false,
  related_integration_id UUID REFERENCES department_integrations(id) ON DELETE SET NULL,

  -- Display Settings
  button_style TEXT DEFAULT 'primary' CHECK (button_style IN ('primary', 'secondary', 'outline', 'ghost')),
  is_enabled BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES user_profiles(id),
  updated_by UUID REFERENCES user_profiles(id),

  -- Unique constraint
  CONSTRAINT unique_dept_quick_action_order UNIQUE (organization_id, vertical_id, department_id, display_order)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quick_actions_org_vertical_dept
  ON quick_actions(organization_id, vertical_id, department_id);

CREATE INDEX IF NOT EXISTS idx_quick_actions_display_order
  ON quick_actions(organization_id, vertical_id, department_id, display_order);

-- ============================================================================
-- Table 3: Department Visual Settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS department_visual_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vertical_id TEXT NOT NULL CHECK (vertical_id IN ('church', 'business', 'estate')),
  department_id TEXT NOT NULL,

  -- Visual Configuration
  icon TEXT DEFAULT 'FileText',
  emoji TEXT,
  color_theme TEXT DEFAULT 'blue',
  custom_css TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES user_profiles(id),
  updated_by UUID REFERENCES user_profiles(id),

  -- One settings row per department
  CONSTRAINT unique_dept_visual_settings UNIQUE (organization_id, vertical_id, department_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_visual_settings_org_vertical_dept
  ON department_visual_settings(organization_id, vertical_id, department_id);

-- ============================================================================
-- Row Level Security Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE department_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_visual_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for department_integrations
-- ============================================================================

-- Master admins can manage integrations
CREATE POLICY "Master admins can manage integrations"
  ON department_integrations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = department_integrations.organization_id
        AND user_profiles.role = 'master_admin'
        AND user_profiles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = department_integrations.organization_id
        AND user_profiles.role = 'master_admin'
        AND user_profiles.is_active = true
    )
  );

-- Organization members can view integrations
CREATE POLICY "Organization members can view integrations"
  ON department_integrations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = department_integrations.organization_id
        AND user_profiles.is_active = true
    )
  );

-- ============================================================================
-- RLS Policies for quick_actions
-- ============================================================================

-- Master admins can manage quick actions
CREATE POLICY "Master admins can manage quick actions"
  ON quick_actions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = quick_actions.organization_id
        AND user_profiles.role = 'master_admin'
        AND user_profiles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = quick_actions.organization_id
        AND user_profiles.role = 'master_admin'
        AND user_profiles.is_active = true
    )
  );

-- Organization members can view quick actions
CREATE POLICY "Organization members can view quick actions"
  ON quick_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = quick_actions.organization_id
        AND user_profiles.is_active = true
    )
  );

-- ============================================================================
-- RLS Policies for department_visual_settings
-- ============================================================================

-- Master admins can manage visual settings
CREATE POLICY "Master admins can manage visual settings"
  ON department_visual_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = department_visual_settings.organization_id
        AND user_profiles.role = 'master_admin'
        AND user_profiles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = department_visual_settings.organization_id
        AND user_profiles.role = 'master_admin'
        AND user_profiles.is_active = true
    )
  );

-- Organization members can view visual settings
CREATE POLICY "Organization members can view visual settings"
  ON department_visual_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = department_visual_settings.organization_id
        AND user_profiles.is_active = true
    )
  );

-- ============================================================================
-- Triggers for updated_at timestamp
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_integrations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for integrations
DROP TRIGGER IF EXISTS update_integrations_timestamp ON department_integrations;
CREATE TRIGGER update_integrations_timestamp
  BEFORE UPDATE ON department_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_integrations_timestamp();

-- Triggers for quick actions
DROP TRIGGER IF EXISTS update_quick_actions_timestamp ON quick_actions;
CREATE TRIGGER update_quick_actions_timestamp
  BEFORE UPDATE ON quick_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_integrations_timestamp();

-- Triggers for visual settings
DROP TRIGGER IF EXISTS update_visual_settings_timestamp ON department_visual_settings;
CREATE TRIGGER update_visual_settings_timestamp
  BEFORE UPDATE ON department_visual_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_integrations_timestamp();

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT ALL ON department_integrations TO authenticated;
GRANT ALL ON department_integrations TO service_role;

GRANT ALL ON quick_actions TO authenticated;
GRANT ALL ON quick_actions TO service_role;

GRANT ALL ON department_visual_settings TO authenticated;
GRANT ALL ON department_visual_settings TO service_role;
