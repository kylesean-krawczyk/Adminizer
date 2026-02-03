/*
  # Foreign Key Diagnostic Queries

  Comprehensive diagnostic queries to identify orphaned records and foreign key
  constraint violations across all tables in the database.

  Run these queries to understand the scope of data integrity issues before
  attempting any repairs.

  USAGE:
  - Execute each query separately in Supabase SQL Editor
  - Review results to determine which repair strategy to use
  - Save results for comparison after running repairs
*/

-- ============================================================================
-- SECTION 1: ORPHANED USER PROFILES
-- ============================================================================

-- 1.1: User profiles with invalid organization_id
SELECT
  'user_profiles_invalid_org' as issue_type,
  COUNT(*) as orphaned_count,
  ARRAY_AGG(id) FILTER (WHERE id IS NOT NULL) as affected_ids
FROM user_profiles up
WHERE organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM organizations o
    WHERE o.id = up.organization_id
  );

-- 1.2: Detailed view of user profiles with invalid organization_id
SELECT
  up.id,
  up.email,
  up.role,
  up.organization_id as invalid_org_id,
  up.is_active,
  up.created_at,
  up.last_login
FROM user_profiles up
WHERE organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM organizations o
    WHERE o.id = up.organization_id
  )
ORDER BY up.created_at DESC;

-- 1.3: User profiles without organization (may be intentional for new users)
SELECT
  'user_profiles_no_org' as issue_type,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE role = 'master_admin') as master_admin_count,
  COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
  COUNT(*) FILTER (WHERE role = 'user') as user_count
FROM user_profiles
WHERE organization_id IS NULL;


-- ============================================================================
-- SECTION 2: ORPHANED AI PAGE CONTEXT
-- ============================================================================

-- 2.1: Page context with invalid user_id
SELECT
  'ai_page_context_invalid_user' as issue_type,
  COUNT(*) as orphaned_count
FROM ai_page_context apc
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users au
  WHERE au.id = apc.user_id
);

-- 2.2: Page context with invalid organization_id
SELECT
  'ai_page_context_invalid_org' as issue_type,
  COUNT(*) as orphaned_count
FROM ai_page_context apc
WHERE organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM organizations o
    WHERE o.id = apc.organization_id
  );

-- 2.3: Detailed view of orphaned page context
SELECT
  apc.id,
  apc.user_id,
  apc.organization_id as invalid_org_id,
  apc.page_type,
  apc.page_route,
  apc.created_at,
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM auth.users WHERE id = apc.user_id) THEN 'invalid_user'
    WHEN apc.organization_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = apc.organization_id) THEN 'invalid_org'
    ELSE 'valid'
  END as issue
FROM ai_page_context apc
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = apc.user_id)
   OR (apc.organization_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = apc.organization_id))
ORDER BY apc.created_at DESC
LIMIT 100;


-- ============================================================================
-- SECTION 3: ORPHANED AI TOOL ACCESS REQUESTS
-- ============================================================================

-- 3.1: Tool access requests with invalid user_id
SELECT
  'ai_tool_access_requests_invalid_user' as issue_type,
  COUNT(*) as orphaned_count
FROM ai_tool_access_requests atar
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users au
  WHERE au.id = atar.user_id
);

-- 3.2: Tool access requests with invalid tool_id
SELECT
  'ai_tool_access_requests_invalid_tool' as issue_type,
  COUNT(*) as orphaned_count
FROM ai_tool_access_requests atar
WHERE NOT EXISTS (
  SELECT 1 FROM ai_tool_registry atr
  WHERE atr.id = atar.tool_id
);

-- 3.3: Tool access requests with invalid reviewer
SELECT
  'ai_tool_access_requests_invalid_reviewer' as issue_type,
  COUNT(*) as orphaned_count
FROM ai_tool_access_requests atar
WHERE reviewed_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = atar.reviewed_by
  );

-- 3.4: Detailed view of orphaned tool access requests
SELECT
  atar.id,
  atar.user_id,
  atar.tool_id,
  atar.status,
  atar.reviewed_by,
  atar.created_at,
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM auth.users WHERE id = atar.user_id) THEN 'invalid_user'
    WHEN NOT EXISTS (SELECT 1 FROM ai_tool_registry WHERE id = atar.tool_id) THEN 'invalid_tool'
    WHEN atar.reviewed_by IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = atar.reviewed_by) THEN 'invalid_reviewer'
    ELSE 'valid'
  END as issue
FROM ai_tool_access_requests atar
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = atar.user_id)
   OR NOT EXISTS (SELECT 1 FROM ai_tool_registry WHERE id = atar.tool_id)
   OR (atar.reviewed_by IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = atar.reviewed_by))
ORDER BY atar.created_at DESC
LIMIT 100;


-- ============================================================================
-- SECTION 4: ORPHANED AI NOTIFICATIONS
-- ============================================================================

-- 4.1: Notifications with invalid user_id
SELECT
  'ai_notifications_invalid_user' as issue_type,
  COUNT(*) as orphaned_count
FROM ai_notifications an
WHERE user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = an.user_id
  );

-- 4.2: Notifications with invalid organization_id
SELECT
  'ai_notifications_invalid_org' as issue_type,
  COUNT(*) as orphaned_count
FROM ai_notifications an
WHERE NOT EXISTS (
  SELECT 1 FROM organizations o
  WHERE o.id = an.organization_id
);

-- 4.3: Detailed view of orphaned notifications
SELECT
  an.id,
  an.user_id,
  an.organization_id,
  an.notification_type,
  an.title,
  an.status,
  an.created_at,
  CASE
    WHEN an.user_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = an.user_id) THEN 'invalid_user'
    WHEN NOT EXISTS (SELECT 1 FROM organizations WHERE id = an.organization_id) THEN 'invalid_org'
    ELSE 'valid'
  END as issue
FROM ai_notifications an
WHERE (an.user_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = an.user_id))
   OR NOT EXISTS (SELECT 1 FROM organizations WHERE id = an.organization_id)
ORDER BY an.created_at DESC
LIMIT 100;


-- ============================================================================
-- SECTION 5: ORPHANED DOCUMENTS
-- ============================================================================

-- 5.1: Documents with invalid organization_id
SELECT
  'documents_invalid_org' as issue_type,
  COUNT(*) as orphaned_count
FROM documents d
WHERE organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM organizations o
    WHERE o.id = d.organization_id
  );

-- 5.2: Detailed view of orphaned documents
SELECT
  d.id,
  d.title,
  d.organization_id as invalid_org_id,
  d.uploaded_by,
  d.created_at
FROM documents d
WHERE organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM organizations o
    WHERE o.id = d.organization_id
  )
ORDER BY d.created_at DESC
LIMIT 100;


-- ============================================================================
-- SECTION 6: ORPHANED WORKFLOW DATA
-- ============================================================================

-- 6.1: Workflow definitions with invalid organization_id
SELECT
  'workflow_definitions_invalid_org' as issue_type,
  COUNT(*) as orphaned_count
FROM workflow_definitions wd
WHERE organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM organizations o
    WHERE o.id = wd.organization_id
  );

-- 6.2: Workflow instances with invalid organization_id
SELECT
  'workflow_instances_invalid_org' as issue_type,
  COUNT(*) as orphaned_count
FROM workflow_instances wi
WHERE organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM organizations o
    WHERE o.id = wi.organization_id
  );


-- ============================================================================
-- SECTION 7: ORPHANED FEATURE FLAGS
-- ============================================================================

-- 7.1: Feature flags with invalid organization_id
SELECT
  'feature_flags_invalid_org' as issue_type,
  COUNT(*) as orphaned_count
FROM feature_flags ff
WHERE NOT EXISTS (
  SELECT 1 FROM organizations o
  WHERE o.id = ff.organization_id
);


-- ============================================================================
-- SECTION 8: ORPHANED TOOL CONFIGURATIONS
-- ============================================================================

-- 8.1: Tool configurations with invalid organization_id
SELECT
  'tool_configurations_invalid_org' as issue_type,
  COUNT(*) as orphaned_count
FROM tool_configurations tc
WHERE NOT EXISTS (
  SELECT 1 FROM organizations o
  WHERE o.id = tc.organization_id
);


-- ============================================================================
-- SECTION 9: COMPREHENSIVE SUMMARY
-- ============================================================================

-- 9.1: Summary of all foreign key issues
WITH issue_counts AS (
  SELECT 'user_profiles_invalid_org' as table_name,
         COUNT(*) as count
  FROM user_profiles
  WHERE organization_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = organization_id)

  UNION ALL

  SELECT 'ai_page_context_invalid_user',
         COUNT(*)
  FROM ai_page_context
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id)

  UNION ALL

  SELECT 'ai_page_context_invalid_org',
         COUNT(*)
  FROM ai_page_context
  WHERE organization_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = organization_id)

  UNION ALL

  SELECT 'ai_tool_access_requests_invalid_user',
         COUNT(*)
  FROM ai_tool_access_requests
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id)

  UNION ALL

  SELECT 'ai_tool_access_requests_invalid_tool',
         COUNT(*)
  FROM ai_tool_access_requests
  WHERE NOT EXISTS (SELECT 1 FROM ai_tool_registry WHERE id = tool_id)

  UNION ALL

  SELECT 'ai_notifications_invalid_user',
         COUNT(*)
  FROM ai_notifications
  WHERE user_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id)

  UNION ALL

  SELECT 'ai_notifications_invalid_org',
         COUNT(*)
  FROM ai_notifications
  WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE id = organization_id)

  UNION ALL

  SELECT 'documents_invalid_org',
         COUNT(*)
  FROM documents
  WHERE organization_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = organization_id)

  UNION ALL

  SELECT 'workflow_definitions_invalid_org',
         COUNT(*)
  FROM workflow_definitions
  WHERE organization_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = organization_id)

  UNION ALL

  SELECT 'workflow_instances_invalid_org',
         COUNT(*)
  FROM workflow_instances
  WHERE organization_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = organization_id)

  UNION ALL

  SELECT 'feature_flags_invalid_org',
         COUNT(*)
  FROM feature_flags
  WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE id = organization_id)

  UNION ALL

  SELECT 'tool_configurations_invalid_org',
         COUNT(*)
  FROM tool_configurations
  WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE id = organization_id)
)
SELECT
  table_name,
  count as orphaned_records,
  CASE
    WHEN count = 0 THEN '✓ OK'
    WHEN count < 10 THEN '⚠ Warning'
    ELSE '✗ Critical'
  END as severity
FROM issue_counts
WHERE count > 0
ORDER BY count DESC;


-- ============================================================================
-- SECTION 10: HEALTH CHECK SUMMARY
-- ============================================================================

-- 10.1: Overall database health summary
SELECT
  'Database Foreign Key Health Check' as report_title,
  (SELECT COUNT(*) FROM organizations) as total_organizations,
  (SELECT COUNT(*) FROM user_profiles) as total_user_profiles,
  (SELECT COUNT(*) FROM user_profiles WHERE organization_id IS NULL) as profiles_without_org,
  (SELECT COUNT(*) FROM ai_page_context) as total_page_contexts,
  (SELECT COUNT(*) FROM ai_tool_access_requests) as total_access_requests,
  (SELECT COUNT(*) FROM ai_notifications) as total_notifications,
  (SELECT COUNT(*) FROM documents WHERE organization_id IS NOT NULL) as documents_with_org,
  NOW() as report_generated_at;
