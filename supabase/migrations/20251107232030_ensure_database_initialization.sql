/*
  # Ensure Database Initialization and Fix RLS Policies

  This migration ensures:
  1. All required tables exist with proper schema
  2. RLS policies allow authenticated users to access their data
  3. Triggers are properly set up for user profile creation
  4. Default values are correct

  This is a consolidation migration that can be run safely multiple times.
*/

-- Ensure extensions are enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure organizations table has all required columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'vertical'
  ) THEN
    ALTER TABLE organizations ADD COLUMN vertical text DEFAULT 'church'
      CHECK (vertical IN ('church', 'business', 'estate'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'enabled_verticals'
  ) THEN
    ALTER TABLE organizations ADD COLUMN enabled_verticals text[] DEFAULT '{church,business,estate}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'vertical_changed_at'
  ) THEN
    ALTER TABLE organizations ADD COLUMN vertical_changed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'vertical_change_history'
  ) THEN
    ALTER TABLE organizations ADD COLUMN vertical_change_history jsonb DEFAULT '[]';
  END IF;
END $$;

-- Ensure user_profiles table has active_vertical column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'active_vertical'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN active_vertical text DEFAULT 'church'
      CHECK (active_vertical IN ('church', 'business', 'estate'));
  END IF;
END $$;

-- Fix RLS policies to ensure authenticated users can always see their own profile
-- This is critical for login to work
DROP POLICY IF EXISTS "Users can view their own profile and org profiles" ON user_profiles;
CREATE POLICY "Users can view their own profile and org profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Ensure service role can manage profiles (for triggers)
DROP POLICY IF EXISTS "Service role can manage all profiles" ON user_profiles;
CREATE POLICY "Service role can manage all profiles"
  ON user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure authenticated users can insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Fix organizations SELECT policy to handle cases where user has no org yet
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
CREATE POLICY "Users can view their organization"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Ensure the handle_new_user function is properly set up
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

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_id ON user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active_vertical ON user_profiles(active_vertical);
CREATE INDEX IF NOT EXISTS idx_organizations_id ON organizations(id);

-- Grant necessary permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;

-- Log completion
DO $$
BEGIN
  RAISE LOG 'Database initialization migration completed successfully';
END $$;
