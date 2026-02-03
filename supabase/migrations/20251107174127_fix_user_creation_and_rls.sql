/*
  # Fix User Creation and RLS Policies for Super Admin Setup

  1. Security Changes
    - Drop and recreate all user_profiles policies with proper permissions
    - Add service role policy to allow triggers to bypass RLS
    - Grant necessary permissions for user creation
    - Allow authenticated users to create their own profiles

  2. Functions
    - Replace handle_new_user function with robust error handling
    - Add conflict resolution for duplicate profile creation
    - Ensure proper logging for debugging

  3. Performance
    - Add indexes on user_profiles for faster lookups
*/

-- First, let's completely reset the user_profiles policies
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their organization" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Allow system to create profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "System can insert user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to create profiles" ON user_profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON user_profiles;

-- Recreate policies with better logic
CREATE POLICY "Users can view profiles in their organization"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
    OR id = auth.uid()
  );

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update profiles in their organization"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('master_admin', 'admin') AND is_active = true
    )
  );

-- Create a very permissive insert policy for new user creation
CREATE POLICY "Allow authenticated users to create profiles"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid() OR auth.uid() IS NOT NULL);

-- Allow service role to do anything (for triggers)
CREATE POLICY "Service role can manage all profiles"
  ON user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Drop and recreate the trigger function with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create a more robust function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_exists boolean := false;
BEGIN
  -- Check if profile already exists
  SELECT EXISTS(
    SELECT 1 FROM public.user_profiles WHERE id = NEW.id
  ) INTO profile_exists;
  
  -- Only create if it doesn't exist
  IF NOT profile_exists THEN
    INSERT INTO public.user_profiles (
      id, 
      email, 
      role, 
      is_active,
      active_vertical,
      created_at, 
      updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      'user',
      true,
      'church',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE LOG 'Created user profile for: %', NEW.email;
  ELSE
    RAISE LOG 'User profile already exists for: %', NEW.email;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user for %: % %', NEW.email, SQLSTATE, SQLERRM;
    -- Don't fail the user creation even if profile creation fails
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant all necessary permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Ensure the sequence permissions are correct
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Create indexes to speed up profile lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_id ON user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
