/*
  ============================================================================
  UPDATE RLS POLICIES FOR SUPER ADMIN ACCESS
  ============================================================================

  This script ensures that master_admin (super admin) role has full access
  to all tables in your application.

  WHAT THIS SCRIPT DOES:
  1. Adds super admin policies for user_profiles table
  2. Adds super admin policies for user_invitations table
  3. Adds super admin policies for organizations table
  4. Adds super admin policies for documents table
  5. Verifies all policies were created successfully

  ============================================================================
  INSTRUCTIONS:
  ============================================================================

  Run this script AFTER creating your super admin user.

  1. Open your Supabase Dashboard: https://supabase.com/dashboard
  2. Select your project
  3. Click "SQL Editor" in the left sidebar
  4. Click "New query" button
  5. Copy and paste this ENTIRE script
  6. Click "Run" button (or press Ctrl+Enter)
  7. Check the "Messages" tab for success confirmation

  ============================================================================
*/

DO $$
DECLARE
  policy_count integer;
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'UPDATING RLS POLICIES FOR SUPER ADMIN ACCESS';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';

  -- ============================================================================
  -- USER PROFILES - SUPER ADMIN POLICIES
  -- ============================================================================

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'Adding Super Admin Policies: user_profiles';
  RAISE NOTICE '------------------------------------------------------------';

  -- Super admins can view all profiles
  DROP POLICY IF EXISTS "Super admins can view all profiles" ON user_profiles;
  CREATE POLICY "Super admins can view all profiles"
    ON user_profiles
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles AS admin_profile
        WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'master_admin'
        AND admin_profile.is_active = true
        LIMIT 1
      )
    );

  -- Super admins can update all profiles
  DROP POLICY IF EXISTS "Super admins can update all profiles" ON user_profiles;
  CREATE POLICY "Super admins can update all profiles"
    ON user_profiles
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles AS admin_profile
        WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'master_admin'
        AND admin_profile.is_active = true
        LIMIT 1
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_profiles AS admin_profile
        WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'master_admin'
        AND admin_profile.is_active = true
        LIMIT 1
      )
    );

  -- Super admins can delete profiles
  DROP POLICY IF EXISTS "Super admins can delete profiles" ON user_profiles;
  CREATE POLICY "Super admins can delete profiles"
    ON user_profiles
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles AS admin_profile
        WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'master_admin'
        AND admin_profile.is_active = true
        LIMIT 1
      )
    );

  RAISE NOTICE '✓ Super admin policies added for user_profiles';
  RAISE NOTICE '';

  -- ============================================================================
  -- USER INVITATIONS - SUPER ADMIN POLICIES
  -- ============================================================================

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'Adding Super Admin Policies: user_invitations';
  RAISE NOTICE '------------------------------------------------------------';

  -- Super admins can view all invitations
  DROP POLICY IF EXISTS "Super admins can view all invitations" ON user_invitations;
  CREATE POLICY "Super admins can view all invitations"
    ON user_invitations
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles AS admin_profile
        WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'master_admin'
        AND admin_profile.is_active = true
        LIMIT 1
      )
    );

  -- Super admins can create invitations for any organization
  DROP POLICY IF EXISTS "Super admins can create all invitations" ON user_invitations;
  CREATE POLICY "Super admins can create all invitations"
    ON user_invitations
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_profiles AS admin_profile
        WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'master_admin'
        AND admin_profile.is_active = true
        LIMIT 1
      )
    );

  -- Super admins can update all invitations
  DROP POLICY IF EXISTS "Super admins can update all invitations" ON user_invitations;
  CREATE POLICY "Super admins can update all invitations"
    ON user_invitations
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles AS admin_profile
        WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'master_admin'
        AND admin_profile.is_active = true
        LIMIT 1
      )
    );

  -- Super admins can delete invitations
  DROP POLICY IF EXISTS "Super admins can delete invitations" ON user_invitations;
  CREATE POLICY "Super admins can delete invitations"
    ON user_invitations
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles AS admin_profile
        WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'master_admin'
        AND admin_profile.is_active = true
        LIMIT 1
      )
    );

  RAISE NOTICE '✓ Super admin policies added for user_invitations';
  RAISE NOTICE '';

  -- ============================================================================
  -- ORGANIZATIONS - SUPER ADMIN POLICIES
  -- ============================================================================

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'Adding Super Admin Policies: organizations';
  RAISE NOTICE '------------------------------------------------------------';

  -- Super admins can view all organizations
  DROP POLICY IF EXISTS "Super admins can view all organizations" ON organizations;
  CREATE POLICY "Super admins can view all organizations"
    ON organizations
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles AS admin_profile
        WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'master_admin'
        AND admin_profile.is_active = true
        LIMIT 1
      )
    );

  -- Super admins can update all organizations
  DROP POLICY IF EXISTS "Super admins can update all organizations" ON organizations;
  CREATE POLICY "Super admins can update all organizations"
    ON organizations
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles AS admin_profile
        WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'master_admin'
        AND admin_profile.is_active = true
        LIMIT 1
      )
    );

  -- Super admins can delete organizations
  DROP POLICY IF EXISTS "Super admins can delete organizations" ON organizations;
  CREATE POLICY "Super admins can delete organizations"
    ON organizations
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles AS admin_profile
        WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'master_admin'
        AND admin_profile.is_active = true
        LIMIT 1
      )
    );

  RAISE NOTICE '✓ Super admin policies added for organizations';
  RAISE NOTICE '';

  -- ============================================================================
  -- DOCUMENTS - SUPER ADMIN POLICIES
  -- ============================================================================

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'Adding Super Admin Policies: documents';
  RAISE NOTICE '------------------------------------------------------------';

  -- Super admins can view all documents
  DROP POLICY IF EXISTS "Super admins can view all documents" ON documents;
  CREATE POLICY "Super admins can view all documents"
    ON documents
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles AS admin_profile
        WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'master_admin'
        AND admin_profile.is_active = true
        LIMIT 1
      )
    );

  -- Super admins can insert documents for any organization
  DROP POLICY IF EXISTS "Super admins can insert all documents" ON documents;
  CREATE POLICY "Super admins can insert all documents"
    ON documents
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_profiles AS admin_profile
        WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'master_admin'
        AND admin_profile.is_active = true
        LIMIT 1
      )
    );

  -- Super admins can update all documents
  DROP POLICY IF EXISTS "Super admins can update all documents" ON documents;
  CREATE POLICY "Super admins can update all documents"
    ON documents
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles AS admin_profile
        WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'master_admin'
        AND admin_profile.is_active = true
        LIMIT 1
      )
    );

  -- Super admins can delete all documents
  DROP POLICY IF EXISTS "Super admins can delete all documents" ON documents;
  CREATE POLICY "Super admins can delete all documents"
    ON documents
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles AS admin_profile
        WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'master_admin'
        AND admin_profile.is_active = true
        LIMIT 1
      )
    );

  RAISE NOTICE '✓ Super admin policies added for documents';
  RAISE NOTICE '';

  -- ============================================================================
  -- VERIFICATION
  -- ============================================================================

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'Verifying Policies...';
  RAISE NOTICE '------------------------------------------------------------';

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND policyname LIKE 'Super admins%';

  RAISE NOTICE '  Total super admin policies created: %', policy_count;
  RAISE NOTICE '';

  IF policy_count >= 16 THEN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '✓✓✓ SUCCESS! All Super Admin Policies Created! ✓✓✓';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Your super admin user now has full access to:';
    RAISE NOTICE '  - All user profiles (view, update, delete)';
    RAISE NOTICE '  - All user invitations (view, create, update, delete)';
    RAISE NOTICE '  - All organizations (view, update, delete)';
    RAISE NOTICE '  - All documents (view, create, update, delete)';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now login as super admin and access all features!';
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
  ELSE
    RAISE WARNING 'Some policies may not have been created. Expected at least 16, got %', policy_count;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '✗✗✗ ERROR: Policy Update Failed ✗✗✗';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Error: % %', SQLSTATE, SQLERRM;
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE;
END $$;
