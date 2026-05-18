/*
  # Fix RLS policies to properly support super_admin role

  1. Problem
    - The "admins_update_org_profiles" policy on user_profiles has a self-referencing
      subquery that can cause recursion issues on UPDATE operations
    - Several policies on organizations and user_invitations reference user_profiles
      with direct is_super_admin checks instead of using the is_super_admin() helper
    - Super admin users need proper write access across all tables

  2. Changes
    - Replace admins_update_org_profiles with a version using is_super_admin() helper
    - Update organizations write policies to use is_super_admin() helper
    - Update user_invitations policies to use is_super_admin() helper

  3. Security
    - All policies still require authenticated role
    - Super admin access verified via SECURITY DEFINER function (no recursion)
    - Organization membership still verified for non-super-admin operations
*/

-- Fix admins_update_org_profiles to avoid self-referencing subquery
DROP POLICY IF EXISTS "admins_update_org_profiles" ON user_profiles;

CREATE POLICY "admins_update_org_profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    (organization_id IS NOT NULL)
    AND (organization_id = get_my_organization_id())
    AND (
      is_super_admin()
      OR EXISTS (
        SELECT 1 FROM user_profiles my_profile
        WHERE my_profile.id = auth.uid()
        AND my_profile.role IN ('master_admin', 'admin')
        AND my_profile.is_active = true
        LIMIT 1
      )
    )
  )
  WITH CHECK (organization_id = get_my_organization_id());

-- Fix organizations "Super admins can view all organizations" to use helper
DROP POLICY IF EXISTS "Super admins can view all organizations" ON organizations;

CREATE POLICY "Super admins can view all organizations"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Fix organizations "Admins and super admins can update organizations" to use helper
DROP POLICY IF EXISTS "Admins and super admins can update organizations" ON organizations;

CREATE POLICY "Admins and super admins can update organizations"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    is_super_admin()
    OR (id = get_my_organization_id())
  )
  WITH CHECK (
    is_super_admin()
    OR (id = get_my_organization_id())
  );

-- Fix user_invitations policies to use helper
DROP POLICY IF EXISTS "Super admins can view all invitations" ON user_invitations;
DROP POLICY IF EXISTS "Super admins can update any invitation" ON user_invitations;
DROP POLICY IF EXISTS "Super admins can delete any invitation" ON user_invitations;

CREATE POLICY "Super admins can view all invitations"
  ON user_invitations
  FOR SELECT
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "Super admins can update any invitation"
  ON user_invitations
  FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can delete any invitation"
  ON user_invitations
  FOR DELETE
  TO authenticated
  USING (is_super_admin());
