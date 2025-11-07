/*
  # Fix user profile creation and RLS policies

  1. Security Updates
    - Ensure proper RLS policies for user profile creation
    - Fix trigger function for automatic user profile creation
    - Add better error handling

  2. Changes
    - Update handle_new_user function with better error handling
    - Ensure RLS policies allow profile creation
    - Add indexes for better performance
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create improved function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile with proper error handling
  INSERT INTO public.user_profiles (id, email, role, is_active, created_at, updated_at)
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
    RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS policies allow user profile creation
-- Update the insert policy to be more permissive for new users
DROP POLICY IF EXISTS "Anyone can insert their profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Add policy for the trigger function to work
DROP POLICY IF EXISTS "System can insert user profiles" ON user_profiles;
CREATE POLICY "System can insert user profiles"
  ON user_profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Ensure the function can access the table
GRANT INSERT, UPDATE ON user_profiles TO service_role;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_organization_id ON user_profiles(organization_id);