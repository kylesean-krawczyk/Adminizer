/*
  # Enhanced Tool Confirmation and Reasoning System

  ## Overview
  Extends the AI chat and tool execution system with enhanced features for:
  - Tool selection reasoning and confidence tracking
  - Parameter extraction and modification tracking
  - User confirmation decisions and preferences
  - Enhanced metadata for chat messages

  ## Schema Changes

  ### Chat Messages Metadata Enhancement
  - Add `intent` field for detected user intent
  - Add `intent_confidence` field for intent confidence score
  - Add `metadata` JSONB field for flexible metadata storage including:
    - `tool_reasoning`: Claude's decision-making process
    - `parameter_confidence`: Confidence scores for extracted parameters
    - `parameters_modified`: Flag indicating user edited parameters
    - `original_parameters`: Claude's initial parameter extraction
    - `final_parameters`: User-approved parameters
    - `tool_enabled`: Whether this message used tool-enabled mode
    - `tools_used`: Array of tool names executed
    - `requires_confirmation`: Whether tools need confirmation
    - `pending_confirmations`: Array of pending confirmation requests

  ### Tool Execution Logs Enhancement
  - Add `reasoning_text` field for tool selection reasoning
  - Add `confidence_score` field for selection confidence (0-1)
  - Add `parameters_edited` flag indicating user modifications
  - Add `user_edit_details` JSONB field for tracking parameter changes
  - Add `original_parameters` JSONB field for Claude's initial extraction

  ### New Table: confirmation_decisions
  Tracks user decisions on tool execution confirmations for audit and learning.
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - User who made the decision
  - `tool_id` (uuid, foreign key) - Tool that was confirmed/rejected
  - `session_id` (uuid) - Chat session reference
  - `execution_log_id` (uuid, foreign key) - Related execution log
  - `original_parameters` (jsonb) - Parameters Claude extracted
  - `modified_parameters` (jsonb) - Parameters after user edits
  - `parameters_changed` (boolean) - Whether user modified parameters
  - `approval_status` (text) - approved, rejected, timeout
  - `modification_count` (integer) - Number of edits before approval
  - `decision_time_ms` (integer) - Time taken to make decision
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on confirmation_decisions table
  - Users can view and create their own confirmation decisions
  - Master admins can view all confirmation decisions for analytics

  ## Indexes
  - Index on user_id and created_at for user history queries
  - Index on tool_id for tool usage analytics
  - Index on approval_status for filtering

  ## Important Notes
  - All new fields are nullable to maintain backward compatibility
  - Existing data will not be affected
  - Metadata JSONB fields allow flexible schema evolution
  - Confirmation decisions are immutable once created
*/

-- Add new fields to chat_messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'intent'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN intent text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'intent_confidence'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN intent_confidence numeric(3,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add new fields to ai_tool_execution_logs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_tool_execution_logs' AND column_name = 'reasoning_text'
  ) THEN
    ALTER TABLE ai_tool_execution_logs ADD COLUMN reasoning_text text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_tool_execution_logs' AND column_name = 'confidence_score'
  ) THEN
    ALTER TABLE ai_tool_execution_logs ADD COLUMN confidence_score numeric(3,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_tool_execution_logs' AND column_name = 'parameters_edited'
  ) THEN
    ALTER TABLE ai_tool_execution_logs ADD COLUMN parameters_edited boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_tool_execution_logs' AND column_name = 'user_edit_details'
  ) THEN
    ALTER TABLE ai_tool_execution_logs ADD COLUMN user_edit_details jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_tool_execution_logs' AND column_name = 'original_parameters'
  ) THEN
    ALTER TABLE ai_tool_execution_logs ADD COLUMN original_parameters jsonb;
  END IF;
END $$;

-- Create confirmation_decisions table
CREATE TABLE IF NOT EXISTS confirmation_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES ai_tool_registry(id) ON DELETE CASCADE,
  session_id uuid,
  execution_log_id uuid REFERENCES ai_tool_execution_logs(id) ON DELETE SET NULL,
  original_parameters jsonb DEFAULT '{}'::jsonb,
  modified_parameters jsonb DEFAULT '{}'::jsonb,
  parameters_changed boolean DEFAULT false,
  approval_status text NOT NULL CHECK (approval_status IN ('approved', 'rejected', 'timeout', 'rephrased')),
  modification_count integer DEFAULT 0,
  decision_time_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for confirmation_decisions
CREATE INDEX IF NOT EXISTS idx_confirmation_decisions_user_id ON confirmation_decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_confirmation_decisions_tool_id ON confirmation_decisions(tool_id);
CREATE INDEX IF NOT EXISTS idx_confirmation_decisions_created_at ON confirmation_decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_confirmation_decisions_approval_status ON confirmation_decisions(approval_status);
CREATE INDEX IF NOT EXISTS idx_confirmation_decisions_session_id ON confirmation_decisions(session_id);

-- Create index for chat_messages metadata queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_metadata ON chat_messages USING gin(metadata);

-- Enable Row Level Security on confirmation_decisions
ALTER TABLE confirmation_decisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for confirmation_decisions
CREATE POLICY "Users can view their own confirmation decisions"
  ON confirmation_decisions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Master admins can view all confirmation decisions"
  ON confirmation_decisions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'master_admin'
    )
  );

CREATE POLICY "Users can create their own confirmation decisions"
  ON confirmation_decisions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE policies - confirmation decisions are immutable for audit purposes

-- Create function to calculate average decision time per tool
CREATE OR REPLACE FUNCTION get_tool_avg_decision_time(p_tool_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COALESCE(AVG(decision_time_ms)::integer, 0)
    FROM confirmation_decisions
    WHERE tool_id = p_tool_id
    AND approval_status = 'approved'
    AND decision_time_ms IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's confirmation preferences
CREATE OR REPLACE FUNCTION get_user_tool_confirmation_history(
  p_user_id uuid,
  p_tool_id uuid,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  approval_status text,
  parameters_changed boolean,
  modification_count integer,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cd.approval_status,
    cd.parameters_changed,
    cd.modification_count,
    cd.created_at
  FROM confirmation_decisions cd
  WHERE cd.user_id = p_user_id
  AND cd.tool_id = p_tool_id
  ORDER BY cd.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment on metadata field explaining structure
COMMENT ON COLUMN chat_messages.metadata IS 'Flexible metadata storage. Expected fields: tool_reasoning (text), parameter_confidence (object), parameters_modified (boolean), original_parameters (object), final_parameters (object), tool_enabled (boolean), tools_used (array), requires_confirmation (boolean), pending_confirmations (array)';

COMMENT ON COLUMN ai_tool_execution_logs.user_edit_details IS 'Tracks what parameters were changed: {field_name: {original: value, modified: value, reason: string}}';

COMMENT ON TABLE confirmation_decisions IS 'Immutable audit trail of user decisions on tool execution confirmations. Used for analytics and learning user preferences.';
