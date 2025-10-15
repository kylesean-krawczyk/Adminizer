/*
  # AI Tool Registry System

  1. New Tables
    - `ai_tool_registry`
      - `id` (uuid, primary key)
      - `name` (text) - Display name of the tool
      - `slug` (text, unique) - URL-friendly identifier for the tool
      - `description` (text) - What the tool does
      - `category` (text) - Category: documents, employees, reports, system, analytics
      - `permission_level` (text) - Required permission: master_admin, admin, user, public
      - `is_enabled` (boolean) - Whether the tool is active
      - `requires_confirmation` (boolean) - Whether user must approve execution
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `ai_tool_parameters`
      - `id` (uuid, primary key)
      - `tool_id` (uuid, foreign key) - References ai_tool_registry
      - `name` (text) - Parameter name
      - `type` (text) - Data type: string, number, boolean, date, array, object, enum
      - `is_required` (boolean) - Whether parameter is required
      - `default_value` (text) - Default value if not provided
      - `description` (text) - What the parameter does
      - `validation_rules` (jsonb) - Validation constraints
      - `enum_values` (jsonb) - Possible values for enum types
      - `display_order` (integer) - Order to display parameters
      - `created_at` (timestamptz)

    - `ai_tool_return_schema`
      - `id` (uuid, primary key)
      - `tool_id` (uuid, foreign key) - References ai_tool_registry
      - `schema_definition` (jsonb) - JSON schema defining return structure
      - `example_response` (jsonb) - Example of successful response
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `ai_tool_execution_logs`
      - `id` (uuid, primary key)
      - `tool_id` (uuid, foreign key) - References ai_tool_registry
      - `user_id` (uuid, foreign key) - References auth.users
      - `session_id` (uuid) - Chat session if from chat
      - `parameters` (jsonb) - Input parameters provided
      - `response` (jsonb) - Tool execution response
      - `execution_time_ms` (integer) - Execution duration in milliseconds
      - `status` (text) - Status: pending, executing, success, failed, cancelled
      - `error_message` (text) - Error details if failed
      - `user_confirmed` (boolean) - Whether user approved execution
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Master admins can manage tool registry
    - All authenticated users can view enabled tools
    - Users can only view their own execution logs
    - Master admins can view all execution logs

  3. Indexes
    - Index on tool slug for fast lookups
    - Index on tool_id in related tables
    - Index on user_id and created_at in execution logs for queries
    - Index on status in execution logs for filtering
*/

-- Create ai_tool_registry table
CREATE TABLE IF NOT EXISTS ai_tool_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('documents', 'employees', 'reports', 'system', 'analytics')),
  permission_level text NOT NULL DEFAULT 'user' CHECK (permission_level IN ('master_admin', 'admin', 'user', 'public')),
  is_enabled boolean DEFAULT true,
  requires_confirmation boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ai_tool_parameters table
CREATE TABLE IF NOT EXISTS ai_tool_parameters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES ai_tool_registry(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('string', 'number', 'boolean', 'date', 'array', 'object', 'enum')),
  is_required boolean DEFAULT false,
  default_value text,
  description text NOT NULL,
  validation_rules jsonb DEFAULT '{}'::jsonb,
  enum_values jsonb,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create ai_tool_return_schema table
CREATE TABLE IF NOT EXISTS ai_tool_return_schema (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES ai_tool_registry(id) ON DELETE CASCADE,
  schema_definition jsonb NOT NULL,
  example_response jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ai_tool_execution_logs table
CREATE TABLE IF NOT EXISTS ai_tool_execution_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES ai_tool_registry(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid,
  parameters jsonb DEFAULT '{}'::jsonb,
  response jsonb,
  execution_time_ms integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'success', 'failed', 'cancelled')),
  error_message text,
  user_confirmed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_tool_registry_slug ON ai_tool_registry(slug);
CREATE INDEX IF NOT EXISTS idx_ai_tool_parameters_tool_id ON ai_tool_parameters(tool_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_return_schema_tool_id ON ai_tool_return_schema(tool_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_execution_logs_tool_id ON ai_tool_execution_logs(tool_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_execution_logs_user_id ON ai_tool_execution_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_execution_logs_created_at ON ai_tool_execution_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_tool_execution_logs_status ON ai_tool_execution_logs(status);

-- Enable Row Level Security
ALTER TABLE ai_tool_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tool_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tool_return_schema ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tool_execution_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_tool_registry
CREATE POLICY "Master admins can manage tool registry"
  ON ai_tool_registry FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'master_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'master_admin'
    )
  );

CREATE POLICY "Authenticated users can view enabled tools"
  ON ai_tool_registry FOR SELECT
  TO authenticated
  USING (is_enabled = true);

-- RLS Policies for ai_tool_parameters
CREATE POLICY "Master admins can manage tool parameters"
  ON ai_tool_parameters FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'master_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'master_admin'
    )
  );

CREATE POLICY "Authenticated users can view parameters for enabled tools"
  ON ai_tool_parameters FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_tool_registry
      WHERE ai_tool_registry.id = ai_tool_parameters.tool_id
      AND ai_tool_registry.is_enabled = true
    )
  );

-- RLS Policies for ai_tool_return_schema
CREATE POLICY "Master admins can manage tool return schemas"
  ON ai_tool_return_schema FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'master_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'master_admin'
    )
  );

CREATE POLICY "Authenticated users can view schemas for enabled tools"
  ON ai_tool_return_schema FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_tool_registry
      WHERE ai_tool_registry.id = ai_tool_return_schema.tool_id
      AND ai_tool_registry.is_enabled = true
    )
  );

-- RLS Policies for ai_tool_execution_logs
CREATE POLICY "Users can view their own execution logs"
  ON ai_tool_execution_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Master admins can view all execution logs"
  ON ai_tool_execution_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'master_admin'
    )
  );

CREATE POLICY "Authenticated users can create execution logs"
  ON ai_tool_execution_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own execution logs"
  ON ai_tool_execution_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Seed initial tools
INSERT INTO ai_tool_registry (name, slug, description, category, permission_level, is_enabled, requires_confirmation)
VALUES
  ('Search Documents', 'searchDocuments', 'Search through documents in the system by query, category, and tags', 'documents', 'user', true, false),
  ('Create Employee Record', 'createEmployeeRecord', 'Create a new employee record with name, email, role, and start date', 'employees', 'admin', true, true),
  ('Get Employee List', 'getEmployeeList', 'Retrieve a list of employees filtered by department, role, or status', 'employees', 'user', true, false),
  ('Generate Report', 'generateReport', 'Generate various types of reports including sales, operations, compliance, and financial', 'reports', 'admin', true, false),
  ('Get System Status', 'getSystemStatus', 'Retrieve current system health metrics, database status, and usage statistics', 'system', 'admin', true, false)
ON CONFLICT (slug) DO NOTHING;

-- Seed parameters for searchDocuments
INSERT INTO ai_tool_parameters (tool_id, name, type, is_required, description, validation_rules, display_order)
SELECT
  id,
  'query',
  'string',
  true,
  'Search query to find documents',
  '{"minLength": 1, "maxLength": 500}'::jsonb,
  1
FROM ai_tool_registry WHERE slug = 'searchDocuments'
ON CONFLICT DO NOTHING;

INSERT INTO ai_tool_parameters (tool_id, name, type, is_required, description, enum_values, display_order)
SELECT
  id,
  'category',
  'enum',
  false,
  'Filter by document category',
  '["Financial", "HR", "Legal", "Branding", "Operations", "All"]'::jsonb,
  2
FROM ai_tool_registry WHERE slug = 'searchDocuments'
ON CONFLICT DO NOTHING;

INSERT INTO ai_tool_parameters (tool_id, name, type, is_required, description, validation_rules, display_order)
SELECT
  id,
  'tags',
  'array',
  false,
  'Filter by document tags',
  '{"itemType": "string"}'::jsonb,
  3
FROM ai_tool_registry WHERE slug = 'searchDocuments'
ON CONFLICT DO NOTHING;

-- Seed parameters for createEmployeeRecord
INSERT INTO ai_tool_parameters (tool_id, name, type, is_required, description, validation_rules, display_order)
SELECT
  id,
  'name',
  'string',
  true,
  'Full name of the employee',
  '{"minLength": 2, "maxLength": 100}'::jsonb,
  1
FROM ai_tool_registry WHERE slug = 'createEmployeeRecord'
ON CONFLICT DO NOTHING;

INSERT INTO ai_tool_parameters (tool_id, name, type, is_required, description, validation_rules, display_order)
SELECT
  id,
  'email',
  'string',
  true,
  'Email address of the employee',
  '{"format": "email"}'::jsonb,
  2
FROM ai_tool_registry WHERE slug = 'createEmployeeRecord'
ON CONFLICT DO NOTHING;

INSERT INTO ai_tool_parameters (tool_id, name, type, is_required, description, enum_values, display_order)
SELECT
  id,
  'role',
  'enum',
  true,
  'Role of the employee',
  '["admin", "user", "manager", "staff", "volunteer"]'::jsonb,
  3
FROM ai_tool_registry WHERE slug = 'createEmployeeRecord'
ON CONFLICT DO NOTHING;

INSERT INTO ai_tool_parameters (tool_id, name, type, is_required, description, validation_rules, display_order)
SELECT
  id,
  'startDate',
  'date',
  true,
  'Start date of employment',
  '{"format": "YYYY-MM-DD"}'::jsonb,
  4
FROM ai_tool_registry WHERE slug = 'createEmployeeRecord'
ON CONFLICT DO NOTHING;

-- Seed parameters for getEmployeeList
INSERT INTO ai_tool_parameters (tool_id, name, type, is_required, description, display_order)
SELECT
  id,
  'department',
  'string',
  false,
  'Filter employees by department',
  1
FROM ai_tool_registry WHERE slug = 'getEmployeeList'
ON CONFLICT DO NOTHING;

INSERT INTO ai_tool_parameters (tool_id, name, type, is_required, description, display_order)
SELECT
  id,
  'role',
  'string',
  false,
  'Filter employees by role',
  2
FROM ai_tool_registry WHERE slug = 'getEmployeeList'
ON CONFLICT DO NOTHING;

INSERT INTO ai_tool_parameters (tool_id, name, type, is_required, description, enum_values, display_order)
SELECT
  id,
  'status',
  'enum',
  false,
  'Filter employees by employment status',
  '["active", "inactive", "on_leave"]'::jsonb,
  3
FROM ai_tool_registry WHERE slug = 'getEmployeeList'
ON CONFLICT DO NOTHING;

-- Seed parameters for generateReport
INSERT INTO ai_tool_parameters (tool_id, name, type, is_required, description, enum_values, display_order)
SELECT
  id,
  'reportType',
  'enum',
  true,
  'Type of report to generate',
  '["sales", "operations", "compliance", "financial"]'::jsonb,
  1
FROM ai_tool_registry WHERE slug = 'generateReport'
ON CONFLICT DO NOTHING;

INSERT INTO ai_tool_parameters (tool_id, name, type, is_required, description, validation_rules, display_order)
SELECT
  id,
  'dateRange',
  'object',
  true,
  'Date range for the report',
  '{"properties": {"startDate": {"type": "date"}, "endDate": {"type": "date"}}}'::jsonb,
  2
FROM ai_tool_registry WHERE slug = 'generateReport'
ON CONFLICT DO NOTHING;

-- Seed return schemas
INSERT INTO ai_tool_return_schema (tool_id, schema_definition, example_response)
SELECT
  id,
  '{"type": "object", "properties": {"results": {"type": "array"}, "total": {"type": "number"}, "query": {"type": "string"}}}'::jsonb,
  '{"results": [{"id": "doc-1", "title": "Q4 Report", "category": "Financial", "tags": ["report", "2024"], "lastModified": "2024-10-01"}], "total": 1, "query": "Q4"}'::jsonb
FROM ai_tool_registry WHERE slug = 'searchDocuments'
ON CONFLICT DO NOTHING;

INSERT INTO ai_tool_return_schema (tool_id, schema_definition, example_response)
SELECT
  id,
  '{"type": "object", "properties": {"success": {"type": "boolean"}, "employee": {"type": "object"}, "message": {"type": "string"}}}'::jsonb,
  '{"success": true, "employee": {"id": "emp-123", "name": "John Doe", "email": "john@example.com", "role": "staff", "startDate": "2024-10-15"}, "message": "Employee record created successfully"}'::jsonb
FROM ai_tool_registry WHERE slug = 'createEmployeeRecord'
ON CONFLICT DO NOTHING;

INSERT INTO ai_tool_return_schema (tool_id, schema_definition, example_response)
SELECT
  id,
  '{"type": "object", "properties": {"employees": {"type": "array"}, "total": {"type": "number"}, "filters": {"type": "object"}}}'::jsonb,
  '{"employees": [{"id": "emp-1", "name": "Jane Smith", "email": "jane@example.com", "role": "admin", "department": "HR", "status": "active"}], "total": 1, "filters": {"department": "HR"}}'::jsonb
FROM ai_tool_registry WHERE slug = 'getEmployeeList'
ON CONFLICT DO NOTHING;

INSERT INTO ai_tool_return_schema (tool_id, schema_definition, example_response)
SELECT
  id,
  '{"type": "object", "properties": {"reportId": {"type": "string"}, "reportType": {"type": "string"}, "data": {"type": "object"}, "generatedAt": {"type": "string"}}}'::jsonb,
  '{"reportId": "rep-456", "reportType": "sales", "data": {"totalSales": 125000, "transactions": 340, "avgValue": 367.65}, "generatedAt": "2024-10-10T12:00:00Z"}'::jsonb
FROM ai_tool_registry WHERE slug = 'generateReport'
ON CONFLICT DO NOTHING;

INSERT INTO ai_tool_return_schema (tool_id, schema_definition, example_response)
SELECT
  id,
  '{"type": "object", "properties": {"status": {"type": "string"}, "health": {"type": "object"}, "metrics": {"type": "object"}}}'::jsonb,
  '{"status": "healthy", "health": {"database": "online", "storage": "online", "api": "online"}, "metrics": {"activeUsers": 42, "storageUsed": "2.3 GB", "uptime": "99.9%"}}'::jsonb
FROM ai_tool_registry WHERE slug = 'getSystemStatus'
ON CONFLICT DO NOTHING;
