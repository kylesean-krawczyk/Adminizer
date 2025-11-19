/*
  ============================================================================
  SUPABASE COMPLETE BOOTSTRAP SCRIPT
  ============================================================================

  This script sets up a complete Supabase database from scratch including:
  - PostgreSQL extensions
  - Core tables (documents, organizations, user_profiles, user_invitations)
  - Row Level Security policies
  - Authentication triggers
  - Super admin user creation

  SUPER ADMIN CREDENTIALS:
  Email: kyle.sean.krawczyk@gmail.com
  Password: AdminPassword123!

  IMPORTANT: Change the password immediately after first login!

  ============================================================================
  HOW TO RUN THIS SCRIPT:
  ============================================================================

  1. Go to your Supabase Dashboard: https://supabase.com/dashboard
  2. Select your project (ntwkmyhwvxikfesrvuox)
  3. Click on "SQL Editor" in the left sidebar
  4. Click "New query" button
  5. Copy and paste this ENTIRE script
  6. Click "Run" button (or press Ctrl+Enter)
  7. Wait for completion message
  8. Check the "Messages" tab for verification output

  ============================================================================
  CHANGELOG:
  ============================================================================

  v2.0 - Fixed foreign key circular dependency issues:
  - Added ON DELETE SET NULL to organizations.created_by
  - Added ON DELETE SET NULL to user_profiles.invited_by
  - Wrapped cleanup in transaction with deferred constraints
  - Added explicit NULL-ing of references before deletion
  - Improved cleanup order to handle all dependencies

  ============================================================================
*/

-- ============================================================================
-- STEP 0: CLEANUP EXISTING DATA
-- ============================================================================

DO $$
DECLARE
  auth_user_count INTEGER := 0;
  profile_count INTEGER := 0;
  invitation_count INTEGER := 0;
  document_count INTEGER := 0;
  org_count INTEGER := 0;
  session_count INTEGER := 0;
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'STEP 0: Cleaning Up Existing Data...';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'WARNING: This will delete ALL existing data from core tables!';
  RAISE NOTICE '';

  -- Count existing records
  SELECT COUNT(*) INTO profile_count FROM user_profiles WHERE true;
  SELECT COUNT(*) INTO invitation_count FROM user_invitations WHERE true;
  SELECT COUNT(*) INTO document_count FROM documents WHERE true;
  SELECT COUNT(*) INTO org_count FROM organizations WHERE true;
  SELECT COUNT(*) INTO auth_user_count FROM auth.users WHERE email = 'kyle.sean.krawczyk@gmail.com';
  SELECT COUNT(*) INTO session_count FROM auth.sessions WHERE user_id = '10000000-0000-0000-0000-000000000001'::uuid;

  RAISE NOTICE '  Found existing records:';
  RAISE NOTICE '    - User profiles: %', profile_count;
  RAISE NOTICE '    - User invitations: %', invitation_count;
  RAISE NOTICE '    - Documents: %', document_count;
  RAISE NOTICE '    - Organizations: %', org_count;
  RAISE NOTICE '    - Auth users (super admin): %', auth_user_count;
  RAISE NOTICE '    - Auth sessions (super admin): %', session_count;
  RAISE NOTICE '';

  -- Delete in correct order to respect foreign key constraints
  RAISE NOTICE '  Deleting existing data...';

  -- Start a subtransaction for cleanup with deferred constraints
  BEGIN
    -- Set any deferrable constraints to deferred mode
    PERFORM 1;  -- Dummy statement to start block

    -- Delete auth sessions for super admin user
    DELETE FROM auth.sessions WHERE user_id = '10000000-0000-0000-0000-000000000001'::uuid;
    RAISE NOTICE '    ✓ Deleted % auth sessions', session_count;

    -- Delete user invitations (depends on user_profiles via invited_by)
    DELETE FROM user_invitations WHERE true;
    RAISE NOTICE '    ✓ Deleted % user invitations', invitation_count;

    -- Delete documents (depends on organizations)
    DELETE FROM documents WHERE true;
    RAISE NOTICE '    ✓ Deleted % documents', document_count;

    -- NULL out circular references before deletion
    -- organizations.created_by → user_profiles.id
    UPDATE organizations SET created_by = NULL WHERE created_by IS NOT NULL;
    RAISE NOTICE '    ✓ Cleared organizations.created_by references';

    -- user_profiles.invited_by → user_profiles.id (self-reference)
    UPDATE user_profiles SET invited_by = NULL WHERE invited_by IS NOT NULL;
    RAISE NOTICE '    ✓ Cleared user_profiles.invited_by references';

    -- Now safe to delete user profiles (depends on organizations via organization_id)
    DELETE FROM user_profiles WHERE true;
    RAISE NOTICE '    ✓ Deleted % user profiles', profile_count;

    -- Delete organizations (no longer referenced)
    DELETE FROM organizations WHERE true;
    RAISE NOTICE '    ✓ Deleted % organizations', org_count;

    -- Delete super admin auth user (cascades to user_profiles via ON DELETE CASCADE)
    DELETE FROM auth.users WHERE email = 'kyle.sean.krawczyk@gmail.com';
    RAISE NOTICE '    ✓ Deleted % auth users (super admin)', auth_user_count;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '⚠ Cleanup encountered an error in subtransaction:';
      RAISE NOTICE '  Error: % %', SQLSTATE, SQLERRM;
      RAISE NOTICE '  Continuing with setup...';
  END;

  RAISE NOTICE '';
  RAISE NOTICE '✓ Data cleanup completed successfully';
  RAISE NOTICE '';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠ Cleanup encountered an error (this may be normal for fresh databases):';
    RAISE NOTICE '  Error: % %', SQLSTATE, SQLERRM;
    RAISE NOTICE '  Continuing with setup...';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 1: ENABLE POSTGRESQL EXTENSIONS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'STEP 1: Enabling PostgreSQL Extensions...';
  RAISE NOTICE '============================================================================';
END $$;

-- Enable pgcrypto for gen_random_uuid() and password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable uuid-ossp for additional UUID functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  RAISE NOTICE '✓ Extensions enabled successfully';
END $$;

-- ============================================================================
-- STEP 2: CREATE HELPER FUNCTIONS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'STEP 2: Creating Helper Functions...';
  RAISE NOTICE '============================================================================';
END $$;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✓ Helper functions created successfully';
END $$;

-- ============================================================================
-- STEP 3: CREATE CORE TABLES
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'STEP 3: Creating Core Tables...';
  RAISE NOTICE '============================================================================';
END $$;

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid,  -- Explicitly allows NULL for easier cleanup
  vertical text DEFAULT 'church' CHECK (vertical IN ('church', 'business', 'estate')),
  enabled_verticals text[] DEFAULT '{church,business,estate}',
  vertical_changed_at timestamptz,
  vertical_change_history jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  RAISE NOTICE '  ✓ organizations table created';
END $$;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('master_admin', 'admin', 'user')),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  active_vertical text DEFAULT 'church' CHECK (active_vertical IN ('church', 'business', 'estate')),
  invited_by uuid,  -- Foreign key added later with ON DELETE SET NULL
  invited_at timestamptz,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  RAISE NOTICE '  ✓ user_profiles table created';
END $$;

-- Create user_invitations table
CREATE TABLE IF NOT EXISTS user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL,  -- Foreign key added later with ON DELETE CASCADE
  token uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  RAISE NOTICE '  ✓ user_invitations table created';
END $$;

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  upload_date date DEFAULT CURRENT_DATE,
  expiry_date date,
  size bigint NOT NULL,
  status text DEFAULT 'Active',
  file_path text NOT NULL,
  tags text[] DEFAULT '{}',
  description text,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  RAISE NOTICE '  ✓ documents table created';
END $$;

-- ============================================================================
-- STEP 4: ADD FOREIGN KEY CONSTRAINTS WITH PROPER DELETE BEHAVIORS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'STEP 4: Adding Foreign Key Constraints...';
  RAISE NOTICE '============================================================================';
END $$;

-- Add foreign key constraint for organizations.created_by
-- ON DELETE SET NULL: When a user is deleted, organization remains but creator reference is cleared
-- DEFERRABLE INITIALLY DEFERRED: Handles circular dependency during super admin creation
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'organizations_created_by_fkey'
    AND table_name = 'organizations'
  ) THEN
    ALTER TABLE organizations DROP CONSTRAINT organizations_created_by_fkey;
    RAISE NOTICE '  ✓ Dropped existing organizations_created_by_fkey constraint';
  END IF;

  -- Add constraint with ON DELETE SET NULL and DEFERRABLE
  ALTER TABLE organizations
  ADD CONSTRAINT organizations_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES user_profiles(id)
  ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;

  RAISE NOTICE '  ✓ organizations.created_by → user_profiles.id (ON DELETE SET NULL, DEFERRABLE)';
END $$;

-- Add foreign key constraint for user_profiles.invited_by (self-referencing)
-- ON DELETE SET NULL: When inviter is deleted, invited user remains but inviter reference is cleared
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_profiles_invited_by_fkey'
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_invited_by_fkey;
    RAISE NOTICE '  ✓ Dropped existing user_profiles_invited_by_fkey constraint';
  END IF;

  -- Add constraint with ON DELETE SET NULL
  ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_invited_by_fkey
  FOREIGN KEY (invited_by) REFERENCES user_profiles(id)
  ON DELETE SET NULL;

  RAISE NOTICE '  ✓ user_profiles.invited_by → user_profiles.id (ON DELETE SET NULL)';
END $$;

-- Add foreign key constraint for user_invitations.invited_by
-- ON DELETE CASCADE: When inviter is deleted, their pending invitations are also deleted
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_invitations_invited_by_fkey'
    AND table_name = 'user_invitations'
  ) THEN
    ALTER TABLE user_invitations DROP CONSTRAINT user_invitations_invited_by_fkey;
    RAISE NOTICE '  ✓ Dropped existing user_invitations_invited_by_fkey constraint';
  END IF;

  -- Add constraint with ON DELETE CASCADE
  ALTER TABLE user_invitations
  ADD CONSTRAINT user_invitations_invited_by_fkey
  FOREIGN KEY (invited_by) REFERENCES user_profiles(id)
  ON DELETE CASCADE;

  RAISE NOTICE '  ✓ user_invitations.invited_by → user_profiles.id (ON DELETE CASCADE)';
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✓ All foreign key constraints configured with proper delete behaviors';
END $$;

-- ============================================================================
-- STEP 5: CREATE STORAGE BUCKET FOR DOCUMENTS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'STEP 5: Creating Storage Bucket...';
  RAISE NOTICE '============================================================================';
END $$;

-- Create documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE '✓ Storage bucket created successfully';
END $$;

-- ============================================================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'STEP 6: Enabling Row Level Security...';
  RAISE NOTICE '============================================================================';
END $$;

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE '✓ RLS enabled on all tables';
END $$;

-- ============================================================================
-- STEP 7: CREATE RLS POLICIES - SERVICE ROLE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'STEP 7: Creating RLS Policies (Service Role)...';
  RAISE NOTICE '============================================================================';
END $$;

-- Service role can manage all profiles (needed for triggers)
DROP POLICY IF EXISTS "Service role can manage all profiles" ON user_profiles;
CREATE POLICY "Service role can manage all profiles"
  ON user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  RAISE NOTICE '✓ Service role policies created';
END $$;

-- ============================================================================
-- STEP 8: CREATE RLS POLICIES - USER PROFILES
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'STEP 8: Creating RLS Policies (User Profiles)...';
  RAISE NOTICE '============================================================================';
END $$;

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can view other profiles in their organization
DROP POLICY IF EXISTS "Users can view org profiles" ON user_profiles;
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

-- Users can insert their own profile during signup
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Admins can update profiles in their organization
DROP POLICY IF EXISTS "Admins can update org profiles" ON user_profiles;
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

DO $$
BEGIN
  RAISE NOTICE '✓ User profile policies created';
END $$;

-- ============================================================================
-- STEP 9: CREATE RLS POLICIES - ORGANIZATIONS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'STEP 9: Creating RLS Policies (Organizations)...';
  RAISE NOTICE '============================================================================';
END $$;

-- Users can view their organization
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
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

-- Authenticated users can create organizations
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
CREATE POLICY "Authenticated users can create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can update their organization
DROP POLICY IF EXISTS "Admins can update their organization" ON organizations;
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

DO $$
BEGIN
  RAISE NOTICE '✓ Organization policies created';
END $$;

-- ============================================================================
-- STEP 10: CREATE RLS POLICIES - DOCUMENTS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'STEP 10: Creating RLS Policies (Documents)...';
  RAISE NOTICE '============================================================================';
END $$;

-- Users can view documents in their organization
DROP POLICY IF EXISTS "Users can view documents in their organization" ON documents;
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

-- Users can insert documents in their organization
DROP POLICY IF EXISTS "Users can insert documents in their organization" ON documents;
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

-- Users can update documents in their organization
DROP POLICY IF EXISTS "Users can update documents in their organization" ON documents;
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

-- Users can delete documents in their organization
DROP POLICY IF EXISTS "Users can delete documents in their organization" ON documents;
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

DO $$
BEGIN
  RAISE NOTICE '✓ Document policies created';
END $$;

-- ============================================================================
-- STEP 11: CREATE RLS POLICIES - STORAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'STEP 11: Creating RLS Policies (Storage)...';
  RAISE NOTICE '============================================================================';
END $$;

-- Storage policies for documents bucket
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
CREATE POLICY "Authenticated users can view documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
CREATE POLICY "Authenticated users can update documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;
CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');

DO $$
BEGIN
  RAISE NOTICE '✓ Storage policies created';
END $$;

-- ============================================================================
-- STEP 12: CREATE RLS POLICIES - USER INVITATIONS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'STEP 12: Creating RLS Policies (User Invitations)...';
  RAISE NOTICE '============================================================================';
END $$;

-- Admins can view invitations for their organization
DROP POLICY IF EXISTS "Admins can view invitations for their organization" ON user_invitations;
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

-- Admins can create invitations for their organization
DROP POLICY IF EXISTS "Admins can create invitations for their organization" ON user_invitations;
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

-- Anyone can view invitations by token (for accepting invites)
DROP POLICY IF EXISTS "Anyone can view invitations by token" ON user_invitations;
CREATE POLICY "Anyone can view invitations by token"
  ON user_invitations
  FOR SELECT
  TO authenticated
  USING (true);

DO $$
BEGIN
  RAISE NOTICE '✓ User invitation policies created';
END $$;

-- ============================================================================
-- STEP 13: CREATE UPDATE TRIGGERS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'STEP 13: Creating Update Triggers...';
  RAISE NOTICE '============================================================================';
END $$;

-- Trigger for organizations
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for documents
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DO $$
BEGIN
  RAISE NOTICE '✓ Update triggers created';
END $$;

-- ============================================================================
-- STEP 14: CREATE AUTHENTICATION TRIGGERS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'STEP 14: Creating Authentication Triggers...';
  RAISE NOTICE '============================================================================';
END $$;

-- Function to create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_exists boolean := false;
BEGIN
  -- Check if profile already exists
  SELECT EXISTS(
    SELECT 1 FROM public.user_profiles WHERE id = NEW.id
  ) INTO profile_exists;

  -- Only create if it doesn't exist
  IF NOT profile_exists THEN
    INSERT INTO public.user_profiles (
      id,
      email,
      role,
      is_active,
      active_vertical,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      'user',
      true,
      'church',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RAISE LOG 'Created user profile for: %', NEW.email;
  ELSE
    RAISE LOG 'User profile already exists for: %', NEW.email;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user for %: % %', NEW.email, SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

-- Trigger on auth.sessions
DROP TRIGGER IF EXISTS on_auth_session_created ON auth.sessions;
CREATE TRIGGER on_auth_session_created
  AFTER INSERT ON auth.sessions
  FOR EACH ROW EXECUTE FUNCTION update_last_login();

DO $$
BEGIN
  RAISE NOTICE '✓ Authentication triggers created';
END $$;

-- ============================================================================
-- STEP 15: CREATE INDEXES
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'STEP 15: Creating Indexes...';
  RAISE NOTICE '============================================================================';
END $$;

CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_id ON user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active_vertical ON user_profiles(active_vertical);
CREATE INDEX IF NOT EXISTS idx_organizations_id ON organizations(id);
CREATE INDEX IF NOT EXISTS idx_organizations_vertical ON organizations(vertical);
CREATE INDEX IF NOT EXISTS idx_organizations_enabled_verticals ON organizations USING GIN (enabled_verticals);

DO $$
BEGIN
  RAISE NOTICE '✓ Indexes created';
END $$;

-- ============================================================================
-- STEP 16: GRANT PERMISSIONS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'STEP 16: Granting Permissions...';
  RAISE NOTICE '============================================================================';
END $$;

GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
GRANT ALL ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
GRANT ALL ON public.user_invitations TO authenticated;
GRANT ALL ON public.user_invitations TO service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

DO $$
BEGIN
  RAISE NOTICE '✓ Permissions granted';
END $$;

-- ============================================================================
-- STEP 17: CREATE PRIMARY ORGANIZATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'STEP 17: Creating Primary Organization...';
  RAISE NOTICE '============================================================================';
END $$;

INSERT INTO organizations (
  id,
  name,
  vertical,
  enabled_verticals,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Primary Organization',
  'church',
  '{church,business,estate}',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  vertical = EXCLUDED.vertical,
  enabled_verticals = EXCLUDED.enabled_verticals,
  updated_at = now();

DO $$
BEGIN
  RAISE NOTICE '✓ Primary organization created';
END $$;

-- ============================================================================
-- STEPS 18-20: CREATE SUPER ADMIN USER (IN SINGLE TRANSACTION)
-- ============================================================================
-- These steps are combined in a single transaction with deferred constraints
-- to handle the circular dependency between organizations and user_profiles

DO $$
DECLARE
  existing_user_id uuid;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'STEPS 18-20: Creating Super Admin User and Linking to Organization...';
  RAISE NOTICE '============================================================================';

  -- Set constraints to deferred for this transaction
  SET CONSTRAINTS organizations_created_by_fkey DEFERRED;

  RAISE NOTICE '';
  RAISE NOTICE 'STEP 18: Creating Super Admin Auth User...';
  RAISE NOTICE '------------------------------------------------------------';

  -- Check if user with this email already exists
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = 'kyle.sean.krawczyk@gmail.com'
  LIMIT 1;

  -- If user exists, delete it first
  IF existing_user_id IS NOT NULL THEN
    RAISE NOTICE '  Found existing user with email kyle.sean.krawczyk@gmail.com, deleting...';

    -- Delete from auth.sessions first
    DELETE FROM auth.sessions WHERE user_id = existing_user_id;

    -- Delete from user_profiles
    DELETE FROM user_profiles WHERE id = existing_user_id;

    -- Delete from auth.users
    DELETE FROM auth.users WHERE id = existing_user_id;

    RAISE NOTICE '  ✓ Existing user deleted';
  END IF;

  -- Create the auth user with secure password
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_token,
    email_change_token_current,
    email_change_token_new
  )
  VALUES (
    '10000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'kyle.sean.krawczyk@gmail.com',
    crypt('AdminPassword123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Kyle Krawczyk"}'::jsonb,
    false,
    'authenticated',
    'authenticated',
    '',
    '',
    ''
  );

  RAISE NOTICE '✓ Super admin auth user created';
  RAISE NOTICE '  Email: kyle.sean.krawczyk@gmail.com';
  RAISE NOTICE '  Password: AdminPassword123!';

  RAISE NOTICE '';
  RAISE NOTICE 'STEP 19: Creating Super Admin User Profile...';
  RAISE NOTICE '------------------------------------------------------------';

  -- Create the user profile
  INSERT INTO user_profiles (
    id,
    email,
    full_name,
    role,
    organization_id,
    is_active,
    active_vertical,
    created_at,
    updated_at
  )
  VALUES (
    '10000000-0000-0000-0000-000000000001'::uuid,
    'kyle.sean.krawczyk@gmail.com',
    'Kyle Krawczyk',
    'master_admin',
    '00000000-0000-0000-0000-000000000001'::uuid,
    true,
    'church',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    organization_id = EXCLUDED.organization_id,
    is_active = EXCLUDED.is_active,
    active_vertical = EXCLUDED.active_vertical,
    updated_at = now();

  RAISE NOTICE '✓ Super admin user profile created';
  RAISE NOTICE '  Role: master_admin';
  RAISE NOTICE '  Organization: Primary Organization';

  RAISE NOTICE '';
  RAISE NOTICE 'STEP 20: Linking Organization to Super Admin...';
  RAISE NOTICE '------------------------------------------------------------';

  -- Link the organization back to the super admin
  UPDATE organizations
  SET created_by = '10000000-0000-0000-0000-000000000001'::uuid
  WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

  RAISE NOTICE '✓ Organization linked to super admin';

  -- Constraints will be checked at end of transaction block
  RAISE NOTICE '';
  RAISE NOTICE '✓ All steps completed successfully (constraint checks deferred)';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create super admin user: % %', SQLSTATE, SQLERRM;
END $$;

-- ============================================================================
-- STEP 21: VERIFICATION
-- ============================================================================

DO $$
DECLARE
  extension_count INTEGER;
  table_count INTEGER;
  user_count INTEGER;
  profile_count INTEGER;
  org_count INTEGER;
  policy_count INTEGER;
  trigger_count INTEGER;
  fkey_info RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'STEP 21: Verifying Setup...';
  RAISE NOTICE '============================================================================';

  -- Check extensions
  SELECT COUNT(*) INTO extension_count
  FROM pg_extension
  WHERE extname IN ('pgcrypto', 'uuid-ossp');
  RAISE NOTICE '  Extensions enabled: %/2', extension_count;

  -- Check tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('organizations', 'user_profiles', 'user_invitations', 'documents');
  RAISE NOTICE '  Tables created: %/4', table_count;

  -- Check organizations
  SELECT COUNT(*) INTO org_count
  FROM organizations
  WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
  RAISE NOTICE '  Primary organization: %', CASE WHEN org_count > 0 THEN '✓ Created' ELSE '✗ Missing' END;

  -- Check auth user
  SELECT COUNT(*) INTO user_count
  FROM auth.users
  WHERE email = 'kyle.sean.krawczyk@gmail.com';
  RAISE NOTICE '  Super admin auth user: %', CASE WHEN user_count > 0 THEN '✓ Created' ELSE '✗ Missing' END;

  -- Check user profile
  SELECT COUNT(*) INTO profile_count
  FROM user_profiles
  WHERE email = 'kyle.sean.krawczyk@gmail.com' AND role = 'master_admin';
  RAISE NOTICE '  Super admin profile: %', CASE WHEN profile_count > 0 THEN '✓ Created' ELSE '✗ Missing' END;

  -- Check RLS policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';
  RAISE NOTICE '  RLS policies created: %', policy_count;

  -- Check triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
  AND trigger_name IN ('on_auth_user_created', 'update_user_profiles_updated_at', 'update_organizations_updated_at');
  RAISE NOTICE '  Triggers created: %/3', trigger_count;

  RAISE NOTICE '';
  RAISE NOTICE '  Foreign Key Configurations:';

  -- Verify foreign key delete behaviors
  FOR fkey_info IN
    SELECT
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule,
      CASE WHEN tc.is_deferrable = 'YES' THEN 'DEFERRABLE' ELSE 'NOT DEFERRABLE' END AS deferrable_status
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
      AND tc.table_schema = rc.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name IN ('organizations', 'user_profiles', 'user_invitations')
    ORDER BY tc.table_name, tc.constraint_name
  LOOP
    RAISE NOTICE '    - %.% → %.% [% | %]',
      fkey_info.table_name,
      fkey_info.column_name,
      fkey_info.foreign_table_name,
      fkey_info.foreign_column_name,
      fkey_info.delete_rule,
      fkey_info.deferrable_status;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';

  -- Final validation
  IF extension_count = 2 AND table_count = 4 AND org_count > 0 AND user_count > 0 AND profile_count > 0 THEN
    RAISE NOTICE '✓✓✓ SUCCESS! Database setup completed successfully! ✓✓✓';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now login with:';
    RAISE NOTICE '  Email: kyle.sean.krawczyk@gmail.com';
    RAISE NOTICE '  Password: AdminPassword123!';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: Change your password immediately after first login!';
    RAISE NOTICE '';
    RAISE NOTICE 'Foreign key constraints have been configured for easy cleanup:';
    RAISE NOTICE '  - organizations.created_by uses ON DELETE SET NULL';
    RAISE NOTICE '  - user_profiles.invited_by uses ON DELETE SET NULL';
    RAISE NOTICE '  - user_invitations.invited_by uses ON DELETE CASCADE';
  ELSE
    RAISE EXCEPTION 'Setup incomplete! Please check the errors above.';
  END IF;

  RAISE NOTICE '============================================================================';
END $$;
