-- Single query that shows everything in one result
SELECT 
  'ORG' as type,
  id::text,
  name as name_or_email,
  created_by::text as created_by_or_role,
  created_at::text as created_at_or_org_id,
  NULL as is_active
FROM organizations

UNION ALL

SELECT 
  'PROFILE' as type,
  id::text,
  email as name_or_email,
  role as created_by_or_role,
  organization_id::text as created_at_or_org_id,
  is_active::text as is_active
FROM user_profiles

UNION ALL

SELECT 
  'AUTH' as type,
  id::text,
  email as name_or_email,
  NULL as created_by_or_role,
  created_at::text as created_at_or_org_id,
  NULL as is_active
FROM auth.users

ORDER BY type;
