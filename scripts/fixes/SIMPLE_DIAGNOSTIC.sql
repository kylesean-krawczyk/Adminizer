-- Run these queries ONE AT A TIME to see the data

-- Query 1: Show organizations
SELECT * FROM organizations;

-- Query 2: Show user profiles  
SELECT * FROM user_profiles;

-- Query 3: Show auth users
SELECT id, email FROM auth.users;

-- Query 4: Find bad data (the "standard" value)
-- This will error if "standard" is in a UUID column
SELECT 
  id,
  name,
  created_by,
  CASE 
    WHEN created_by::text = 'standard' THEN 'BAD DATA FOUND HERE!'
    ELSE 'OK'
  END as data_check
FROM organizations;
