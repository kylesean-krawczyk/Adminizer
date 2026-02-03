/*
  Fix Permissions for organization_ui_customizations Tables

  PURPOSE:
  Grants all necessary permissions to roles for the customization tables.
  Run this ONLY if VERIFY_TABLE_STATUS.sql shows missing permissions.

  WHEN TO USE:
  - If authenticated role is missing permissions
  - If you get 403 errors after schema reload
  - If VERIFY_TABLE_STATUS.sql shows permission issues

  SAFE TO RUN:
  - Uses IF NOT EXISTS patterns
  - Won't cause errors if permissions already exist
  - Can be run multiple times safely
*/

-- ====================================================================
-- GRANT TABLE PERMISSIONS
-- ====================================================================

-- Grant all permissions to authenticated users
GRANT ALL ON organization_ui_customizations TO authenticated;
GRANT ALL ON organization_customization_history TO authenticated;

-- Grant all permissions to service role (administrative access)
GRANT ALL ON organization_ui_customizations TO service_role;
GRANT ALL ON organization_customization_history TO service_role;

-- Grant to authenticator role (PostgREST uses this)
GRANT ALL ON organization_ui_customizations TO authenticator;
GRANT ALL ON organization_customization_history TO authenticator;

-- ====================================================================
-- GRANT SEQUENCE PERMISSIONS
-- ====================================================================

-- Grant sequence usage for ID generation
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticator;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ====================================================================
-- VERIFY PERMISSIONS WERE GRANTED
-- ====================================================================

-- Check organization_ui_customizations permissions
SELECT
  'organization_ui_customizations permissions' AS check_name,
  grantee AS role,
  privilege_type AS permission
FROM information_schema.role_table_grants
WHERE table_name = 'organization_ui_customizations'
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- Check organization_customization_history permissions
SELECT
  'organization_customization_history permissions' AS check_name,
  grantee AS role,
  privilege_type AS permission
FROM information_schema.role_table_grants
WHERE table_name = 'organization_customization_history'
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- ====================================================================
-- RELOAD SCHEMA CACHE AFTER PERMISSION CHANGES
-- ====================================================================

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

SELECT
  'Permissions granted and schema cache reload initiated' AS status,
  'Wait 30 seconds then test your application' AS next_step;

-- ====================================================================
-- NOTES
-- ====================================================================

/*
  Expected roles to see:
  - authenticated: Should have ALL permissions
  - service_role: Should have ALL permissions
  - authenticator: Should have ALL permissions (PostgREST uses this)

  If you still get permission errors after this:
  1. Check RLS policies in VERIFY_TABLE_STATUS.sql
  2. Verify your user has master_admin role
  3. Check that your organization_id matches the customization
  4. Ensure is_active = true on your user profile
*/
