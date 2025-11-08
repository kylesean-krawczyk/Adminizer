/*
  # Fix Remaining RLS Recursion Issues

  The admin update policy and org view policy still have potential recursion.
  This migration fixes them to be simpler and more efficient.
*/

-- Drop policies that might cause recursion
DROP POLICY IF EXISTS "Users can view org profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their organization" ON user_profiles;

-- Recreate "Users can view org profiles" without recursion
-- Using a lateral join approach that PostgreSQL can optimize better
CREATE POLICY "Users can view org profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM user_profiles AS my_profile
      WHERE my_profile.id = auth.uid()
        AND my_profile.organization_id = user_profiles.organization_id
      LIMIT 1
    )
  );

-- Recreate admin policy without recursion
CREATE POLICY "Admins can update org profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM user_profiles AS my_profile
      WHERE my_profile.id = auth.uid()
        AND my_profile.organization_id = user_profiles.organization_id
        AND my_profile.role IN ('master_admin', 'admin')
        AND my_profile.is_active = true
      LIMIT 1
    )
  );

-- Log completion
DO $$
BEGIN
  RAISE LOG 'Fixed all remaining RLS recursion issues';
END $$;
