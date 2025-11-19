-- ============================================================================
-- DIAGNOSTIC SCRIPT - Returns Visible Results
-- This script returns actual tables you can see in Supabase
-- ============================================================================

-- Check organizations table structure
SELECT 
  'ORGANIZATIONS COLUMNS' as diagnostic_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'organizations'
ORDER BY ordinal_position;

-- Check organizations table data
SELECT 
  'ORGANIZATIONS DATA' as diagnostic_type,
  id::text as id,
  name,
  created_by::text as created_by,
  created_at::text as created_at
FROM organizations;

-- Check user_profiles table structure  
SELECT 
  'USER_PROFILES COLUMNS' as diagnostic_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Check user_profiles table data
SELECT 
  'USER_PROFILES DATA' as diagnostic_type,
  id::text as id,
  email,
  role,
  organization_id::text as organization_id,
  is_active::text as is_active
FROM user_profiles;

-- Check auth users
SELECT 
  'AUTH USERS' as diagnostic_type,
  id::text as id,
  email,
  created_at::text as created_at
FROM auth.users;

-- Check RLS policies
SELECT 
  'RLS POLICIES' as diagnostic_type,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('user_profiles', 'organizations')
ORDER BY tablename, policyname;

-- Summary counts
SELECT 
  'SUMMARY' as diagnostic_type,
  'organizations' as table_name,
  COUNT(*)::text as row_count
FROM organizations
UNION ALL
SELECT 
  'SUMMARY' as diagnostic_type,
  'user_profiles' as table_name,
  COUNT(*)::text as row_count
FROM user_profiles
UNION ALL
SELECT 
  'SUMMARY' as diagnostic_type,
  'auth.users' as table_name,
  COUNT(*)::text as row_count
FROM auth.users;
