/*
  # Fix Organizations Foreign Key to be DEFERRABLE

  1. Purpose
    - Fix the organizations_created_by_fkey constraint to be DEFERRABLE
    - This resolves circular dependency issues during super admin creation
    - Organizations.created_by references user_profiles.id
    - User_profiles.organization_id references organizations.id

  2. Changes
    - Drop existing organizations_created_by_fkey if not deferrable
    - Recreate as DEFERRABLE INITIALLY DEFERRED
    - Allows constraint checking to be deferred until end of transaction

  3. Impact
    - Existing data is unaffected
    - Future super admin creation will work correctly
    - Constraint still enforces referential integrity
*/

-- Fix the foreign key constraint to be DEFERRABLE
DO $$
BEGIN
  -- Check if constraint exists
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
      RAISE NOTICE 'Dropping non-deferrable constraint...';
      ALTER TABLE organizations DROP CONSTRAINT organizations_created_by_fkey;

      RAISE NOTICE 'Creating deferrable constraint...';
      ALTER TABLE organizations
      ADD CONSTRAINT organizations_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES user_profiles(id)
      DEFERRABLE INITIALLY DEFERRED;

      RAISE NOTICE '✓ Successfully recreated organizations_created_by_fkey as DEFERRABLE';
    ELSE
      RAISE NOTICE '✓ organizations_created_by_fkey is already DEFERRABLE - no changes needed';
    END IF;
  ELSE
    -- Constraint doesn't exist, create it as deferrable
    RAISE NOTICE 'Creating new deferrable constraint...';
    ALTER TABLE organizations
    ADD CONSTRAINT organizations_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES user_profiles(id)
    DEFERRABLE INITIALLY DEFERRED;

    RAISE NOTICE '✓ Successfully created organizations_created_by_fkey as DEFERRABLE';
  END IF;
END $$;
