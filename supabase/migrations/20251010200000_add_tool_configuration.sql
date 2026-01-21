/*
  # Add Tool Configuration Management

  1. New Tables
    - `ai_tool_user_config`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `tool_id` (uuid, foreign key to ai_tool_registry)
      - `is_enabled` (boolean) - Whether this tool is enabled for this user
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `ai_tool_organization_config`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key to organizations)
      - `tool_id` (uuid, foreign key to ai_tool_registry)
      - `is_enabled` (boolean) - Whether this tool is enabled for this organization
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Add indexes for efficient querying of tool configurations
    - Add unique constraints to prevent duplicate configurations

  3. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own tool configuration
    - Add policies for admins to manage organization-wide configurations
*/

-- Create ai_tool_user_config table
CREATE TABLE IF NOT EXISTS ai_tool_user_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES ai_tool_registry(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tool_id)
);

-- Create ai_tool_organization_config table
CREATE TABLE IF NOT EXISTS ai_tool_organization_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES ai_tool_registry(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, tool_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_ai_tool_user_config_user_id ON ai_tool_user_config(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_user_config_tool_id ON ai_tool_user_config(tool_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_organization_config_org_id ON ai_tool_organization_config(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_organization_config_tool_id ON ai_tool_organization_config(tool_id);

-- Enable RLS
ALTER TABLE ai_tool_user_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tool_organization_config ENABLE ROW LEVEL SECURITY;

-- Policies for ai_tool_user_config

-- Users can view their own tool configurations
CREATE POLICY "Users can view own tool config"
  ON ai_tool_user_config
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own tool configurations
CREATE POLICY "Users can insert own tool config"
  ON ai_tool_user_config
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tool configurations
CREATE POLICY "Users can update own tool config"
  ON ai_tool_user_config
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tool configurations
CREATE POLICY "Users can delete own tool config"
  ON ai_tool_user_config
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for ai_tool_organization_config

-- Authenticated users can view their organization's tool configurations
CREATE POLICY "Users can view organization tool config"
  ON ai_tool_organization_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.organization_id = ai_tool_organization_config.organization_id
    )
  );

-- Only admins can insert organization tool configurations
CREATE POLICY "Admins can insert organization tool config"
  ON ai_tool_organization_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.organization_id = organization_id
      AND user_profiles.role IN ('admin', 'master_admin')
    )
  );

-- Only admins can update organization tool configurations
CREATE POLICY "Admins can update organization tool config"
  ON ai_tool_organization_config
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.organization_id = organization_id
      AND user_profiles.role IN ('admin', 'master_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.organization_id = organization_id
      AND user_profiles.role IN ('admin', 'master_admin')
    )
  );

-- Only admins can delete organization tool configurations
CREATE POLICY "Admins can delete organization tool config"
  ON ai_tool_organization_config
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.organization_id = organization_id
      AND user_profiles.role IN ('admin', 'master_admin')
    )
  );

-- Add updated_at trigger for ai_tool_user_config
CREATE OR REPLACE FUNCTION update_ai_tool_user_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ai_tool_user_config_updated_at ON ai_tool_user_config;
CREATE TRIGGER update_ai_tool_user_config_updated_at
  BEFORE UPDATE ON ai_tool_user_config
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_tool_user_config_updated_at();

-- Add updated_at trigger for ai_tool_organization_config
CREATE OR REPLACE FUNCTION update_ai_tool_organization_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ai_tool_organization_config_updated_at ON ai_tool_organization_config;
CREATE TRIGGER update_ai_tool_organization_config_updated_at
  BEFORE UPDATE ON ai_tool_organization_config
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_tool_organization_config_updated_at();
