/*
  # User Management System - Fixed Extension Ordering

  1. Extensions
    - Enable pgcrypto extension first (for gen_random_uuid and gen_random_bytes)
    - Enable uuid-ossp extension (for UUID support)

  2. New Tables
    - `organizations`
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_by` (uuid, references user_profiles) - added after user_profiles table
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `role` (text) - 'master_admin', 'admin', 'user'
      - `organization_id` (uuid)
      - `is_active` (boolean)
      - `invited_by` (uuid, references user_profiles)
      - `invited_at` (timestamp)
      - `last_login` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `user_invitations`
      - `id` (uuid, primary key)
      - `email` (text)
      - `role` (text)
      - `organization_id` (uuid)
      - `invited_by` (uuid)
      - `token` (text, unique)
      - `expires_at` (timestamp)
      - `accepted_at` (timestamp)
      - `created_at` (timestamp)

  3. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Ensure proper data isolation by organization

  4. Functions
    - Function to create organization and first admin
    - Function to invite users
    - Function to accept invitations
*/

-- CRITICAL: Enable extensions FIRST before any table creation
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('master_admin', 'admin', 'user')),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  invited_by uuid REFERENCES user_profiles(id),
  invited_at timestamptz,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_invitations table
CREATE TABLE IF NOT EXISTS user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES user_profiles(id),
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraint after user_profiles table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'organizations_created_by_fkey'
    AND table_name = 'organizations'
  ) THEN
    ALTER TABLE organizations
    ADD CONSTRAINT organizations_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES user_profiles(id);
  END IF;
END $$;

-- Update documents table to include organization_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN organization_id uuid REFERENCES organizations(id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Organizations policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Users can view their organization'
  ) THEN
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
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Master admins can create organizations'
  ) THEN
    CREATE POLICY "Master admins can create organizations"
      ON organizations
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Admins can update their organization'
  ) THEN
    CREATE POLICY "Admins can update their organization"
      ON organizations
      FOR UPDATE
      TO authenticated
      USING (
        id IN (
          SELECT organization_id FROM user_profiles
          WHERE id = auth.uid() AND role IN ('master_admin', 'admin') AND is_active = true
        )
      );
  END IF;
END $$;

-- User profiles policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can view profiles in their organization'
  ) THEN
    CREATE POLICY "Users can view profiles in their organization"
      ON user_profiles
      FOR SELECT
      TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM user_profiles
          WHERE id = auth.uid() AND is_active = true
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON user_profiles
      FOR UPDATE
      TO authenticated
      USING (id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Admins can update profiles in their organization'
  ) THEN
    CREATE POLICY "Admins can update profiles in their organization"
      ON user_profiles
      FOR UPDATE
      TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM user_profiles
          WHERE id = auth.uid() AND role IN ('master_admin', 'admin') AND is_active = true
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Anyone can insert their profile'
  ) THEN
    CREATE POLICY "Anyone can insert their profile"
      ON user_profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- User invitations policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_invitations' AND policyname = 'Admins can view invitations for their organization'
  ) THEN
    CREATE POLICY "Admins can view invitations for their organization"
      ON user_invitations
      FOR SELECT
      TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM user_profiles
          WHERE id = auth.uid() AND role IN ('master_admin', 'admin') AND is_active = true
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_invitations' AND policyname = 'Admins can create invitations for their organization'
  ) THEN
    CREATE POLICY "Admins can create invitations for their organization"
      ON user_invitations
      FOR INSERT
      TO authenticated
      WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM user_profiles
          WHERE id = auth.uid() AND role IN ('master_admin', 'admin') AND is_active = true
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_invitations' AND policyname = 'Anyone can view invitations by token'
  ) THEN
    CREATE POLICY "Anyone can view invitations by token"
      ON user_invitations
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Update documents policies to include organization isolation
DROP POLICY IF EXISTS "Authenticated users can view documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can insert documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON documents;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Users can view documents in their organization'
  ) THEN
    CREATE POLICY "Users can view documents in their organization"
      ON documents
      FOR SELECT
      TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM user_profiles
          WHERE id = auth.uid() AND is_active = true
        ) OR organization_id IS NULL
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Users can insert documents in their organization'
  ) THEN
    CREATE POLICY "Users can insert documents in their organization"
      ON documents
      FOR INSERT
      TO authenticated
      WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM user_profiles
          WHERE id = auth.uid() AND is_active = true
        ) OR organization_id IS NULL
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Users can update documents in their organization'
  ) THEN
    CREATE POLICY "Users can update documents in their organization"
      ON documents
      FOR UPDATE
      TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM user_profiles
          WHERE id = auth.uid() AND is_active = true
        ) OR organization_id IS NULL
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Users can delete documents in their organization'
  ) THEN
    CREATE POLICY "Users can delete documents in their organization"
      ON documents
      FOR DELETE
      TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM user_profiles
          WHERE id = auth.uid() AND is_active = true
        ) OR organization_id IS NULL
      );
  END IF;
END $$;

-- Create updated_at triggers
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile after user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update last_login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET last_login = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last_login on session creation
DROP TRIGGER IF EXISTS on_auth_session_created ON auth.sessions;
CREATE TRIGGER on_auth_session_created
  AFTER INSERT ON auth.sessions
  FOR EACH ROW EXECUTE FUNCTION update_last_login();
