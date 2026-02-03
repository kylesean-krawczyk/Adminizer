/*
  # Simplified Authentication Fix

  1. Completely remove automatic user profile creation
  2. Simplify RLS policies
  3. Create profiles manually when needed
  4. Remove problematic triggers
*/

-- Drop all existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_last_login() CASCADE;
DROP TRIGGER IF EXISTS on_auth_session_created ON auth.sessions;

-- Drop all existing policies on user_profiles
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their organization" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Allow system to create profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "System can insert user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to create profiles" ON user_profiles;

-- Create very simple, permissive policies
CREATE POLICY "Anyone authenticated can read profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone authenticated can create profiles"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone authenticated can update profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Anyone authenticated can delete profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (true);

-- Grant broad permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Make sure the user_profiles table allows nulls where needed
ALTER TABLE user_profiles ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE user_profiles ALTER COLUMN full_name DROP NOT NULL;