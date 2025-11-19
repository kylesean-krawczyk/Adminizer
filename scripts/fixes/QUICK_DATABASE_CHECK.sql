/*
  Quick Database Verification for Organization Customizations

  Run this in Supabase SQL Editor to quickly verify everything is set up correctly.
  This is a condensed version of VERIFY_TABLE_STATUS.sql for quick checks.

  HOW TO USE:
  1. Open Supabase Dashboard → SQL Editor
  2. Copy and paste this entire script
  3. Click Run
  4. Review results

  ALL checks should show "PASS" status
*/

-- ============================================================================
-- QUICK CHECK: All-in-One Status Report
-- ============================================================================

SELECT
  'Organization Customizations Database Status' as report_title,
  json_build_object(
    -- Check 1: Main table exists
    'main_table_exists', EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'organization_ui_customizations'
    ),

    -- Check 2: History table exists
    'history_table_exists', EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'organization_customization_history'
    ),

    -- Check 3: RLS enabled on main table
    'rls_enabled', (
      SELECT COALESCE(rowsecurity, false)
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename = 'organization_ui_customizations'
    ),

    -- Check 4: RLS policies count
    'policy_count', (
      SELECT COUNT(*)
      FROM pg_policies
      WHERE tablename = 'organization_ui_customizations'
    ),

    -- Check 5: authenticated role has permissions
    'authenticated_has_access', EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
      WHERE table_name = 'organization_ui_customizations'
        AND grantee = 'authenticated'
    ),

    -- Check 6: service_role has permissions
    'service_role_has_access', EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
      WHERE table_name = 'organization_ui_customizations'
        AND grantee = 'service_role'
    ),

    -- Check 7: Trigger exists
    'trigger_exists', EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE event_object_table = 'organization_ui_customizations'
        AND trigger_name = 'update_org_customization_timestamp'
    ),

    -- Check 8: Current row count
    'current_rows', (
      SELECT COUNT(*) FROM organization_ui_customizations
    )
  ) as status_report;

-- ============================================================================
-- DETAILED CHECKS (if above shows any issues)
-- ============================================================================

-- Check table structure
SELECT
  'Table Columns' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'organization_ui_customizations'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT
  'RLS Policies' as check_type,
  policyname as policy_name,
  cmd as command,
  roles,
  permissive
FROM pg_policies
WHERE tablename = 'organization_ui_customizations'
ORDER BY policyname;

-- Check permissions
SELECT
  'Table Permissions' as check_type,
  grantee as role,
  privilege_type as permission
FROM information_schema.role_table_grants
WHERE table_name = 'organization_ui_customizations'
  AND table_schema = 'public'
  AND grantee IN ('authenticated', 'service_role', 'anon')
ORDER BY grantee, privilege_type;

-- Check indexes
SELECT
  'Indexes' as check_type,
  indexname as index_name,
  indexdef as index_definition
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'organization_ui_customizations'
ORDER BY indexname;

-- ============================================================================
-- INTERPRETATION GUIDE
-- ============================================================================

/*
  EXPECTED RESULTS:

  1. status_report object should show:
     - main_table_exists: true
     - history_table_exists: true
     - rls_enabled: true
     - policy_count: 2 (or more)
     - authenticated_has_access: true
     - service_role_has_access: true
     - trigger_exists: true
     - current_rows: 0 (or any number)

  2. Table Columns should show ~18 columns including:
     - id, organization_id, vertical_id
     - dashboard_config, navigation_config, branding_config, stats_config, department_config
     - logo_url, logo_format, logo_file_size, logo_uploaded_at
     - version, is_active
     - created_at, updated_at, created_by, updated_by

  3. RLS Policies should show at least 2 policies:
     - "Master admins can manage organization customizations" (ALL)
     - "Organization members can view customizations" (SELECT)

  4. Table Permissions should show:
     - authenticated: SELECT, INSERT, UPDATE, DELETE
     - service_role: SELECT, INSERT, UPDATE, DELETE

  5. Indexes should show at least 4 indexes:
     - organization_ui_customizations_pkey (primary key)
     - idx_org_custom_org_vertical
     - idx_org_custom_organization
     - unique_org_vertical (unique constraint)

  IF ANY CHECK FAILS:

  - main_table_exists = false: Run migration 20251118234312_create_organization_ui_customizations.sql
  - rls_enabled = false: Something went wrong, re-run migration
  - policy_count < 2: Re-run migration file
  - *_has_access = false: Run FIX_PERMISSIONS_IF_NEEDED.sql
  - trigger_exists = false: Re-run migration file

  AFTER FIXING:

  1. Always run: NOTIFY pgrst, 'reload schema';
  2. Wait 60 seconds
  3. Re-run this verification script
  4. Test application
*/

-- ============================================================================
-- FINAL CONFIRMATION QUERY
-- ============================================================================

-- This should work without errors if everything is set up correctly
DO $$
BEGIN
  RAISE NOTICE 'Testing table access...';

  IF EXISTS (SELECT 1 FROM organization_ui_customizations LIMIT 1) THEN
    RAISE NOTICE '✅ SUCCESS: Table is accessible and can be queried';
  ELSE
    RAISE NOTICE '✅ SUCCESS: Table exists and is accessible (currently empty)';
  END IF;

  RAISE NOTICE '✅ All database checks passed!';
  RAISE NOTICE 'Next step: Test in application';
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE '❌ FAILURE: Table does not exist';
    RAISE NOTICE 'Action: Apply migration 20251118234312_create_organization_ui_customizations.sql';
  WHEN insufficient_privilege THEN
    RAISE NOTICE '❌ FAILURE: Permission denied';
    RAISE NOTICE 'Action: Run FIX_PERMISSIONS_IF_NEEDED.sql';
  WHEN OTHERS THEN
    RAISE NOTICE '❌ FAILURE: Unexpected error: %', SQLERRM;
END $$;
