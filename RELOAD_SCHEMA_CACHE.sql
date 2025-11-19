/*
  Supabase PostgREST Schema Cache Reload Script

  PURPOSE:
  Forces PostgREST to reload its schema cache and recognize the
  organization_ui_customizations table that was recently created.

  WHEN TO USE:
  - After creating new tables via migrations
  - When getting PGRST205 "table not found in schema cache" errors
  - After any DDL changes (CREATE, ALTER, DROP)

  HOW TO USE:
  1. Copy this entire script
  2. Open Supabase Dashboard → SQL Editor
  3. Paste and run this script
  4. Wait 15-30 seconds
  5. Test your application

  SUCCESS INDICATOR:
  - No error messages when running this script
  - Application requests to the table return 200 instead of 404
*/

-- ====================================================================
-- RELOAD POSTGREST SCHEMA CACHE
-- ====================================================================

-- Send notification to PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- ====================================================================
-- VERIFICATION QUERY
-- ====================================================================

-- Wait a moment, then test if table is accessible
-- Run this query 30 seconds AFTER running the NOTIFY command above

SELECT
  'Schema reload initiated' AS status,
  'Wait 30 seconds then test your application' AS next_step,
  'If still broken, run this script again or reload from Dashboard' AS troubleshooting;

-- ====================================================================
-- POST-RELOAD TEST QUERIES
-- ====================================================================

-- After 30 seconds, run these queries to verify table is accessible:

-- Test 1: Simple SELECT (should work without errors)
-- SELECT * FROM organization_ui_customizations LIMIT 1;

-- Test 2: Check if table appears in PostgREST's exposed tables
-- SELECT * FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name = 'organization_ui_customizations';

-- ====================================================================
-- ADDITIONAL CACHE RELOAD METHODS
-- ====================================================================

/*
  METHOD 1: Supabase Dashboard (Recommended)
  -------------------------------------------
  1. Go to Settings → API
  2. Find "Schema Cache" section
  3. Click "Reload schema" button
  4. Wait 30 seconds
  5. Test application


  METHOD 2: SQL Command (Current Method)
  ---------------------------------------
  Run the NOTIFY command above
  This sends a signal to PostgREST to reload


  METHOD 3: Project Restart (Last Resort)
  ----------------------------------------
  1. Go to Settings → General
  2. Click "Pause project"
  3. Wait 30 seconds
  4. Click "Resume project"
  5. Wait 2-3 minutes
  6. Test application


  METHOD 4: API Endpoint (Advanced)
  ----------------------------------
  Send POST request to PostgREST reload endpoint:
  POST https://[project-ref].supabase.co/rest/v1/rpc/reload_schema
  Headers: apikey: [your-service-role-key]
*/

-- ====================================================================
-- TROUBLESHOOTING
-- ====================================================================

/*
  ISSUE: Still getting PGRST205 after reload
  ------------------------------------------
  1. Wait 2-3 minutes (propagation can take time)
  2. Run this script again
  3. Clear browser cache
  4. Try incognito window
  5. Check Supabase status page


  ISSUE: Getting 403 Permission Denied instead
  ---------------------------------------------
  1. This means cache is reloaded (good!)
  2. But RLS policies are blocking access
  3. Run VERIFY_TABLE_STATUS.sql to check policies
  4. Verify you're logged in as master_admin


  ISSUE: Getting different error
  -------------------------------
  1. Note the exact error code
  2. Run VERIFY_TABLE_STATUS.sql
  3. Share results with support
*/

-- ====================================================================
-- EXPECTED TIMELINE
-- ====================================================================

/*
  0 seconds  - Run NOTIFY command
  5 seconds  - PostgREST receives notification
  15 seconds - Schema cache begins reloading
  30 seconds - Cache reload complete
  60 seconds - All changes propagated

  TOTAL TIME: Usually 30-60 seconds
*/

-- ====================================================================
-- CONFIRMATION QUERY
-- ====================================================================

-- Run this 60 seconds after the NOTIFY command:
-- SELECT
--   'Cache reload status' AS check,
--   CASE
--     WHEN EXISTS (
--       SELECT 1 FROM organization_ui_customizations LIMIT 1
--     ) OR NOT EXISTS (
--       SELECT 1 FROM organization_ui_customizations LIMIT 1
--     )
--     THEN '✅ Table is accessible via SQL'
--     ELSE '❌ Table access failed'
--   END AS sql_access,
--   'Now test in your application browser' AS next_step;

-- ====================================================================
-- NOTES
-- ====================================================================

/*
  - This is NORMAL after creating new tables
  - PostgREST caches schema for performance
  - Cache doesn't auto-refresh immediately
  - Manual reload is required for new tables
  - This is not a bug - it's by design
  - You should reload schema after each migration that adds/modifies tables

  - For production deployments, add schema reload to your CI/CD pipeline
  - Consider automating this with a post-migration hook
*/
