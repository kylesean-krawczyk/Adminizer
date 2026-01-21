/*
  # OAuth Integration Tables

  1. New Tables
    - `oauth_configs`
      - Stores OAuth configuration for each provider per organization
    - `oauth_connections`
      - Stores user OAuth connections and tokens

  2. Security
    - Enable RLS on both tables
    - Add policies for organization-based access
*/

-- Create oauth_configs table
CREATE TABLE IF NOT EXISTS oauth_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id text NOT NULL,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  client_secret text NOT NULL,
  redirect_uri text NOT NULL,
  scopes text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(provider_id, organization_id)
);

-- Create oauth_connections table
CREATE TABLE IF NOT EXISTS oauth_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz NOT NULL,
  scopes text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(provider_id, user_id)
);

-- Enable RLS
ALTER TABLE oauth_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;

-- OAuth configs policies (only master admins can manage)
CREATE POLICY "Master admins can view oauth configs for their organization"
  ON oauth_configs
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'master_admin' AND is_active = true
    )
  );

CREATE POLICY "Master admins can insert oauth configs for their organization"
  ON oauth_configs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'master_admin' AND is_active = true
    )
  );

CREATE POLICY "Master admins can update oauth configs for their organization"
  ON oauth_configs
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'master_admin' AND is_active = true
    )
  );

CREATE POLICY "Master admins can delete oauth configs for their organization"
  ON oauth_configs
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'master_admin' AND is_active = true
    )
  );

-- OAuth connections policies (users can manage their own connections)
CREATE POLICY "Users can view their own oauth connections"
  ON oauth_connections
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own oauth connections"
  ON oauth_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own oauth connections"
  ON oauth_connections
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own oauth connections"
  ON oauth_connections
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create updated_at triggers
CREATE TRIGGER update_oauth_configs_updated_at
  BEFORE UPDATE ON oauth_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_connections_updated_at
  BEFORE UPDATE ON oauth_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();