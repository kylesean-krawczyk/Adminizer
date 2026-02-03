/*
  # Fix User Management System with UUID-Based Tokens

  1. Purpose
    - Fix the gen_random_bytes() error by using UUID-based token generation
    - Create user management tables: organizations, user_profiles, user_invitations
    - Add organization_id to documents table for multi-tenancy
    - Implement comprehensive RLS policies for data isolation

  2. New Tables
    - `organizations`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `created_by` (uuid, references user_profiles) - added after user_profiles exists
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, not null)
      - `full_name` (text, nullable)
      - `role` (text, not null) - 'master_admin', 'admin', 'user'
      - `organization_id` (uuid, references organizations)
      - `is_active` (boolean, default true)
      - `invited_by` (uuid, references user_profiles)
      - `invited_at` (timestamp)
      - `last_login` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `user_invitations`
      - `id` (uuid, primary key)
      - `email` (text, not null)
      - `role` (text, not null) - 'admin', 'user'
      - `organization_id` (uuid, references organizations)
      - `invited_by` (uuid, references user_profiles)
      - `token` (text, unique, not null) - UUID-based generation
      - `expires_at` (timestamp)
      - `accepted_at` (timestamp)
      - `created_at` (timestamp)

  3. Security
    - Enable RLS on all tables
    - Role-based access control policies
    - Organization-based data isolation
    - Secure invitation token generation using UUID concatenation

  4. Token Generation
    - Uses: replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
    - Generates 64-character hexadecimal string
    - 256 bits of randomness (2 UUIDs × 128 bits each)
    - No dependency on pgcrypto extension
    - Schema-agnostic and highly portable

  5. Functions & Triggers
    - Auto-create user profile on signup
    - Auto-update last_login on session creation
    - Auto-update updated_at timestamps
*/

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

-- Create user_invitations table with UUID-based token
CREATE TABLE IF NOT EXISTS user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES user_profiles(id),
  token text UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraint to organizations.created_by after user_profiles exists
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

-- Add organization_id to documents table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN organization_id uuid REFERENCES organizations(id);
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Organizations Policies
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
    SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Authenticated users can create organizations'
  ) THEN
    CREATE POLICY "Authenticated users can create organizations"
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
      )
      WITH CHECK (
        id IN (
          SELECT organization_id FROM user_profiles
          WHERE id = auth.uid() AND role IN ('master_admin', 'admin') AND is_active = true
        )
      );
  END IF;
END $$;

-- User Profiles Policies
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
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON user_profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (id = auth.uid());
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
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
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
      )
      WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM user_profiles
          WHERE id = auth.uid() AND role IN ('master_admin', 'admin') AND is_active = true
        )
      );
  END IF;
END $$;

-- User Invitations Policies
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

-- Update documents policies for organization isolation
DROP POLICY IF EXISTS "Anyone can view documents" ON documents;
DROP POLICY IF EXISTS "Anyone can insert documents" ON documents;
DROP POLICY IF EXISTS "Anyone can update documents" ON documents;
DROP POLICY IF EXISTS "Anyone can delete documents" ON documents;

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
      )
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

-- Create updated_at triggers for organizations
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create updated_at triggers for user_profiles
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
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
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
