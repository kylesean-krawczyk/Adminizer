/*
  # Verify Query Fix - Diagnostic Queries

  Run these queries in Supabase SQL Editor to verify the fix is working correctly.
  These queries should all succeed without errors.
*/

-- ============================================================================
-- SECTION 1: VERIFY RLS POLICIES
-- ============================================================================

-- 1.1: Check all RLS policies on ai_tool_registry
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'ai_tool_registry'
ORDER BY policyname;

-- Expected result: Should see 3 policies including "Admins can view all tools for management"


-- ============================================================================
-- SECTION 2: VERIFY FOREIGN KEY RELATIONSHIPS
-- ============================================================================

-- 2.1: Check foreign keys on ai_tool_access_requests
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'ai_tool_access_requests'
ORDER BY kcu.column_name;

-- Expected result: Should see foreign keys for user_id, tool_id, and reviewed_by


-- ============================================================================
-- SECTION 3: TEST SIMPLIFIED JOIN QUERY
-- ============================================================================

-- 3.1: Test the corrected query syntax (should work even with no data)
-- This simulates what the application does
SELECT
  tar.*,
  up.id as user_profile_id,
  up.email as user_profile_email,
  up.full_name as user_profile_name,
  up.role as user_profile_role,
  tr.id as tool_id,
  tr.name as tool_name,
  tr.slug as tool_slug,
  tr.description as tool_description,
  tr.category as tool_category
FROM ai_tool_access_requests tar
LEFT JOIN user_profiles up ON tar.user_id = up.id
LEFT JOIN ai_tool_registry tr ON tar.tool_id = tr.id
WHERE tar.status = 'pending'
ORDER BY tar.created_at DESC
LIMIT 10;

-- Expected result: Empty result set (no pending requests yet) with no errors


-- ============================================================================
-- SECTION 4: VERIFY TABLE DATA
-- ============================================================================

-- 4.1: Check if ai_tool_registry has any tools
SELECT
  COUNT(*) as total_tools,
  COUNT(*) FILTER (WHERE is_enabled = true) as enabled_tools,
  COUNT(*) FILTER (WHERE is_enabled = false) as disabled_tools
FROM ai_tool_registry;

-- Expected result: May be 0 if no tools seeded yet

-- 4.2: Check if ai_tool_access_requests has any requests
SELECT
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_requests,
  COUNT(*) FILTER (WHERE status = 'denied') as denied_requests
FROM ai_tool_access_requests;

-- Expected result: Likely all 0 (no requests yet)

-- 4.3: Check user_profiles
SELECT
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE role = 'master_admin') as master_admins,
  COUNT(*) FILTER (WHERE role = 'admin') as admins,
  COUNT(*) FILTER (WHERE role = 'user') as regular_users
FROM user_profiles;

-- Expected result: Should see at least 1 master_admin


-- ============================================================================
-- SECTION 5: TEST RLS POLICY ACCESS
-- ============================================================================

-- 5.1: Verify current user can see tools (run as authenticated user)
-- This will succeed if RLS policies are correct
SELECT
  id,
  name,
  slug,
  is_enabled,
  permission_level
FROM ai_tool_registry
LIMIT 5;

-- Expected result: If you're admin, you see all tools. If regular user, only enabled tools.


-- ============================================================================
-- SECTION 6: VERIFY QUERY WILL WORK IN APPLICATION
-- ============================================================================

-- 6.1: Simulate the exact query the application makes
-- This uses PostgREST-style column selection
SELECT
  tar.id,
  tar.user_id,
  tar.tool_id,
  tar.status,
  tar.request_reason,
  tar.business_justification,
  tar.priority,
  tar.created_at,
  tar.reviewed_by,
  tar.reviewed_at,
  tar.review_comment,
  -- User profile join
  jsonb_build_object(
    'id', up.id,
    'email', up.email,
    'full_name', up.full_name,
    'role', up.role
  ) as user_profile,
  -- Tool join
  jsonb_build_object(
    'id', tr.id,
    'name', tr.name,
    'slug', tr.slug,
    'description', tr.description,
    'category', tr.category
  ) as tool,
  -- Reviewer join (nullable)
  CASE
    WHEN tar.reviewed_by IS NOT NULL THEN
      jsonb_build_object(
        'id', rev.id,
        'email', rev.email,
        'full_name', rev.full_name
      )
    ELSE NULL
  END as reviewer_profile
FROM ai_tool_access_requests tar
LEFT JOIN user_profiles up ON tar.user_id = up.id
LEFT JOIN ai_tool_registry tr ON tar.tool_id = tr.id
LEFT JOIN user_profiles rev ON tar.reviewed_by = rev.id
WHERE tar.status = 'pending'
ORDER BY tar.created_at DESC;

-- Expected result: Empty result set with no errors


-- ============================================================================
-- SECTION 7: SUCCESS CRITERIA
-- ============================================================================

/*
  ALL OF THE ABOVE QUERIES SHOULD:
  ✅ Execute without errors
  ✅ Return results (even if empty)
  ✅ Complete in under 1 second
  ✅ Not trigger any RLS policy violations

  If any query fails:
  1. Check the error message
  2. Verify RLS policies exist
  3. Verify foreign keys exist
  4. Check user permissions
  5. Review migration history
*/

-- Final verification query
SELECT
  'Query fix verification complete' as status,
  current_timestamp as verified_at,
  current_user as verified_by;
