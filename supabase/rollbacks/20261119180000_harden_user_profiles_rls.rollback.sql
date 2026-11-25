/*
  ROLLBACK for 20261119180000_harden_user_profiles_rls.sql

  Not a migration: run manually in the Supabase SQL editor only if the
  hardening has to be undone. Requires the output you saved from
  20261119180000_harden_user_profiles_rls.snapshot.sql before applying.

  WARNING: restoring the old policies also restores the security holes the
  migration closed (any signed-in user could read every profile, and users
  could change their own role and organization). Roll back only to get the
  app working again, then fix forward.

  What it does:
    1. Removes the privileged-column trigger and its function.
    2. Drops the 10 policies the migration created.
    3. You paste the saved snapshot to recreate the previous policies and
       helper-function definitions.

  The helper functions (get_user_organization_id, get_user_role,
  is_user_active, is_super_admin) are NOT dropped: other tables' policies may
  depend on them. Step 3 restores their previous definitions if they existed.
*/

BEGIN;

-- 1. Trigger and guard function
DROP TRIGGER IF EXISTS guard_user_profile_privileged_columns ON public.user_profiles;
DROP FUNCTION IF EXISTS public.guard_user_profile_privileged_columns();

-- 2. Policies created by the migration
DROP POLICY IF EXISTS profiles_select_own ON public.user_profiles;
DROP POLICY IF EXISTS profiles_select_same_org ON public.user_profiles;
DROP POLICY IF EXISTS profiles_select_super_admin ON public.user_profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.user_profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.user_profiles;
DROP POLICY IF EXISTS profiles_update_org_admin ON public.user_profiles;
DROP POLICY IF EXISTS profiles_update_super_admin ON public.user_profiles;
DROP POLICY IF EXISTS profiles_delete_org_master_admin ON public.user_profiles;
DROP POLICY IF EXISTS profiles_delete_super_admin ON public.user_profiles;
DROP POLICY IF EXISTS profiles_service_role_all ON public.user_profiles;

-- 3. Paste the saved snapshot `restore_sql` statements here, in order
--    (functions first, then policies), before COMMIT.


COMMIT;

-- Verify: should list the same policies the snapshot captured
-- select policyname, cmd, roles from pg_policies
-- where tablename = 'user_profiles' order by cmd, policyname;
