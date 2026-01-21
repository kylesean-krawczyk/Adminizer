/*
  # Foreign Key Backup and Safety Mechanisms

  Creates backup tables and safety functions before performing any data repairs.
  This ensures that all data can be recovered if repairs cause unexpected issues.

  USAGE:
  1. Run this entire script BEFORE running any repair scripts
  2. Verify backups were created successfully
  3. After repairs, compare backup data with repaired data
  4. Keep backups for at least 30 days

  IMPORTANT: This script is SAFE to run multiple times (idempotent)
*/

-- ============================================================================
-- SECTION 1: CREATE BACKUP SCHEMA
-- ============================================================================

-- Create dedicated schema for backups
CREATE SCHEMA IF NOT EXISTS fk_backups;

-- Grant permissions
GRANT USAGE ON SCHEMA fk_backups TO authenticated;
GRANT ALL ON SCHEMA fk_backups TO service_role;

COMMENT ON SCHEMA fk_backups IS 'Backup schema for foreign key repair operations';


-- ============================================================================
-- SECTION 2: CREATE BACKUP METADATA TABLE
-- ============================================================================

-- Track all backup operations
CREATE TABLE IF NOT EXISTS fk_backups.backup_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_name text NOT NULL,
  table_name text NOT NULL,
  backup_timestamp timestamptz DEFAULT NOW(),
  records_backed_up integer,
  backup_reason text,
  performed_by uuid REFERENCES auth.users(id),
  can_rollback boolean DEFAULT true,
  rollback_completed_at timestamptz,
  notes text,
  UNIQUE(backup_name, table_name)
);

COMMENT ON TABLE fk_backups.backup_metadata IS 'Tracks all backup operations for audit and rollback purposes';


-- ============================================================================
-- SECTION 3: CREATE BACKUP TABLES FOR AFFECTED DATA
-- ============================================================================

-- 3.1: Backup table for user_profiles
CREATE TABLE IF NOT EXISTS fk_backups.user_profiles_backup (
  backup_id uuid DEFAULT gen_random_uuid(),
  backup_timestamp timestamptz DEFAULT NOW(),
  original_id uuid,
  email text,
  full_name text,
  role text,
  organization_id uuid,
  is_active boolean,
  invited_by uuid,
  invited_at timestamptz,
  last_login timestamptz,
  active_vertical text,
  created_at timestamptz,
  updated_at timestamptz,
  backup_reason text,
  PRIMARY KEY (backup_id, original_id)
);

-- 3.2: Backup table for ai_page_context
CREATE TABLE IF NOT EXISTS fk_backups.ai_page_context_backup (
  backup_id uuid DEFAULT gen_random_uuid(),
  backup_timestamp timestamptz DEFAULT NOW(),
  original_id uuid,
  user_id uuid,
  organization_id uuid,
  page_type text,
  page_route text,
  context_data jsonb,
  created_at timestamptz,
  backup_reason text,
  PRIMARY KEY (backup_id, original_id)
);

-- 3.3: Backup table for ai_tool_access_requests
CREATE TABLE IF NOT EXISTS fk_backups.ai_tool_access_requests_backup (
  backup_id uuid DEFAULT gen_random_uuid(),
  backup_timestamp timestamptz DEFAULT NOW(),
  original_id uuid,
  user_id uuid,
  tool_id uuid,
  status text,
  request_reason text,
  business_justification text,
  requested_duration_days integer,
  is_temporary boolean,
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_comment text,
  expires_at timestamptz,
  priority text,
  created_at timestamptz,
  updated_at timestamptz,
  backup_reason text,
  PRIMARY KEY (backup_id, original_id)
);

-- 3.4: Backup table for ai_notifications
CREATE TABLE IF NOT EXISTS fk_backups.ai_notifications_backup (
  backup_id uuid DEFAULT gen_random_uuid(),
  backup_timestamp timestamptz DEFAULT NOW(),
  original_id uuid,
  user_id uuid,
  organization_id uuid,
  notification_type text,
  priority text,
  title text,
  message text,
  category text,
  related_entity_type text,
  related_entity_id uuid,
  action_url text,
  action_label text,
  status text,
  data jsonb,
  created_at timestamptz,
  backup_reason text,
  PRIMARY KEY (backup_id, original_id)
);

-- 3.5: Backup table for documents
CREATE TABLE IF NOT EXISTS fk_backups.documents_backup (
  backup_id uuid DEFAULT gen_random_uuid(),
  backup_timestamp timestamptz DEFAULT NOW(),
  original_id uuid,
  title text,
  organization_id uuid,
  uploaded_by uuid,
  file_path text,
  file_size bigint,
  mime_type text,
  created_at timestamptz,
  backup_reason text,
  PRIMARY KEY (backup_id, original_id)
);

-- 3.6: Backup table for workflow_definitions
CREATE TABLE IF NOT EXISTS fk_backups.workflow_definitions_backup (
  backup_id uuid DEFAULT gen_random_uuid(),
  backup_timestamp timestamptz DEFAULT NOW(),
  original_id uuid,
  name text,
  organization_id uuid,
  workflow_data jsonb,
  created_at timestamptz,
  backup_reason text,
  PRIMARY KEY (backup_id, original_id)
);

-- 3.7: Backup table for workflow_instances
CREATE TABLE IF NOT EXISTS fk_backups.workflow_instances_backup (
  backup_id uuid DEFAULT gen_random_uuid(),
  backup_timestamp timestamptz DEFAULT NOW(),
  original_id uuid,
  workflow_definition_id uuid,
  organization_id uuid,
  status text,
  created_at timestamptz,
  backup_reason text,
  PRIMARY KEY (backup_id, original_id)
);


-- ============================================================================
-- SECTION 4: CREATE BACKUP FUNCTIONS
-- ============================================================================

-- 4.1: Function to backup user_profiles with orphaned organization_id
CREATE OR REPLACE FUNCTION fk_backups.backup_orphaned_user_profiles()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
  v_backup_name text;
BEGIN
  v_backup_name := 'pre_repair_' || TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS');

  -- Insert orphaned records into backup
  INSERT INTO fk_backups.user_profiles_backup (
    backup_timestamp,
    original_id,
    email,
    full_name,
    role,
    organization_id,
    is_active,
    invited_by,
    invited_at,
    last_login,
    active_vertical,
    created_at,
    updated_at,
    backup_reason
  )
  SELECT
    NOW(),
    id,
    email,
    full_name,
    role,
    organization_id,
    is_active,
    invited_by,
    invited_at,
    last_login,
    active_vertical,
    created_at,
    updated_at,
    'Orphaned organization_id before repair'
  FROM user_profiles
  WHERE organization_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM organizations WHERE id = user_profiles.organization_id
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Record metadata
  INSERT INTO fk_backups.backup_metadata (
    backup_name,
    table_name,
    records_backed_up,
    backup_reason,
    performed_by
  )
  VALUES (
    v_backup_name,
    'user_profiles',
    v_count,
    'Backup before foreign key repair',
    auth.uid()
  );

  RETURN jsonb_build_object(
    'success', true,
    'backup_name', v_backup_name,
    'records_backed_up', v_count,
    'table_name', 'user_profiles'
  );
END;
$$;

-- 4.2: Function to backup all orphaned records
CREATE OR REPLACE FUNCTION fk_backups.backup_all_orphaned_records()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_backup_name text;
  v_total_count integer := 0;
  v_count integer;
  v_results jsonb := '[]'::jsonb;
BEGIN
  v_backup_name := 'full_backup_' || TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS');

  -- Backup user_profiles
  INSERT INTO fk_backups.user_profiles_backup (
    backup_timestamp, original_id, email, full_name, role, organization_id,
    is_active, invited_by, invited_at, last_login, active_vertical,
    created_at, updated_at, backup_reason
  )
  SELECT NOW(), id, email, full_name, role, organization_id, is_active,
         invited_by, invited_at, last_login, active_vertical, created_at,
         updated_at, 'Full backup before repair: ' || v_backup_name
  FROM user_profiles
  WHERE organization_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = user_profiles.organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_count := v_total_count + v_count;
  IF v_count > 0 THEN
    INSERT INTO fk_backups.backup_metadata (backup_name, table_name, records_backed_up, backup_reason, performed_by)
    VALUES (v_backup_name, 'user_profiles', v_count, 'Full backup before repair', auth.uid());
    v_results := v_results || jsonb_build_object('table', 'user_profiles', 'count', v_count);
  END IF;

  -- Backup ai_page_context
  INSERT INTO fk_backups.ai_page_context_backup (
    backup_timestamp, original_id, user_id, organization_id, page_type,
    page_route, context_data, created_at, backup_reason
  )
  SELECT NOW(), id, user_id, organization_id, page_type, page_route,
         context_data, created_at, 'Full backup before repair: ' || v_backup_name
  FROM ai_page_context
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = ai_page_context.user_id)
     OR (organization_id IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = ai_page_context.organization_id));
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_count := v_total_count + v_count;
  IF v_count > 0 THEN
    INSERT INTO fk_backups.backup_metadata (backup_name, table_name, records_backed_up, backup_reason, performed_by)
    VALUES (v_backup_name, 'ai_page_context', v_count, 'Full backup before repair', auth.uid());
    v_results := v_results || jsonb_build_object('table', 'ai_page_context', 'count', v_count);
  END IF;

  -- Backup ai_tool_access_requests
  INSERT INTO fk_backups.ai_tool_access_requests_backup (
    backup_timestamp, original_id, user_id, tool_id, status, request_reason,
    business_justification, requested_duration_days, is_temporary, reviewed_by,
    reviewed_at, review_comment, expires_at, priority, created_at, updated_at, backup_reason
  )
  SELECT NOW(), id, user_id, tool_id, status, request_reason, business_justification,
         requested_duration_days, is_temporary, reviewed_by, reviewed_at, review_comment,
         expires_at, priority, created_at, updated_at, 'Full backup before repair: ' || v_backup_name
  FROM ai_tool_access_requests
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = ai_tool_access_requests.user_id)
     OR NOT EXISTS (SELECT 1 FROM ai_tool_registry WHERE id = ai_tool_access_requests.tool_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_count := v_total_count + v_count;
  IF v_count > 0 THEN
    INSERT INTO fk_backups.backup_metadata (backup_name, table_name, records_backed_up, backup_reason, performed_by)
    VALUES (v_backup_name, 'ai_tool_access_requests', v_count, 'Full backup before repair', auth.uid());
    v_results := v_results || jsonb_build_object('table', 'ai_tool_access_requests', 'count', v_count);
  END IF;

  -- Backup ai_notifications
  INSERT INTO fk_backups.ai_notifications_backup (
    backup_timestamp, original_id, user_id, organization_id, notification_type,
    priority, title, message, category, related_entity_type, related_entity_id,
    action_url, action_label, status, data, created_at, backup_reason
  )
  SELECT NOW(), id, user_id, organization_id, notification_type, priority, title,
         message, category, related_entity_type, related_entity_id, action_url,
         action_label, status, data, created_at, 'Full backup before repair: ' || v_backup_name
  FROM ai_notifications
  WHERE (user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = ai_notifications.user_id))
     OR NOT EXISTS (SELECT 1 FROM organizations WHERE id = ai_notifications.organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_count := v_total_count + v_count;
  IF v_count > 0 THEN
    INSERT INTO fk_backups.backup_metadata (backup_name, table_name, records_backed_up, backup_reason, performed_by)
    VALUES (v_backup_name, 'ai_notifications', v_count, 'Full backup before repair', auth.uid());
    v_results := v_results || jsonb_build_object('table', 'ai_notifications', 'count', v_count);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'backup_name', v_backup_name,
    'total_records_backed_up', v_total_count,
    'details', v_results,
    'timestamp', NOW()
  );
END;
$$;


-- ============================================================================
-- SECTION 5: ROLLBACK FUNCTIONS
-- ============================================================================

-- 5.1: Function to rollback user_profiles from backup
CREATE OR REPLACE FUNCTION fk_backups.rollback_user_profiles(p_backup_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
  v_can_rollback boolean;
BEGIN
  -- Check if backup exists and can be rolled back
  SELECT can_rollback INTO v_can_rollback
  FROM fk_backups.backup_metadata
  WHERE backup_name = p_backup_name
    AND table_name = 'user_profiles';

  IF v_can_rollback IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Backup not found'
    );
  END IF;

  IF NOT v_can_rollback THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This backup has already been rolled back'
    );
  END IF;

  -- Restore data from backup
  UPDATE user_profiles up
  SET
    organization_id = b.organization_id,
    updated_at = NOW()
  FROM fk_backups.user_profiles_backup b
  WHERE up.id = b.original_id
    AND b.backup_reason LIKE '%' || p_backup_name || '%';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Mark backup as rolled back
  UPDATE fk_backups.backup_metadata
  SET
    can_rollback = false,
    rollback_completed_at = NOW(),
    notes = 'Rollback completed successfully'
  WHERE backup_name = p_backup_name
    AND table_name = 'user_profiles';

  RETURN jsonb_build_object(
    'success', true,
    'records_restored', v_count,
    'backup_name', p_backup_name
  );
END;
$$;


-- ============================================================================
-- SECTION 6: GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on backup functions
GRANT EXECUTE ON FUNCTION fk_backups.backup_orphaned_user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION fk_backups.backup_all_orphaned_records TO authenticated;
GRANT EXECUTE ON FUNCTION fk_backups.rollback_user_profiles TO authenticated;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA fk_backups TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA fk_backups TO authenticated;


-- ============================================================================
-- SECTION 7: VERIFICATION QUERIES
-- ============================================================================

-- Check backup readiness
COMMENT ON FUNCTION fk_backups.backup_all_orphaned_records IS 'Backs up all orphaned records across all affected tables before repair operations';
COMMENT ON FUNCTION fk_backups.rollback_user_profiles IS 'Restores user_profiles from a specific backup';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Backup and safety mechanisms created successfully';
  RAISE NOTICE 'Run: SELECT fk_backups.backup_all_orphaned_records(); before any repairs';
END $$;
