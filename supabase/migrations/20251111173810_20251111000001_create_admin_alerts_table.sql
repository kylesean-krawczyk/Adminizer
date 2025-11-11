/*
  # Create Admin Alerts Table for Critical Failures

  1. New Tables
    - `admin_alerts`
      - `id` (uuid, primary key)
      - `alert_type` (text) - Type of alert (e.g., 'profile_creation_failure')
      - `severity` (text) - Alert severity level (info, warning, error, critical)
      - `user_id` (uuid) - ID of affected user (nullable)
      - `user_email` (text) - Email of affected user for reference
      - `error_message` (text) - Detailed error description
      - `error_code` (text) - Standardized error code
      - `stack_trace` (text) - Full error context (nullable)
      - `retry_count` (integer) - Number of attempts made
      - `metadata` (jsonb) - Additional context data
      - `created_at` (timestamptz) - When alert was created
      - `resolved_at` (timestamptz) - When alert was resolved (nullable)
      - `resolved_by` (uuid) - Admin who resolved the alert (nullable)
      - `resolution_notes` (text) - Notes about resolution (nullable)

  2. Security
    - Enable RLS on admin_alerts table
    - Only master_admin and admin roles can view alerts
    - Only master_admin can resolve alerts

  3. Indexes
    - Index on alert_type for filtering
    - Index on severity for priority sorting
    - Index on created_at for time-based queries
    - Index on resolved_at for filtering unresolved alerts
*/

-- Create admin_alerts table
CREATE TABLE IF NOT EXISTS admin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'error',
  user_id uuid,
  user_email text,
  error_message text NOT NULL,
  error_code text,
  stack_trace text,
  retry_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES user_profiles(id),
  resolution_notes text,
  CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'error', 'critical'))
);

-- Enable RLS
ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;

-- Admins can view all alerts
CREATE POLICY "Admins can view all alerts"
  ON admin_alerts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('master_admin', 'admin')
      AND is_active = true
    )
  );

-- Admins can create alerts (system will create them)
CREATE POLICY "System can create alerts"
  ON admin_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Master admins can resolve alerts
CREATE POLICY "Master admins can resolve alerts"
  ON admin_alerts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'master_admin'
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'master_admin'
      AND is_active = true
    )
  );

-- Service role can do everything (for triggers)
CREATE POLICY "Service role can manage alerts"
  ON admin_alerts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_alerts_type ON admin_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_severity ON admin_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_created_at ON admin_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_resolved ON admin_alerts(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_admin_alerts_user_id ON admin_alerts(user_id);

-- Create function to log profile creation failures
CREATE OR REPLACE FUNCTION log_profile_creation_failure(
  p_user_id uuid,
  p_user_email text,
  p_error_message text,
  p_error_code text,
  p_retry_count integer DEFAULT 0,
  p_stack_trace text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  alert_id uuid;
BEGIN
  INSERT INTO admin_alerts (
    alert_type,
    severity,
    user_id,
    user_email,
    error_message,
    error_code,
    stack_trace,
    retry_count,
    metadata
  )
  VALUES (
    'profile_creation_failure',
    'critical',
    p_user_id,
    p_user_email,
    p_error_message,
    p_error_code,
    p_stack_trace,
    p_retry_count,
    jsonb_build_object(
      'timestamp', NOW(),
      'source', 'profile_initialization'
    )
  )
  RETURNING id INTO alert_id;

  RAISE LOG 'Created admin alert % for user %', alert_id, p_user_email;

  RETURN alert_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION log_profile_creation_failure TO authenticated;
GRANT EXECUTE ON FUNCTION log_profile_creation_failure TO service_role;

-- Create function to resolve alerts
CREATE OR REPLACE FUNCTION resolve_admin_alert(
  p_alert_id uuid,
  p_resolution_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Check if current user is master_admin
  SELECT role INTO current_user_role
  FROM user_profiles
  WHERE id = auth.uid();

  IF current_user_role != 'master_admin' THEN
    RAISE EXCEPTION 'Only master admins can resolve alerts';
  END IF;

  UPDATE admin_alerts
  SET
    resolved_at = NOW(),
    resolved_by = auth.uid(),
    resolution_notes = p_resolution_notes
  WHERE id = p_alert_id
  AND resolved_at IS NULL;

  RETURN FOUND;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION resolve_admin_alert TO authenticated;

-- Create function to get unresolved alert count
CREATE OR REPLACE FUNCTION get_unresolved_alert_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  alert_count integer;
  current_user_role text;
BEGIN
  -- Check if current user is admin or master_admin
  SELECT role INTO current_user_role
  FROM user_profiles
  WHERE id = auth.uid();

  IF current_user_role NOT IN ('master_admin', 'admin') THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*)::integer INTO alert_count
  FROM admin_alerts
  WHERE resolved_at IS NULL;

  RETURN alert_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_unresolved_alert_count TO authenticated;

COMMENT ON TABLE admin_alerts IS 'Stores critical system alerts for administrator review';
COMMENT ON FUNCTION log_profile_creation_failure IS 'Logs profile creation failures as critical admin alerts';
COMMENT ON FUNCTION resolve_admin_alert IS 'Marks an alert as resolved by the current admin';
COMMENT ON FUNCTION get_unresolved_alert_count IS 'Returns count of unresolved alerts for current admin';
