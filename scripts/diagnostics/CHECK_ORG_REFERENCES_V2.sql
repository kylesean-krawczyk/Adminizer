-- Check all tables that reference organizations (only existing tables)
SELECT 
  'documents' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT organization_id) as distinct_org_count
FROM documents
WHERE organization_id IS NOT NULL

UNION ALL

SELECT 
  'user_profiles' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT organization_id) as distinct_org_count
FROM user_profiles
WHERE organization_id IS NOT NULL

UNION ALL

SELECT 
  'user_invitations' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT organization_id) as distinct_org_count
FROM user_invitations
WHERE organization_id IS NOT NULL;
