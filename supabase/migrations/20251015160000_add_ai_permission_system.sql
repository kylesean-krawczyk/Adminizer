/*
  # AI Permission System

  1. New Tables
    - `ai_permission_templates`
      - Template-based permission sets (Admin, Manager, Employee, Viewer)
      - Defines which tools are available to each template
      - Reusable across multiple users

    - `ai_user_permissions`
      - User-specific tool access permissions
      - Overrides default role-based permissions
      - Tracks permission grants and revocations

    - `ai_tool_access_requests`
      - Employee requests for tool access elevation
      - Tracks approval workflow and history
      - Supports temporary and permanent access grants

    - `ai_permission_audit_trail`
      - Comprehensive logging of all permission changes
      - Tracks who made changes and when
      - Records before/after states for compliance

  2. Schema Updates
    - Add `permission_overrides` jsonb to user_profiles
    - Add `default_permission_template` to user_profiles
    - Extend `ai_tool_execution_logs` with permission context

  3. Security
    - Enable RLS on all new tables
    - Users can view their own permissions and requests
    - Admins can manage all permissions and approve requests
    - Master admins have full access to audit trails
    - Audit trail is append-only for compliance

  4. Indexes
    - Fast lookups by user_id, tool_id, status
    - Efficient date range queries for audit trails
    - Optimized filtering for pending requests
*/

-- Create permission templates table
CREATE TABLE IF NOT EXISTS ai_permission_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  permission_level text NOT NULL CHECK (permission_level IN ('master_admin', 'admin', 'manager', 'employee', 'viewer')),
  tool_permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_system_template boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user permissions table
CREATE TABLE IF NOT EXISTS ai_user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES ai_tool_registry(id) ON DELETE CASCADE,
  granted boolean DEFAULT true,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  reason text,
  is_temporary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tool_id)
);

-- Create tool access requests table
CREATE TABLE IF NOT EXISTS ai_tool_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES ai_tool_registry(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired', 'cancelled')),
  request_reason text NOT NULL,
  business_justification text NOT NULL,
  requested_duration_days integer,
  is_temporary boolean DEFAULT false,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_comment text,
  expires_at timestamptz,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create permission audit trail table
CREATE TABLE IF NOT EXISTS ai_permission_audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id uuid REFERENCES ai_tool_registry(id) ON DELETE SET NULL,
  action_type text NOT NULL CHECK (action_type IN ('grant', 'revoke', 'request', 'approve', 'deny', 'expire', 'check_denied', 'check_allowed')),
  permission_before jsonb,
  permission_after jsonb,
  performed_by uuid REFERENCES auth.users(id),
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Add columns to user_profiles for permission management
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'permission_overrides'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN permission_overrides jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'default_permission_template'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN default_permission_template uuid REFERENCES ai_permission_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Extend ai_tool_execution_logs with permission context
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_tool_execution_logs' AND column_name = 'permission_level_used'
  ) THEN
    ALTER TABLE ai_tool_execution_logs ADD COLUMN permission_level_used text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_tool_execution_logs' AND column_name = 'permission_check_passed'
  ) THEN
    ALTER TABLE ai_tool_execution_logs ADD COLUMN permission_check_passed boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_tool_execution_logs' AND column_name = 'permission_denial_reason'
  ) THEN
    ALTER TABLE ai_tool_execution_logs ADD COLUMN permission_denial_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_tool_execution_logs' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE ai_tool_execution_logs ADD COLUMN ip_address inet;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_tool_execution_logs' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE ai_tool_execution_logs ADD COLUMN user_agent text;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_user_permissions_user_id ON ai_user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_user_permissions_tool_id ON ai_user_permissions(tool_id);
CREATE INDEX IF NOT EXISTS idx_ai_user_permissions_expires_at ON ai_user_permissions(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_tool_access_requests_user_id ON ai_tool_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_access_requests_tool_id ON ai_tool_access_requests(tool_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_access_requests_status ON ai_tool_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_ai_tool_access_requests_created_at ON ai_tool_access_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_permission_audit_trail_user_id ON ai_permission_audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_permission_audit_trail_tool_id ON ai_permission_audit_trail(tool_id);
CREATE INDEX IF NOT EXISTS idx_ai_permission_audit_trail_action_type ON ai_permission_audit_trail(action_type);
CREATE INDEX IF NOT EXISTS idx_ai_permission_audit_trail_created_at ON ai_permission_audit_trail(created_at DESC);

-- Enable Row Level Security
ALTER TABLE ai_permission_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tool_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_permission_audit_trail ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_permission_templates
CREATE POLICY "Admins can manage permission templates"
  ON ai_permission_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('master_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('master_admin', 'admin')
    )
  );

CREATE POLICY "All authenticated users can view templates"
  ON ai_permission_templates FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for ai_user_permissions
CREATE POLICY "Users can view their own permissions"
  ON ai_user_permissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all permissions"
  ON ai_user_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('master_admin', 'admin')
    )
  );

CREATE POLICY "Admins can manage user permissions"
  ON ai_user_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('master_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('master_admin', 'admin')
    )
  );

-- RLS Policies for ai_tool_access_requests
CREATE POLICY "Users can view their own requests"
  ON ai_tool_access_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests"
  ON ai_tool_access_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending requests"
  ON ai_tool_access_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status IN ('pending', 'cancelled'));

CREATE POLICY "Admins can view all requests"
  ON ai_tool_access_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('master_admin', 'admin')
    )
  );

CREATE POLICY "Admins can update requests"
  ON ai_tool_access_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('master_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('master_admin', 'admin')
    )
  );

-- RLS Policies for ai_permission_audit_trail
CREATE POLICY "Users can view their own audit trail"
  ON ai_permission_audit_trail FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit trails"
  ON ai_permission_audit_trail FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('master_admin', 'admin')
    )
  );

CREATE POLICY "System can insert audit trail entries"
  ON ai_permission_audit_trail FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Seed default permission templates
INSERT INTO ai_permission_templates (name, description, permission_level, tool_permissions, is_system_template)
VALUES
  (
    'Admin',
    'Full access to all AI tools including system management, user creation, and configuration',
    'admin',
    '{"all": true}'::jsonb,
    true
  ),
  (
    'Manager',
    'Access to employee management tools, report generation, and document management',
    'manager',
    '{"allowed_tools": ["getEmployeeList", "generateReport", "searchDocuments", "analyzeData"]}'::jsonb,
    true
  ),
  (
    'Employee',
    'Self-service tools, document search, basic analytics queries, and read-only reports',
    'employee',
    '{"allowed_tools": ["searchDocuments", "getEmployeeList"]}'::jsonb,
    true
  ),
  (
    'Viewer',
    'Read-only access to documents and view-only reports',
    'viewer',
    '{"allowed_tools": ["searchDocuments"]}'::jsonb,
    true
  )
ON CONFLICT (name) DO NOTHING;
