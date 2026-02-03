/*
  # Fix database constraints and organization creation

  1. Fix Issues
    - Remove duplicate user profile creation attempts
    - Fix organization creation permissions
    - Simplify RLS policies to avoid conflicts

  2. Changes
    - Drop problematic trigger
    - Fix organization policies
    - Ensure proper permissions for organization creation
*/

-- Drop the problematic trigger that's causing duplicate profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Fix organization policies - the current ones are too restrictive
DROP POLICY IF EXISTS "Master admins can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Admins can update their organization" ON organizations;

-- Create more permissive organization policies
CREATE POLICY "Authenticated users can create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view organizations they belong to"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM user_profiles 
      WHERE id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Organization creators and admins can update"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR id IN (
      SELECT organization_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('master_admin', 'admin') AND is_active = true
    )
  );

-- Ensure proper permissions for organizations
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON organizations TO service_role;

-- Fix the foreign key constraint issue by making it deferrable
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_created_by_fkey;
ALTER TABLE organizations 
ADD CONSTRAINT organizations_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES user_profiles(id) DEFERRABLE INITIALLY DEFERRED;

-- Create a simple function to ensure user profiles exist when needed
CREATE OR REPLACE FUNCTION ensure_user_profile(user_id uuid, user_email text)
RETURNS void AS $$
BEGIN
  INSERT INTO user_profiles (id, email, role, is_active)
  VALUES (user_id, user_email, 'user', true)
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION ensure_user_profile(uuid, text) TO authenticated;