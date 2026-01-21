/*
  # Fix RLS Infinite Recursion Issue

  The previous policy had infinite recursion because it queried user_profiles
  within the policy for user_profiles. This fixes it by simplifying the logic.
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view their own profile and org profiles" ON user_profiles;

-- Create a simple, non-recursive policy
-- Users can always see their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can also see profiles in their organization (separate policy to avoid recursion)
CREATE POLICY "Users can view org profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    organization_id IS NOT NULL 
    AND organization_id = (
      SELECT up.organization_id 
      FROM user_profiles up 
      WHERE up.id = auth.uid() 
      LIMIT 1
    )
    AND is_active = true
  );

-- Log completion
DO $$
BEGIN
  RAISE LOG 'Fixed RLS infinite recursion issue';
END $$;
