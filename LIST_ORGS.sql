-- List all organizations
SELECT 
  id,
  name,
  created_by,
  vertical,
  enabled_verticals,
  created_at
FROM organizations
ORDER BY created_at;
