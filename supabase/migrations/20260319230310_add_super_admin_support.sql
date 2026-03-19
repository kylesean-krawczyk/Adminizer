/*
  # Add Super Admin Support for Multi-Organization Management

  1. Changes
    - Add `is_super_admin` column to user_profiles table
    - Update role CHECK constraint to include 'super_admin'
    - Migrate first organization's master_admin to super_admin
    - Add index for super admin queries

  2. Purpose
    - Enable super admins to manage multiple organizations
    - Regular admins remain scoped to their organization
    - First user becomes super admin with multi-org access

  3. Security
    - Maintains existing RLS policies
    - Super admin policies added in next migration
    - No data loss during migration
*/

-- Add is_super_admin column to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'is_super_admin'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_super_admin boolean DEFAULT false;
  END IF;
END $$;

-- Update the role CHECK constraint to include super_admin
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_profiles_role_check'
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_role_check;
  END IF;
  
  -- Add updated constraint
  ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check 
    CHECK (role IN ('super_admin', 'master_admin', 'admin', 'user'));
END $$;

-- Migrate first organization's master_admin to super_admin
-- This identifies the first organization created and makes its master_admin a super_admin
DO $$
DECLARE
  v_first_org_id uuid;
  v_master_admin_id uuid;
BEGIN
  -- Get the first organization created
  SELECT id INTO v_first_org_id
  FROM organizations
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_first_org_id IS NOT NULL THEN
    -- Get the master_admin of this organization
    SELECT id INTO v_master_admin_id
    FROM user_profiles
    WHERE organization_id = v_first_org_id
    AND role = 'master_admin'
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_master_admin_id IS NOT NULL THEN
      -- Upgrade to super_admin
      UPDATE user_profiles
      SET is_super_admin = true,
          role = 'super_admin'
      WHERE id = v_master_admin_id;

      RAISE NOTICE 'Upgraded user % in organization % to super_admin', v_master_admin_id, v_first_org_id;
    END IF;
  END IF;
END $$;

-- Create index for super admin queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_super_admin 
  ON user_profiles(is_super_admin) 
  WHERE is_super_admin = true;

-- Create index for organization lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_organization_id 
  ON user_profiles(organization_id) 
  WHERE organization_id IS NOT NULL;
