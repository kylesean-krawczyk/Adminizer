/*
  # Foreign Key Repair Strategies

  Multiple repair approaches for handling orphaned records with different tradeoffs.
  Choose the strategy that best fits your data recovery needs.

  IMPORTANT: Run FOREIGN_KEY_BACKUP_AND_SAFETY.sql FIRST!

  USAGE:
  1. Run diagnostic queries to understand scope of issues
  2. Create backups: SELECT fk_backups.backup_all_orphaned_records();
  3. Choose appropriate repair strategy below
  4. Execute chosen repair strategy
  5. Verify repairs with diagnostic queries
  6. If needed, rollback using backup functions

  STRATEGIES:
  - Strategy A: Assign to default/fallback organization
  - Strategy B: Soft delete (mark inactive)
  - Strategy C: Create temporary holding organization
  - Strategy D: Hard delete orphaned records
*/

-- ============================================================================
-- STRATEGY A: ASSIGN TO DEFAULT/FALLBACK ORGANIZATION
-- ============================================================================
-- DESCRIPTION: Creates a default organization and assigns orphaned records to it
-- PROS: No data loss, records remain accessible, easy to reassign later
-- CONS: May create confusion about which org records belong to
-- USE WHEN: You want to preserve all data and manually review later

-- A.1: Create or identify default organization
DO $$
DECLARE
  v_default_org_id uuid;
BEGIN
  -- Try to find existing default organization
  SELECT id INTO v_default_org_id
  FROM organizations
  WHERE name = 'Default Organization (Orphaned Records)'
  LIMIT 1;

  -- Create if it doesn't exist
  IF v_default_org_id IS NULL THEN
    INSERT INTO organizations (name, created_at, updated_at)
    VALUES ('Default Organization (Orphaned Records)', NOW(), NOW())
    RETURNING id INTO v_default_org_id;

    RAISE NOTICE 'Created default organization with ID: %', v_default_org_id;
  ELSE
    RAISE NOTICE 'Using existing default organization with ID: %', v_default_org_id;
  END IF;
END $$;

-- A.2: Function to repair user_profiles by assigning to default org
CREATE OR REPLACE FUNCTION repair_user_profiles_assign_default()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_default_org_id uuid;
  v_count integer;
BEGIN
  -- Get or create default organization
  SELECT id INTO v_default_org_id
  FROM organizations
  WHERE name = 'Default Organization (Orphaned Records)'
  LIMIT 1;

  IF v_default_org_id IS NULL THEN
    INSERT INTO organizations (name, created_at, updated_at)
    VALUES ('Default Organization (Orphaned Records)', NOW(), NOW())
    RETURNING id INTO v_default_org_id;
  END IF;

  -- Update orphaned user profiles
  UPDATE user_profiles
  SET
    organization_id = v_default_org_id,
    updated_at = NOW()
  WHERE organization_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM organizations WHERE id = user_profiles.organization_id
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'strategy', 'assign_to_default',
    'records_repaired', v_count,
    'default_org_id', v_default_org_id,
    'timestamp', NOW()
  );
END;
$$;

-- A.3: Function to repair all tables by assigning to default org
CREATE OR REPLACE FUNCTION repair_all_tables_assign_default()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_default_org_id uuid;
  v_results jsonb := '[]'::jsonb;
  v_count integer;
  v_total integer := 0;
BEGIN
  -- Get or create default organization
  SELECT id INTO v_default_org_id
  FROM organizations
  WHERE name = 'Default Organization (Orphaned Records)'
  LIMIT 1;

  IF v_default_org_id IS NULL THEN
    INSERT INTO organizations (name, created_at, updated_at)
    VALUES ('Default Organization (Orphaned Records)', NOW(), NOW())
    RETURNING id INTO v_default_org_id;
  END IF;

  -- Repair user_profiles
  UPDATE user_profiles SET organization_id = v_default_org_id, updated_at = NOW()
  WHERE organization_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = user_profiles.organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total := v_total + v_count;
  v_results := v_results || jsonb_build_object('table', 'user_profiles', 'repaired', v_count);

  -- Repair ai_page_context
  UPDATE ai_page_context SET organization_id = v_default_org_id
  WHERE organization_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = ai_page_context.organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total := v_total + v_count;
  v_results := v_results || jsonb_build_object('table', 'ai_page_context', 'repaired', v_count);

  -- Repair ai_notifications
  UPDATE ai_notifications SET organization_id = v_default_org_id
  WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE id = ai_notifications.organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total := v_total + v_count;
  v_results := v_results || jsonb_build_object('table', 'ai_notifications', 'repaired', v_count);

  -- Repair documents
  UPDATE documents SET organization_id = v_default_org_id, updated_at = NOW()
  WHERE organization_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = documents.organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total := v_total + v_count;
  v_results := v_results || jsonb_build_object('table', 'documents', 'repaired', v_count);

  -- Repair workflow_definitions
  UPDATE workflow_definitions SET organization_id = v_default_org_id
  WHERE organization_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = workflow_definitions.organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total := v_total + v_count;
  v_results := v_results || jsonb_build_object('table', 'workflow_definitions', 'repaired', v_count);

  -- Repair workflow_instances
  UPDATE workflow_instances SET organization_id = v_default_org_id
  WHERE organization_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = workflow_instances.organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total := v_total + v_count;
  v_results := v_results || jsonb_build_object('table', 'workflow_instances', 'repaired', v_count);

  -- Repair feature_flags
  UPDATE feature_flags SET organization_id = v_default_org_id
  WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE id = feature_flags.organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total := v_total + v_count;
  v_results := v_results || jsonb_build_object('table', 'feature_flags', 'repaired', v_count);

  -- Repair tool_configurations
  UPDATE tool_configurations SET organization_id = v_default_org_id
  WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE id = tool_configurations.organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total := v_total + v_count;
  v_results := v_results || jsonb_build_object('table', 'tool_configurations', 'repaired', v_count);

  RETURN jsonb_build_object(
    'success', true,
    'strategy', 'assign_to_default',
    'total_records_repaired', v_total,
    'default_org_id', v_default_org_id,
    'details', v_results,
    'timestamp', NOW()
  );
END;
$$;


-- ============================================================================
-- STRATEGY B: SOFT DELETE (MARK INACTIVE)
-- ============================================================================
-- DESCRIPTION: Marks orphaned records as inactive rather than deleting
-- PROS: No data loss, can be reactivated, maintains referential integrity
-- CONS: Inactive records may clutter queries if not filtered properly
-- USE WHEN: You want to hide orphaned data but keep it for historical purposes

-- B.1: Add is_orphaned flag to track orphaned records
DO $$
BEGIN
  -- Add column to user_profiles if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'is_orphaned'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_orphaned boolean DEFAULT false;
  END IF;
END $$;

-- B.2: Function to soft delete by marking as orphaned
CREATE OR REPLACE FUNCTION repair_user_profiles_soft_delete()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Mark orphaned profiles as inactive and orphaned
  UPDATE user_profiles
  SET
    is_active = false,
    is_orphaned = true,
    updated_at = NOW()
  WHERE organization_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM organizations WHERE id = user_profiles.organization_id
    )
    AND is_active = true;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'strategy', 'soft_delete',
    'records_deactivated', v_count,
    'timestamp', NOW()
  );
END;
$$;

-- B.3: Function to delete orphaned records that can't be soft deleted
CREATE OR REPLACE FUNCTION repair_delete_orphaned_non_user_records()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_results jsonb := '[]'::jsonb;
  v_count integer;
  v_total integer := 0;
BEGIN
  -- Delete orphaned ai_page_context (no user exists)
  DELETE FROM ai_page_context
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = ai_page_context.user_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total := v_total + v_count;
  v_results := v_results || jsonb_build_object('table', 'ai_page_context', 'deleted', v_count);

  -- Delete orphaned ai_tool_access_requests
  DELETE FROM ai_tool_access_requests
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = ai_tool_access_requests.user_id)
     OR NOT EXISTS (SELECT 1 FROM ai_tool_registry WHERE id = ai_tool_access_requests.tool_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total := v_total + v_count;
  v_results := v_results || jsonb_build_object('table', 'ai_tool_access_requests', 'deleted', v_count);

  -- Delete orphaned ai_notifications (no user or org exists)
  DELETE FROM ai_notifications
  WHERE (user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = ai_notifications.user_id))
     OR NOT EXISTS (SELECT 1 FROM organizations WHERE id = ai_notifications.organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total := v_total + v_count;
  v_results := v_results || jsonb_build_object('table', 'ai_notifications', 'deleted', v_count);

  RETURN jsonb_build_object(
    'success', true,
    'strategy', 'delete_orphaned',
    'total_records_deleted', v_total,
    'details', v_results,
    'timestamp', NOW()
  );
END;
$$;


-- ============================================================================
-- STRATEGY C: CREATE TEMPORARY HOLDING ORGANIZATION
-- ============================================================================
-- DESCRIPTION: Creates a dedicated "Needs Review" organization for manual processing
-- PROS: Clear separation, easy to review and reassign, maintains data
-- CONS: Requires manual intervention to properly reassign records
-- USE WHEN: You want to manually review each orphaned record before final decision

-- C.1: Create holding organization for manual review
CREATE OR REPLACE FUNCTION create_holding_organization()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_holding_org_id uuid;
BEGIN
  -- Try to find existing holding organization
  SELECT id INTO v_holding_org_id
  FROM organizations
  WHERE name = 'NEEDS REVIEW - Orphaned Records'
  LIMIT 1;

  -- Create if it doesn't exist
  IF v_holding_org_id IS NULL THEN
    INSERT INTO organizations (
      name,
      created_at,
      updated_at
    )
    VALUES (
      'NEEDS REVIEW - Orphaned Records',
      NOW(),
      NOW()
    )
    RETURNING id INTO v_holding_org_id;

    RAISE NOTICE 'Created holding organization with ID: %', v_holding_org_id;
  END IF;

  RETURN v_holding_org_id;
END;
$$;

-- C.2: Function to move orphaned records to holding organization
CREATE OR REPLACE FUNCTION repair_move_to_holding_org()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_holding_org_id uuid;
  v_results jsonb := '[]'::jsonb;
  v_count integer;
  v_total integer := 0;
BEGIN
  -- Get or create holding organization
  v_holding_org_id := create_holding_organization();

  -- Move orphaned user_profiles
  UPDATE user_profiles SET organization_id = v_holding_org_id, updated_at = NOW()
  WHERE organization_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = user_profiles.organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total := v_total + v_count;
  v_results := v_results || jsonb_build_object('table', 'user_profiles', 'moved', v_count);

  -- Move other tables (similar to Strategy A)
  UPDATE ai_notifications SET organization_id = v_holding_org_id
  WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE id = ai_notifications.organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total := v_total + v_count;
  v_results := v_results || jsonb_build_object('table', 'ai_notifications', 'moved', v_count);

  -- Create admin alert for manual review
  IF v_total > 0 THEN
    PERFORM log_profile_creation_failure(
      NULL,
      'system',
      format('%s orphaned records moved to holding organization for manual review', v_total),
      'ORPHANED_RECORDS_REQUIRE_REVIEW',
      0,
      jsonb_pretty(v_results)
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'strategy', 'move_to_holding',
    'total_records_moved', v_total,
    'holding_org_id', v_holding_org_id,
    'holding_org_name', 'NEEDS REVIEW - Orphaned Records',
    'details', v_results,
    'next_steps', 'Review records in holding organization and reassign to correct organizations',
    'timestamp', NOW()
  );
END;
$$;


-- ============================================================================
-- STRATEGY D: HARD DELETE ORPHANED RECORDS
-- ============================================================================
-- DESCRIPTION: Permanently deletes orphaned records from database
-- PROS: Clean database, no clutter, clear separation
-- CONS: PERMANENT DATA LOSS - cannot be recovered without backup
-- USE WHEN: You are certain orphaned data is not needed
-- WARNING: ONLY USE AFTER CREATING BACKUPS!

CREATE OR REPLACE FUNCTION repair_hard_delete_orphaned()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_results jsonb := '[]'::jsonb;
  v_count integer;
  v_total integer := 0;
  v_backup_result jsonb;
BEGIN
  -- SAFETY CHECK: Ensure backup exists
  IF NOT EXISTS (
    SELECT 1 FROM fk_backups.backup_metadata
    WHERE backup_timestamp > NOW() - INTERVAL '1 hour'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No recent backup found. Run fk_backups.backup_all_orphaned_records() first!',
      'safety_check', 'FAILED'
    );
  END IF;

  -- Delete orphaned user_profiles (extremely dangerous!)
  DELETE FROM user_profiles
  WHERE organization_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = user_profiles.organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total := v_total + v_count;
  v_results := v_results || jsonb_build_object('table', 'user_profiles', 'deleted', v_count);

  -- Delete orphaned ai_page_context
  DELETE FROM ai_page_context
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = ai_page_context.user_id)
     OR (organization_id IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = ai_page_context.organization_id));
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total := v_total + v_count;
  v_results := v_results || jsonb_build_object('table', 'ai_page_context', 'deleted', v_count);

  -- Delete orphaned ai_tool_access_requests
  DELETE FROM ai_tool_access_requests
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = ai_tool_access_requests.user_id)
     OR NOT EXISTS (SELECT 1 FROM ai_tool_registry WHERE id = ai_tool_access_requests.tool_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total := v_total + v_count;
  v_results := v_results || jsonb_build_object('table', 'ai_tool_access_requests', 'deleted', v_count);

  -- Delete orphaned ai_notifications
  DELETE FROM ai_notifications
  WHERE (user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = ai_notifications.user_id))
     OR NOT EXISTS (SELECT 1 FROM organizations WHERE id = ai_notifications.organization_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total := v_total + v_count;
  v_results := v_results || jsonb_build_object('table', 'ai_notifications', 'deleted', v_count);

  RETURN jsonb_build_object(
    'success', true,
    'strategy', 'hard_delete',
    'total_records_deleted', v_total,
    'details', v_results,
    'warning', 'Data has been permanently deleted. Use backup to restore if needed.',
    'timestamp', NOW()
  );
END;
$$;


-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION repair_user_profiles_assign_default TO authenticated;
GRANT EXECUTE ON FUNCTION repair_all_tables_assign_default TO authenticated;
GRANT EXECUTE ON FUNCTION repair_user_profiles_soft_delete TO authenticated;
GRANT EXECUTE ON FUNCTION repair_delete_orphaned_non_user_records TO authenticated;
GRANT EXECUTE ON FUNCTION create_holding_organization TO authenticated;
GRANT EXECUTE ON FUNCTION repair_move_to_holding_org TO authenticated;
GRANT EXECUTE ON FUNCTION repair_hard_delete_orphaned TO authenticated;


-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

/*
-- Example 1: Use Strategy A (assign to default org)
SELECT repair_all_tables_assign_default();

-- Example 2: Use Strategy B (soft delete)
SELECT repair_user_profiles_soft_delete();
SELECT repair_delete_orphaned_non_user_records();

-- Example 3: Use Strategy C (move to holding org for review)
SELECT repair_move_to_holding_org();

-- Example 4: Use Strategy D (hard delete - BE VERY CAREFUL!)
-- First, create backup:
SELECT fk_backups.backup_all_orphaned_records();
-- Then delete:
SELECT repair_hard_delete_orphaned();
*/
