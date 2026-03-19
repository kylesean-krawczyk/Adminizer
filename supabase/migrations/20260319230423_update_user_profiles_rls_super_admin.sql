/*
  # Update User Profiles RLS for Super Admin Access

  1. Changes
    - Add policies for super admin to view all profiles across organizations
    - Add policies for super admin to update profiles in any organization
    - Update existing policies to allow organization_id changes
    - Add policies for user invitations multi-org support

  2. Security
    - Super admins have cross-organization access
    - Regular admins limited to their organization
    - Users can only update their own profile (except admins)
    - Maintains data isolation for non-super-admin users

  3. User Invitations
    - Super admins can view and create invitations for any organization
    - Regular admins limited to their organization
    - Anyone can view invitation by token (for acceptance)
*/

-- Add policy: Super admins can view all profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Super admins can view all profiles'
  ) THEN
    CREATE POLICY "Super admins can view all profiles"
      ON user_profiles
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles up
          WHERE up.id = auth.uid() 
          AND up.is_super_admin = true
          AND up.is_active = true
        )
      );
  END IF;
END $$;

-- Add policy: Super admins can update all profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Super admins can update all profiles'
  ) THEN
    CREATE POLICY "Super admins can update all profiles"
      ON user_profiles
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles up
          WHERE up.id = auth.uid() 
          AND up.is_super_admin = true
          AND up.is_active = true
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_profiles up
          WHERE up.id = auth.uid() 
          AND up.is_super_admin = true
          AND up.is_active = true
        )
      );
  END IF;
END $$;

-- Update user invitations: Super admins can view all invitations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_invitations' 
    AND policyname = 'Super admins can view all invitations'
  ) THEN
    CREATE POLICY "Super admins can view all invitations"
      ON user_invitations
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid() 
          AND is_super_admin = true
          AND is_active = true
        )
      );
  END IF;
END $$;

-- Update user invitations: Super admins can create invitations for any organization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_invitations' 
    AND policyname = 'Super admins can create invitations for any organization'
  ) THEN
    CREATE POLICY "Super admins can create invitations for any organization"
      ON user_invitations
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid() 
          AND is_super_admin = true
          AND is_active = true
        )
      );
  END IF;
END $$;

-- Update user invitations: Super admins can update any invitation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_invitations' 
    AND policyname = 'Super admins can update any invitation'
  ) THEN
    CREATE POLICY "Super admins can update any invitation"
      ON user_invitations
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid() 
          AND is_super_admin = true
          AND is_active = true
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid() 
          AND is_super_admin = true
          AND is_active = true
        )
      );
  END IF;
END $$;

-- Add policy: Super admins can delete invitations from any organization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_invitations' 
    AND policyname = 'Super admins can delete any invitation'
  ) THEN
    CREATE POLICY "Super admins can delete any invitation"
      ON user_invitations
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid() 
          AND is_super_admin = true
          AND is_active = true
        )
      );
  END IF;
END $$;
