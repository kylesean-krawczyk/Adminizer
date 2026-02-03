-- Check current organizations
SELECT 
  id,
  name,
  created_by,
  vertical,
  enabled_verticals,
  created_at
FROM organizations
ORDER BY created_at;

-- Check the user profile
SELECT 
  id,
  email,
  full_name,
  role,
  organization_id,
  is_active
FROM user_profiles;
