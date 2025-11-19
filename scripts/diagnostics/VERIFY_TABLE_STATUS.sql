/*
  Comprehensive Diagnostic Script for organization_ui_customizations Table

  Run this in Supabase SQL Editor to verify table status and permissions

  Expected Results:
  - All queries should execute successfully
  - Table should exist
  - RLS should be enabled
  - Policies should be present
  - Permissions should be granted
*/

-- ====================================================================
-- SECTION 1: TABLE EXISTENCE VERIFICATION
-- ====================================================================

-- Query 1: Does the table exist?
SELECT
  'organization_ui_customizations table exists' AS check_name,
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'organization_ui_customizations'
  ) AS status,
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'organization_ui_customizations'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL - Table does not exist'
  END AS result;

-- Query 2: Does the history table exist?
SELECT
  'organization_customization_history table exists' AS check_name,
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'organization_customization_history'
  ) AS status,
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'organization_customization_history'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL - History table does not exist'
  END AS result;

-- ====================================================================
-- SECTION 2: TABLE STRUCTURE VERIFICATION
-- ====================================================================

-- Query 3: List all columns in organization_ui_customizations
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns
WHERE table_name = 'organization_ui_customizations'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Expected columns: id, organization_id, vertical_id, dashboard_config,
-- navigation_config, branding_config, stats_config, department_config,
-- logo_url, logo_format, logo_file_size, logo_uploaded_at,
-- version, is_active, created_at, updated_at, created_by, updated_by

-- ====================================================================
-- SECTION 3: ROW LEVEL SECURITY VERIFICATION
-- ====================================================================

-- Query 4: Is RLS enabled on main table?
SELECT
  'RLS enabled on organization_ui_customizations' AS check_name,
  rowsecurity AS status,
  CASE
    WHEN rowsecurity = true THEN '✅ PASS'
    ELSE '❌ FAIL - RLS not enabled'
  END AS result
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'organization_ui_customizations';

-- Query 5: Is RLS enabled on history table?
SELECT
  'RLS enabled on organization_customization_history' AS check_name,
  rowsecurity AS status,
  CASE
    WHEN rowsecurity = true THEN '✅ PASS'
    ELSE '❌ FAIL - RLS not enabled'
  END AS result
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'organization_customization_history';

-- ====================================================================
-- SECTION 4: RLS POLICIES VERIFICATION
-- ====================================================================

-- Query 6: List all RLS policies on organization_ui_customizations
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'organization_ui_customizations'
ORDER BY policyname;

-- Expected policies:
-- 1. "Master admins can manage organization customizations" - ALL
-- 2. "Organization members can view customizations" - SELECT

-- Query 7: List all RLS policies on organization_customization_history
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS command
FROM pg_policies
WHERE tablename = 'organization_customization_history'
ORDER BY policyname;

-- Expected policies:
-- 1. "Master admins can manage customization history" - ALL
-- 2. "Organization members can view customization history" - SELECT

-- ====================================================================
-- SECTION 5: PERMISSIONS VERIFICATION
-- ====================================================================

-- Query 8: Check table permissions for organization_ui_customizations
SELECT
  grantee AS role,
  privilege_type AS permission,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'organization_ui_customizations'
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- Expected permissions:
-- - authenticated: ALL privileges
-- - service_role: ALL privileges
-- - May also see: authenticator, anon

-- Query 9: Check table permissions for organization_customization_history
SELECT
  grantee AS role,
  privilege_type AS permission,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'organization_customization_history'
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- ====================================================================
-- SECTION 6: INDEXES VERIFICATION
-- ====================================================================

-- Query 10: List all indexes on organization_ui_customizations
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'organization_ui_customizations'
ORDER BY indexname;

-- Expected indexes:
-- - organization_ui_customizations_pkey (primary key on id)
-- - idx_org_custom_org_vertical
-- - idx_org_custom_organization
-- - unique_org_vertical (unique constraint index)

-- Query 11: List all indexes on organization_customization_history
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'organization_customization_history'
ORDER BY indexname;

-- ====================================================================
-- SECTION 7: CONSTRAINTS VERIFICATION
-- ====================================================================

-- Query 12: List all constraints on organization_ui_customizations
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  CASE contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'c' THEN 'CHECK'
    ELSE contype::text
  END AS constraint_type_label
FROM pg_constraint
WHERE conrelid = 'organization_ui_customizations'::regclass
ORDER BY contype, conname;

-- ====================================================================
-- SECTION 8: FOREIGN KEY RELATIONSHIPS
-- ====================================================================

-- Query 13: Check foreign key relationships
SELECT
  tc.constraint_name,
  tc.table_name AS from_table,
  kcu.column_name AS from_column,
  ccu.table_name AS to_table,
  ccu.column_name AS to_column,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'organization_ui_customizations'
ORDER BY tc.constraint_name;

-- Expected foreign keys:
-- - organization_id → organizations(id) ON DELETE CASCADE
-- - created_by → user_profiles(id)
-- - updated_by → user_profiles(id)

-- ====================================================================
-- SECTION 9: TRIGGERS AND FUNCTIONS
-- ====================================================================

-- Query 14: List triggers on organization_ui_customizations
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'organization_ui_customizations'
AND trigger_schema = 'public'
ORDER BY trigger_name;

-- Expected trigger:
-- - update_org_customization_timestamp (BEFORE UPDATE)

-- Query 15: Verify timestamp function exists
SELECT
  'update_organization_customization_timestamp function exists' AS check_name,
  EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'update_organization_customization_timestamp'
  ) AS status,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = 'update_organization_customization_timestamp'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL - Function does not exist'
  END AS result;

-- ====================================================================
-- SECTION 10: DATA VERIFICATION
-- ====================================================================

-- Query 16: Count rows in organization_ui_customizations
SELECT
  'organization_ui_customizations row count' AS check_name,
  COUNT(*) AS row_count
FROM organization_ui_customizations;

-- Query 17: Count rows in organization_customization_history
SELECT
  'organization_customization_history row count' AS check_name,
  COUNT(*) AS row_count
FROM organization_customization_history;

-- Query 18: Sample data from organization_ui_customizations (if any)
SELECT
  id,
  organization_id,
  vertical_id,
  version,
  is_active,
  created_at,
  updated_at
FROM organization_ui_customizations
ORDER BY created_at DESC
LIMIT 5;

-- ====================================================================
-- SECTION 11: SEQUENCE PERMISSIONS
-- ====================================================================

-- Query 19: Verify sequence permissions
SELECT
  r.rolname AS role,
  'organization_ui_customizations_id_seq' AS sequence_name,
  has_sequence_privilege(r.rolname, 'organization_ui_customizations_id_seq'::regclass, 'USAGE') AS has_usage,
  has_sequence_privilege(r.rolname, 'organization_ui_customizations_id_seq'::regclass, 'SELECT') AS has_select
FROM pg_roles r
WHERE r.rolname IN ('authenticator', 'authenticated', 'service_role', 'anon')
ORDER BY r.rolname;

-- ====================================================================
-- DIAGNOSTIC SUMMARY
-- ====================================================================

-- Query 20: Overall health check
SELECT
  'Overall Diagnostic Summary' AS summary,
  json_build_object(
    'table_exists', EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'organization_ui_customizations'
    ),
    'rls_enabled', (
      SELECT rowsecurity FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename = 'organization_ui_customizations'
    ),
    'policy_count', (
      SELECT COUNT(*) FROM pg_policies
      WHERE tablename = 'organization_ui_customizations'
    ),
    'authenticated_has_permissions', EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
      WHERE table_name = 'organization_ui_customizations'
      AND grantee = 'authenticated'
    ),
    'row_count', (
      SELECT COUNT(*) FROM organization_ui_customizations
    )
  ) AS health_status;

-- ====================================================================
-- INSTRUCTIONS
-- ====================================================================

/*
  HOW TO USE THIS SCRIPT:

  1. Copy this entire SQL script
  2. Go to Supabase Dashboard → SQL Editor
  3. Paste the script
  4. Click "Run"
  5. Review all results

  WHAT TO LOOK FOR:

  ✅ All "status" columns should be TRUE
  ✅ All "result" columns should show "✅ PASS"
  ✅ RLS should be enabled (true)
  ✅ At least 2 policies should exist on each table
  ✅ authenticated and service_role should have ALL permissions

  IF ANY CHECK FAILS:

  - Note which query failed
  - Share the results with support
  - This indicates a migration issue, not a cache issue

  IF ALL CHECKS PASS:

  - The table is correctly configured
  - Issue is definitely a PostgREST cache problem
  - Proceed with schema cache reload
*/
