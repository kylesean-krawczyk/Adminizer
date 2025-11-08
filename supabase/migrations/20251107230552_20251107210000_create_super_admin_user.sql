/*
  # Create Super Admin User

  1. Purpose
    - Create a super admin auth user for kyle.sean.krawczyk@gmail.com
    - Create corresponding user_profile with master_admin role
    - Link to the Primary Organization created earlier

  2. Security
    - Uses bcrypt password hashing through pgcrypto
    - Sets email as confirmed for immediate access
    - Grants full master_admin privileges

  3. Default Password
    - Password: AdminPassword123!
    - IMPORTANT: Change this immediately after first login

  4. Circular Dependency Handling
    - Uses DEFERRABLE constraint to handle circular dependency
    - Organizations.created_by references user_profiles.id
    - User_profiles.organization_id references organizations.id
*/

-- Ensure the foreign key constraint is DEFERRABLE
DO $$
BEGIN
  -- Drop existing constraint if it exists and is not deferrable
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'organizations_created_by_fkey'
    AND table_name = 'organizations'
  ) THEN
    -- Check if it's already deferrable
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'organizations_created_by_fkey'
      AND condeferrable = true
    ) THEN
      -- Not deferrable, so recreate it
      ALTER TABLE organizations DROP CONSTRAINT organizations_created_by_fkey;
      ALTER TABLE organizations
      ADD CONSTRAINT organizations_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES user_profiles(id)
      DEFERRABLE INITIALLY DEFERRED;

      RAISE NOTICE '✓ Recreated organizations_created_by_fkey as DEFERRABLE';
    ELSE
      RAISE NOTICE '✓ organizations_created_by_fkey is already DEFERRABLE';
    END IF;
  ELSE
    -- Constraint doesn't exist, create it as deferrable
    ALTER TABLE organizations
    ADD CONSTRAINT organizations_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES user_profiles(id)
    DEFERRABLE INITIALLY DEFERRED;

    RAISE NOTICE '✓ Created organizations_created_by_fkey as DEFERRABLE';
  END IF;
END $$;

-- Create super admin user in a single transaction with deferred constraints
DO $$
DECLARE
  user_count INTEGER;
  profile_count INTEGER;
BEGIN
  -- Set constraints to deferred for this transaction
  SET CONSTRAINTS organizations_created_by_fkey DEFERRED;

  -- Create the auth user with a secure password (Password: AdminPassword123!)
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
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✓ Super admin auth user created/verified';

  -- Create the user profile (trigger should handle this, but we'll do it explicitly for safety)
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
    organization_id = EXCLUDED.organization_id,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    active_vertical = EXCLUDED.active_vertical;

  RAISE NOTICE '✓ Super admin user profile created/updated';

  -- Update the organization to link back to the super admin
  UPDATE organizations
  SET created_by = '10000000-0000-0000-0000-000000000001'::uuid
  WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

  RAISE NOTICE '✓ Organization linked to super admin';

  -- Verify the user was created
  SELECT COUNT(*) INTO user_count FROM auth.users WHERE email = 'kyle.sean.krawczyk@gmail.com';
  SELECT COUNT(*) INTO profile_count FROM user_profiles WHERE email = 'kyle.sean.krawczyk@gmail.com';

  RAISE NOTICE 'Auth users created: %', user_count;
  RAISE NOTICE 'User profiles created: %', profile_count;

  IF user_count = 0 OR profile_count = 0 THEN
    RAISE EXCEPTION 'Failed to create super admin user';
  END IF;

  RAISE NOTICE '✓ Super admin user creation completed successfully';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create super admin user: % %', SQLSTATE, SQLERRM;
END $$;
