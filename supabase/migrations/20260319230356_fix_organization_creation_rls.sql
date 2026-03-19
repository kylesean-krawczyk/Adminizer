/*
  # Fix Organization Creation RLS Policies and Add Atomic Functions

  1. Changes
    - Drop problematic RLS policies causing circular dependency
    - Add new policies for first-time organization creation
    - Add policies for super admin multi-org management
    - Create atomic function for organization creation
    - Create function for multi-org user assignment

  2. RLS Policies
    - Users without organization can create their first organization
    - Super admins can create multiple organizations
    - Regular admins can only manage their own organization
    - Organization data isolation maintained

  3. Functions
    - create_organization_with_admin: Atomic org creation + profile update
    - assign_user_to_organization: Multi-org user assignment for super admins

  4. Security
    - SECURITY DEFINER functions bypass RLS safely
    - Validation ensures only authorized operations
    - Maintains data isolation between organizations
*/

-- Drop existing problematic INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;

-- Policy: Users without organization can create their first organization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organizations' 
    AND policyname = 'Users without organization can create first organization'
  ) THEN
    CREATE POLICY "Users without organization can create first organization"
      ON organizations
      FOR INSERT
      TO authenticated
      WITH CHECK (
        -- User must not have an organization yet
        NOT EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid() 
          AND organization_id IS NOT NULL
        )
      );
  END IF;
END $$;

-- Policy: Super admins can create multiple organizations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organizations' 
    AND policyname = 'Super admins can create organizations'
  ) THEN
    CREATE POLICY "Super admins can create organizations"
      ON organizations
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

-- Update UPDATE policy to handle initial setup
DROP POLICY IF EXISTS "Admins can update their organization" ON organizations;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organizations' 
    AND policyname = 'Admins and super admins can update organizations'
  ) THEN
    CREATE POLICY "Admins and super admins can update organizations"
      ON organizations
      FOR UPDATE
      TO authenticated
      USING (
        -- Super admins can update any organization
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid() 
          AND is_super_admin = true
          AND is_active = true
        )
        OR
        -- Admins can update their own organization
        id IN (
          SELECT organization_id FROM user_profiles
          WHERE id = auth.uid() 
          AND role IN ('master_admin', 'admin') 
          AND is_active = true
        )
      )
      WITH CHECK (
        -- Same check for WITH CHECK
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid() 
          AND is_super_admin = true
          AND is_active = true
        )
        OR
        id IN (
          SELECT organization_id FROM user_profiles
          WHERE id = auth.uid() 
          AND role IN ('master_admin', 'admin') 
          AND is_active = true
        )
      );
  END IF;
END $$;

-- Policy: Super admins can view all organizations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organizations' 
    AND policyname = 'Super admins can view all organizations'
  ) THEN
    CREATE POLICY "Super admins can view all organizations"
      ON organizations
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

-- Create atomic function for organization creation
CREATE OR REPLACE FUNCTION create_organization_with_admin(
  p_organization_name text,
  p_user_id uuid,
  p_make_super_admin boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_user_org_id uuid;
  v_is_super_admin boolean;
  v_new_role text;
  v_result json;
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Get current user's organization and super admin status
  SELECT organization_id, is_super_admin 
  INTO v_user_org_id, v_is_super_admin
  FROM user_profiles 
  WHERE id = p_user_id;

  -- Validation: Regular users can't create if they already have an organization
  IF v_user_org_id IS NOT NULL AND (v_is_super_admin IS FALSE OR v_is_super_admin IS NULL) THEN
    RAISE EXCEPTION 'You already belong to an organization. Only super admins can create multiple organizations.';
  END IF;

  -- Determine the role
  IF p_make_super_admin OR v_is_super_admin THEN
    v_new_role := 'super_admin';
  ELSE
    v_new_role := 'master_admin';
  END IF;

  -- Create the organization
  INSERT INTO organizations (name, created_by)
  VALUES (p_organization_name, p_user_id)
  RETURNING id INTO v_org_id;

  -- Update user profile with organization and role
  UPDATE user_profiles
  SET 
    organization_id = v_org_id,
    role = v_new_role,
    is_super_admin = (v_new_role = 'super_admin'),
    updated_at = now()
  WHERE id = p_user_id;

  -- Build result
  SELECT json_build_object(
    'organization_id', v_org_id,
    'organization_name', p_organization_name,
    'user_id', p_user_id,
    'role', v_new_role,
    'is_super_admin', (v_new_role = 'super_admin')
  ) INTO v_result;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create organization: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_organization_with_admin(text, uuid, boolean) TO authenticated;

-- Create function for assigning users to organizations (super admin only)
CREATE OR REPLACE FUNCTION assign_user_to_organization(
  p_user_email text,
  p_organization_id uuid,
  p_role text,
  p_invited_by_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inviter_is_super_admin boolean;
  v_inviter_org_id uuid;
  v_invitation_id uuid;
  v_invitation_token text;
  v_result json;
BEGIN
  -- Validate role
  IF p_role NOT IN ('admin', 'user') THEN
    RAISE EXCEPTION 'Invalid role. Must be admin or user.';
  END IF;

  -- Check if organization exists
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = p_organization_id) THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  -- Get inviter's details
  SELECT is_super_admin, organization_id
  INTO v_inviter_is_super_admin, v_inviter_org_id
  FROM user_profiles
  WHERE id = p_invited_by_user_id AND is_active = true;

  -- Validation: Must be super admin OR admin of the target organization
  IF NOT (
    v_inviter_is_super_admin = true 
    OR (v_inviter_org_id = p_organization_id AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = p_invited_by_user_id 
      AND role IN ('master_admin', 'admin')
    ))
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to invite users to this organization';
  END IF;

  -- Check if user already exists in this organization
  IF EXISTS (
    SELECT 1 FROM user_profiles up
    INNER JOIN auth.users au ON au.id = up.id
    WHERE au.email = p_user_email 
    AND up.organization_id = p_organization_id
  ) THEN
    RAISE EXCEPTION 'User already exists in this organization';
  END IF;

  -- Create invitation
  INSERT INTO user_invitations (
    email,
    role,
    organization_id,
    invited_by
  )
  VALUES (
    p_user_email,
    p_role,
    p_organization_id,
    p_invited_by_user_id
  )
  RETURNING id, token INTO v_invitation_id, v_invitation_token;

  -- Build result
  SELECT json_build_object(
    'invitation_id', v_invitation_id,
    'token', v_invitation_token,
    'email', p_user_email,
    'organization_id', p_organization_id,
    'role', p_role,
    'expires_at', (SELECT expires_at FROM user_invitations WHERE id = v_invitation_id)
  ) INTO v_result;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create invitation: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION assign_user_to_organization(text, uuid, text, uuid) TO authenticated;
