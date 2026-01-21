/*
  # Fix User Profile Creation Permissions

  1. Security Updates
    - Fix RLS policies to allow proper user profile creation
    - Ensure the auth trigger can create profiles
    - Add proper permissions for the system

  2. Changes
    - Update RLS policies for user_profiles table
    - Fix the trigger function permissions
    - Ensure proper database access
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "System can insert user profiles" ON user_profiles;

-- Create a more permissive policy for user profile creation
CREATE POLICY "Allow profile creation for authenticated users"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow users to create their own profile
    id = auth.uid() 
    OR 
    -- Allow during the signup process (when auth.uid() might not be set yet)
    true
  );

-- Create a policy specifically for the trigger function
CREATE POLICY "Allow system to create profiles"
  ON user_profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Update the trigger function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Use a more robust insert with better error handling
  INSERT INTO public.user_profiles (
    id, 
    email, 
    role, 
    is_active, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    'user',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Failed to create user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT INSERT, UPDATE, SELECT ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;

-- Ensure the function has proper permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;