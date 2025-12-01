/*
  # Create Dynamic Department Landing Page System

  ## Summary
  Creates a comprehensive system for customizing department landing pages including:
  - Statistics cards with customizable labels, icons, and metrics
  - Department features and capabilities lists
  - Department tools and resources
  - Enhanced department configurations with icons and color themes

  ## New Tables
  1. `department_stat_cards`
    - Customizable statistics cards for department landing pages
    - 4 cards per department showing key metrics
    - Labels, icons, and metric types are customizable
  
  2. `department_features`
    - List of features and capabilities for each department
    - Reorderable bullet point items
    - Titles and optional descriptions
  
  3. `department_tools`
    - Tools and resources specific to each department
    - Support for internal routes and external links
    - Integration configuration for future OAuth connections
  
  4. Updates to `department_section_assignments`
    - Add icon_name, emoji, and color_theme fields
    - Store visual customization settings

  ## Security
  - RLS enabled on all tables
  - Master admins: full CRUD access
  - Organization members: read-only access
  - All data scoped by organization_id

  ## Notes
  - Supports 30+ Lucide icons via icon_name field
  - Metric types: documents, team_members, active_projects, resources, custom
  - All display_order fields enable drag-and-drop reordering
  - Audit trail with created_by/updated_by fields
*/

-- ============================================================================
-- Table 1: Department Statistics Cards
-- ============================================================================

CREATE TABLE IF NOT EXISTS department_stat_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vertical_id TEXT NOT NULL CHECK (vertical_id IN ('church', 'business', 'estate')),
  department_id TEXT NOT NULL,

  -- Card Configuration
  label TEXT NOT NULL CHECK (length(label) >= 1 AND length(label) <= 100),
  icon_name TEXT NOT NULL DEFAULT 'FileText',
  metric_type TEXT NOT NULL CHECK (metric_type IN ('documents', 'team_members', 'active_projects', 'resources', 'custom')),
  display_order INTEGER NOT NULL CHECK (display_order >= 0 AND display_order <= 3),
  is_visible BOOLEAN DEFAULT true,

  -- Custom metric configuration (for future use)
  custom_metric_query TEXT,
  custom_metric_value INTEGER,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES user_profiles(id),
  updated_by UUID REFERENCES user_profiles(id),

  -- Ensure one card per display position per department
  CONSTRAINT unique_dept_stat_card_order UNIQUE (organization_id, vertical_id, department_id, display_order)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stat_cards_org_vertical_dept
  ON department_stat_cards(organization_id, vertical_id, department_id);

CREATE INDEX IF NOT EXISTS idx_stat_cards_display_order
  ON department_stat_cards(organization_id, vertical_id, department_id, display_order);

-- ============================================================================
-- Table 2: Department Features & Capabilities
-- ============================================================================

CREATE TABLE IF NOT EXISTS department_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vertical_id TEXT NOT NULL CHECK (vertical_id IN ('church', 'business', 'estate')),
  department_id TEXT NOT NULL,

  -- Feature Content
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
  description TEXT CHECK (description IS NULL OR length(description) <= 1000),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES user_profiles(id),
  updated_by UUID REFERENCES user_profiles(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_features_org_vertical_dept
  ON department_features(organization_id, vertical_id, department_id);

CREATE INDEX IF NOT EXISTS idx_features_display_order
  ON department_features(organization_id, vertical_id, department_id, display_order);

-- ============================================================================
-- Table 3: Department Tools & Resources
-- ============================================================================

CREATE TABLE IF NOT EXISTS department_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vertical_id TEXT NOT NULL CHECK (vertical_id IN ('church', 'business', 'estate')),
  department_id TEXT NOT NULL,

  -- Tool Information
  tool_name TEXT NOT NULL CHECK (length(tool_name) >= 1 AND length(tool_name) <= 150),
  tool_description TEXT CHECK (tool_description IS NULL OR length(tool_description) <= 500),
  tool_url TEXT,
  tool_type TEXT NOT NULL DEFAULT 'external_link' CHECK (tool_type IN ('internal_route', 'external_link', 'integration')),
  
  -- Integration configuration (for OAuth tools)
  integration_config JSONB DEFAULT '{}'::jsonb,
  
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES user_profiles(id),
  updated_by UUID REFERENCES user_profiles(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tools_org_vertical_dept
  ON department_tools(organization_id, vertical_id, department_id);

CREATE INDEX IF NOT EXISTS idx_tools_display_order
  ON department_tools(organization_id, vertical_id, department_id, display_order);

-- ============================================================================
-- Table 4: Extend Department Section Assignments (Visual Config)
-- ============================================================================

-- Add new columns to existing department_section_assignments table
DO $$
BEGIN
  -- Add icon_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'department_section_assignments' AND column_name = 'icon_name'
  ) THEN
    ALTER TABLE department_section_assignments ADD COLUMN icon_name TEXT DEFAULT 'FileText';
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
    ALTER TABLE department_section_assignments ADD COLUMN color_theme TEXT DEFAULT 'blue';
  END IF;
END $$;

-- ============================================================================
-- Row Level Security Policies
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE department_stat_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_tools ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for department_stat_cards
-- ============================================================================

-- Master admins can manage stat cards
CREATE POLICY "Master admins can manage stat cards"
  ON department_stat_cards
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = department_stat_cards.organization_id
        AND user_profiles.role = 'master_admin'
        AND user_profiles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = department_stat_cards.organization_id
        AND user_profiles.role = 'master_admin'
        AND user_profiles.is_active = true
    )
  );

-- Organization members can view stat cards
CREATE POLICY "Organization members can view stat cards"
  ON department_stat_cards
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = department_stat_cards.organization_id
        AND user_profiles.is_active = true
    )
  );

-- ============================================================================
-- RLS Policies for department_features
-- ============================================================================

-- Master admins can manage features
CREATE POLICY "Master admins can manage features"
  ON department_features
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = department_features.organization_id
        AND user_profiles.role = 'master_admin'
        AND user_profiles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = department_features.organization_id
        AND user_profiles.role = 'master_admin'
        AND user_profiles.is_active = true
    )
  );

-- Organization members can view features
CREATE POLICY "Organization members can view features"
  ON department_features
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = department_features.organization_id
        AND user_profiles.is_active = true
    )
  );

-- ============================================================================
-- RLS Policies for department_tools
-- ============================================================================

-- Master admins can manage tools
CREATE POLICY "Master admins can manage tools"
  ON department_tools
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = department_tools.organization_id
        AND user_profiles.role = 'master_admin'
        AND user_profiles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = department_tools.organization_id
        AND user_profiles.role = 'master_admin'
        AND user_profiles.is_active = true
    )
  );

-- Organization members can view tools
CREATE POLICY "Organization members can view tools"
  ON department_tools
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.organization_id = department_tools.organization_id
        AND user_profiles.is_active = true
    )
  );

-- ============================================================================
-- Triggers for updated_at timestamp
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_department_landing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for stat_cards
DROP TRIGGER IF EXISTS update_stat_cards_timestamp ON department_stat_cards;
CREATE TRIGGER update_stat_cards_timestamp
  BEFORE UPDATE ON department_stat_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_department_landing_timestamp();

-- Triggers for features
DROP TRIGGER IF EXISTS update_features_timestamp ON department_features;
CREATE TRIGGER update_features_timestamp
  BEFORE UPDATE ON department_features
  FOR EACH ROW
  EXECUTE FUNCTION update_department_landing_timestamp();

-- Triggers for tools
DROP TRIGGER IF EXISTS update_tools_timestamp ON department_tools;
CREATE TRIGGER update_tools_timestamp
  BEFORE UPDATE ON department_tools
  FOR EACH ROW
  EXECUTE FUNCTION update_department_landing_timestamp();

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT ALL ON department_stat_cards TO authenticated;
GRANT ALL ON department_stat_cards TO service_role;

GRANT ALL ON department_features TO authenticated;
GRANT ALL ON department_features TO service_role;

GRANT ALL ON department_tools TO authenticated;
GRANT ALL ON department_tools TO service_role;