/*
  # Workflow System Schema

  ## Overview
  This migration creates the complete database schema for a flexible, multi-step workflow system
  that integrates with Claude AI and the existing tool registry.

  ## New Tables

  ### 1. workflow_definitions
  Stores reusable workflow templates that can be instantiated multiple times.
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Display name of the workflow
  - `slug` (text, unique) - URL-friendly identifier
  - `description` (text) - What this workflow does
  - `category` (text) - Category: onboarding, approval, operations, compliance, custom
  - `is_active` (boolean) - Whether this workflow can be initiated
  - `trigger_type` (text) - How workflow starts: manual, scheduled, event_based, api
  - `trigger_config` (jsonb) - Configuration for trigger conditions
  - `metadata` (jsonb) - Additional workflow settings and configuration
  - `version` (integer) - Version number for tracking changes
  - `organization_id` (uuid) - Links to organization
  - `created_by` (uuid) - User who created the workflow
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. workflow_steps
  Defines individual steps within a workflow definition.
  - `id` (uuid, primary key)
  - `workflow_id` (uuid, foreign key) - References workflow_definitions
  - `name` (text) - Step name
  - `step_order` (integer) - Execution order (1, 2, 3...)
  - `step_type` (text) - Type: form_input, ai_processing, tool_execution, approval_gate, data_transform, conditional
  - `configuration` (jsonb) - Step-specific configuration (forms, tools, conditions)
  - `is_required` (boolean) - Whether step can be skipped
  - `timeout_minutes` (integer) - Max time allowed for step completion
  - `retry_config` (jsonb) - Retry settings for failures
  - `depends_on_steps` (jsonb) - Array of step IDs that must complete first
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. workflow_instances
  Tracks individual workflow executions.
  - `id` (uuid, primary key)
  - `workflow_id` (uuid, foreign key) - References workflow_definitions
  - `workflow_version` (integer) - Version of workflow used
  - `current_step_id` (uuid) - Current step being executed
  - `status` (text) - Status: pending, in_progress, waiting_approval, completed, failed, cancelled
  - `initiator_id` (uuid) - User who started the workflow
  - `context_data` (jsonb) - All data accumulated through workflow
  - `started_at` (timestamptz)
  - `completed_at` (timestamptz)
  - `organization_id` (uuid)
  - `metadata` (jsonb) - Additional instance-specific data
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. workflow_step_executions
  Logs each step execution within a workflow instance.
  - `id` (uuid, primary key)
  - `workflow_instance_id` (uuid, foreign key) - References workflow_instances
  - `workflow_step_id` (uuid, foreign key) - References workflow_steps
  - `execution_order` (integer) - Order this step was executed
  - `status` (text) - Status: pending, executing, completed, failed, skipped, waiting_input
  - `input_data` (jsonb) - Data provided to this step
  - `output_data` (jsonb) - Data produced by this step
  - `error_message` (text) - Error details if failed
  - `execution_time_ms` (integer) - Duration in milliseconds
  - `retry_count` (integer) - Number of retry attempts
  - `executed_by` (uuid) - User who executed/approved this step
  - `started_at` (timestamptz)
  - `completed_at` (timestamptz)
  - `created_at` (timestamptz)

  ### 5. workflow_approvals
  Manages approval gates within workflows.
  - `id` (uuid, primary key)
  - `workflow_instance_id` (uuid, foreign key) - References workflow_instances
  - `step_execution_id` (uuid, foreign key) - References workflow_step_executions
  - `approver_id` (uuid) - User who needs to approve
  - `approver_role` (text) - Role required for approval
  - `status` (text) - Status: pending, approved, rejected, timeout
  - `decision_comment` (text) - Approver's comment
  - `requested_at` (timestamptz)
  - `responded_at` (timestamptz)
  - `timeout_at` (timestamptz)
  - `created_at` (timestamptz)

  ## Security (RLS Policies)
  - Users can view workflows in their organization
  - Admins can create and manage workflow definitions
  - Users can initiate workflows they have permission for
  - Users can view workflow instances they initiated or are involved in
  - Approvers can view and respond to approval requests assigned to them
  - Master admins can view all workflows and instances

  ## Indexes
  - Index on workflow_definitions(slug) for fast lookups
  - Index on workflow_instances(status, organization_id) for filtering
  - Index on workflow_step_executions(workflow_instance_id, execution_order) for retrieval
  - Index on workflow_approvals(approver_id, status) for approval queues
*/

-- Create workflow_definitions table
CREATE TABLE IF NOT EXISTS workflow_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('onboarding', 'approval', 'operations', 'compliance', 'analytics', 'custom')),
  is_active boolean DEFAULT true,
  trigger_type text NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'scheduled', 'event_based', 'api')),
  trigger_config jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  version integer DEFAULT 1,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workflow_steps table
CREATE TABLE IF NOT EXISTS workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  name text NOT NULL,
  step_order integer NOT NULL,
  step_type text NOT NULL CHECK (step_type IN ('form_input', 'ai_processing', 'tool_execution', 'approval_gate', 'data_transform', 'conditional')),
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_required boolean DEFAULT true,
  timeout_minutes integer DEFAULT 60,
  retry_config jsonb DEFAULT '{"maxRetries": 3, "retryDelaySeconds": 60}'::jsonb,
  depends_on_steps jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(workflow_id, step_order)
);

-- Create workflow_instances table
CREATE TABLE IF NOT EXISTS workflow_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  workflow_version integer NOT NULL DEFAULT 1,
  current_step_id uuid REFERENCES workflow_steps(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'waiting_approval', 'completed', 'failed', 'cancelled')),
  initiator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context_data jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workflow_step_executions table
CREATE TABLE IF NOT EXISTS workflow_step_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id uuid NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  workflow_step_id uuid NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  execution_order integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'completed', 'failed', 'skipped', 'waiting_input')),
  input_data jsonb DEFAULT '{}'::jsonb,
  output_data jsonb DEFAULT '{}'::jsonb,
  error_message text,
  execution_time_ms integer,
  retry_count integer DEFAULT 0,
  executed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create workflow_approvals table
CREATE TABLE IF NOT EXISTS workflow_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id uuid NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  step_execution_id uuid NOT NULL REFERENCES workflow_step_executions(id) ON DELETE CASCADE,
  approver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approver_role text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'timeout')),
  decision_comment text,
  requested_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  timeout_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_slug ON workflow_definitions(slug);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_org ON workflow_definitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_category ON workflow_definitions(category);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_order ON workflow_steps(workflow_id, step_order);

CREATE INDEX IF NOT EXISTS idx_workflow_instances_workflow_id ON workflow_instances(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status_org ON workflow_instances(status, organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_initiator ON workflow_instances(initiator_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_created ON workflow_instances(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_step_executions_instance ON workflow_step_executions(workflow_instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_executions_order ON workflow_step_executions(workflow_instance_id, execution_order);
CREATE INDEX IF NOT EXISTS idx_workflow_step_executions_status ON workflow_step_executions(status);

CREATE INDEX IF NOT EXISTS idx_workflow_approvals_instance ON workflow_approvals(workflow_instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_approver_status ON workflow_approvals(approver_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_step ON workflow_approvals(step_execution_id);

-- Enable Row Level Security
ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflow_definitions

CREATE POLICY "Users can view workflows in their organization"
  ON workflow_definitions FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    )
    OR organization_id IS NULL
  );

CREATE POLICY "Admins can create workflows"
  ON workflow_definitions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'master_admin')
      AND user_profiles.organization_id = workflow_definitions.organization_id
    )
  );

CREATE POLICY "Admins can update workflows"
  ON workflow_definitions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'master_admin')
      AND user_profiles.organization_id = workflow_definitions.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'master_admin')
      AND user_profiles.organization_id = workflow_definitions.organization_id
    )
  );

CREATE POLICY "Master admins can delete workflows"
  ON workflow_definitions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'master_admin'
    )
  );

-- RLS Policies for workflow_steps

CREATE POLICY "Users can view steps for accessible workflows"
  ON workflow_steps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflow_definitions
      WHERE workflow_definitions.id = workflow_steps.workflow_id
      AND (
        workflow_definitions.organization_id IN (
          SELECT organization_id FROM user_profiles
          WHERE user_profiles.id = auth.uid()
        )
        OR workflow_definitions.organization_id IS NULL
      )
    )
  );

CREATE POLICY "Admins can manage workflow steps"
  ON workflow_steps FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflow_definitions wd
      JOIN user_profiles up ON up.organization_id = wd.organization_id
      WHERE wd.id = workflow_steps.workflow_id
      AND up.id = auth.uid()
      AND up.role IN ('admin', 'master_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflow_definitions wd
      JOIN user_profiles up ON up.organization_id = wd.organization_id
      WHERE wd.id = workflow_steps.workflow_id
      AND up.id = auth.uid()
      AND up.role IN ('admin', 'master_admin')
    )
  );

-- RLS Policies for workflow_instances

CREATE POLICY "Users can view workflow instances they're involved in"
  ON workflow_instances FOR SELECT
  TO authenticated
  USING (
    initiator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workflow_approvals
      WHERE workflow_approvals.workflow_instance_id = workflow_instances.id
      AND workflow_approvals.approver_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'master_admin')
      AND user_profiles.organization_id = workflow_instances.organization_id
    )
  );

CREATE POLICY "Users can create workflow instances"
  ON workflow_instances FOR INSERT
  TO authenticated
  WITH CHECK (
    initiator_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can update their workflow instances"
  ON workflow_instances FOR UPDATE
  TO authenticated
  USING (
    initiator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'master_admin')
      AND user_profiles.organization_id = workflow_instances.organization_id
    )
  )
  WITH CHECK (
    initiator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'master_admin')
      AND user_profiles.organization_id = workflow_instances.organization_id
    )
  );

-- RLS Policies for workflow_step_executions

CREATE POLICY "Users can view step executions for their instances"
  ON workflow_step_executions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflow_instances
      WHERE workflow_instances.id = workflow_step_executions.workflow_instance_id
      AND (
        workflow_instances.initiator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role IN ('admin', 'master_admin')
          AND user_profiles.organization_id = workflow_instances.organization_id
        )
      )
    )
  );

CREATE POLICY "System can create step executions"
  ON workflow_step_executions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflow_instances
      WHERE workflow_instances.id = workflow_step_executions.workflow_instance_id
      AND workflow_instances.initiator_id = auth.uid()
    )
  );

CREATE POLICY "System can update step executions"
  ON workflow_step_executions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflow_instances
      WHERE workflow_instances.id = workflow_step_executions.workflow_instance_id
      AND (
        workflow_instances.initiator_id = auth.uid()
        OR executed_by = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflow_instances
      WHERE workflow_instances.id = workflow_step_executions.workflow_instance_id
      AND (
        workflow_instances.initiator_id = auth.uid()
        OR executed_by = auth.uid()
      )
    )
  );

-- RLS Policies for workflow_approvals

CREATE POLICY "Approvers can view their approval requests"
  ON workflow_approvals FOR SELECT
  TO authenticated
  USING (
    approver_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workflow_instances wi
      WHERE wi.id = workflow_approvals.workflow_instance_id
      AND wi.initiator_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'master_admin')
    )
  );

CREATE POLICY "System can create approval requests"
  ON workflow_approvals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflow_instances
      WHERE workflow_instances.id = workflow_approvals.workflow_instance_id
      AND workflow_instances.initiator_id = auth.uid()
    )
  );

CREATE POLICY "Approvers can update their approvals"
  ON workflow_approvals FOR UPDATE
  TO authenticated
  USING (approver_id = auth.uid())
  WITH CHECK (approver_id = auth.uid());

-- Seed employee onboarding workflow
INSERT INTO workflow_definitions (name, slug, description, category, is_active, trigger_type, metadata, created_by)
VALUES (
  'Employee Onboarding',
  'employee-onboarding',
  'Complete workflow for onboarding new employees including data collection, document submission, approvals, and account setup',
  'onboarding',
  true,
  'manual',
  '{"estimatedDuration": "2-3 days", "requiredRoles": ["admin", "manager"]}'::jsonb,
  NULL
) ON CONFLICT (slug) DO NOTHING;

-- Seed steps for employee onboarding workflow
DO $$
DECLARE
  workflow_uuid uuid;
BEGIN
  SELECT id INTO workflow_uuid FROM workflow_definitions WHERE slug = 'employee-onboarding';
  
  IF workflow_uuid IS NOT NULL THEN
    INSERT INTO workflow_steps (workflow_id, name, step_order, step_type, configuration, is_required, timeout_minutes)
    VALUES
      (workflow_uuid, 'Collect Personal Information', 1, 'form_input', 
       '{"fields": [{"name": "firstName", "type": "string", "required": true, "label": "First Name"}, {"name": "lastName", "type": "string", "required": true, "label": "Last Name"}, {"name": "email", "type": "string", "required": true, "label": "Email Address"}, {"name": "phone", "type": "string", "required": false, "label": "Phone Number"}, {"name": "startDate", "type": "date", "required": true, "label": "Start Date"}]}'::jsonb,
       true, 1440),
      
      (workflow_uuid, 'Assign Department and Role', 2, 'form_input',
       '{"fields": [{"name": "department", "type": "enum", "required": true, "label": "Department", "options": ["Sales", "Operations", "Finance", "HR", "IT", "Marketing"]}, {"name": "role", "type": "enum", "required": true, "label": "Role", "options": ["admin", "user", "manager", "staff", "volunteer"]}, {"name": "manager", "type": "string", "required": false, "label": "Direct Manager"}]}'::jsonb,
       true, 1440),
      
      (workflow_uuid, 'Manager Approval', 3, 'approval_gate',
       '{"approverRole": "manager", "approvalMessage": "Please review and approve the new employee onboarding request", "allowComments": true}'::jsonb,
       true, 2880),
      
      (workflow_uuid, 'Create Employee Record', 4, 'tool_execution',
       '{"toolSlug": "createEmployeeRecord", "parameterMapping": {"name": "{{firstName}} {{lastName}}", "email": "{{email}}", "role": "{{role}}", "startDate": "{{startDate}}"}}'::jsonb,
       true, 30),
      
      (workflow_uuid, 'Generate Welcome Email', 5, 'ai_processing',
       '{"prompt": "Generate a personalized welcome email for a new employee named {{firstName}} {{lastName}} who will be joining as a {{role}} in the {{department}} department starting on {{startDate}}. Include information about their first day, who to contact, and what to expect.", "outputKey": "welcomeEmail"}'::jsonb,
       true, 10),
      
      (workflow_uuid, 'Send Onboarding Materials', 6, 'data_transform',
       '{"actions": [{"type": "notification", "recipient": "{{email}}", "subject": "Welcome to the Team!", "body": "{{welcomeEmail}}"}, {"type": "log", "message": "Employee onboarding completed for {{firstName}} {{lastName}}"}]}'::jsonb,
       true, 5)
    ON CONFLICT (workflow_id, step_order) DO NOTHING;
  END IF;
END $$;