/*
  # Fix infinite recursion in user_profiles RLS policies

  1. Problem
    - "Super admins can view all profiles" and "Super admins can update all profiles"
      policies query user_profiles to check if the current user is a super admin
    - This self-reference causes infinite recursion when PostgreSQL evaluates RLS
    - Result: 500 error on any authenticated query to user_profiles

  2. Fix
    - Create a SECURITY DEFINER helper function `is_super_admin()` that bypasses RLS
    - Replace the self-referencing subqueries in the super admin policies with this function
    - Also fix get_my_organization_id() search_path issue

  3. Security
    - Helper function is SECURITY DEFINER with explicit search_path
    - Only checks the current user's own super_admin status via auth.uid()
    - Cannot be exploited to check other users' status
*/

-- Create helper function that bypasses RLS to check super admin status
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM user_profiles WHERE id = auth.uid() AND is_active = true),
    false
  );
$$;

-- Fix get_my_organization_id search_path
CREATE OR REPLACE FUNCTION public.get_my_organization_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id 
  FROM user_profiles 
  WHERE id = auth.uid() 
  LIMIT 1;
$$;

-- Drop the recursive policies
DROP POLICY IF EXISTS "Super admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON user_profiles;

-- Recreate using the non-recursive helper function
CREATE POLICY "Super admins can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "Super admins can update all profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());
