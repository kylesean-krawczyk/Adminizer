/*
  ROLLBACK for 20261125170000_enable_user_invitations_rls.sql

  Not a migration: run manually in the Supabase SQL editor only if invitations
  stop working after the fix.

  WARNING: this reopens the hole the migration closed (anyone with the public
  key can read invitation tokens and create admin invitations). Prefer a
  targeted fix-forward; roll back only as a short-term emergency measure.

  Restores the pre-fix state exactly (it matches the snapshot taken on
  production on 2026-11-25). Compare with your saved snapshot output.
*/

BEGIN;

DROP POLICY IF EXISTS invitations_delete_org_admin ON public.user_invitations;
DROP POLICY IF EXISTS invitations_super_admin_all ON public.user_invitations;

DROP POLICY IF EXISTS "Anyone can view invitations by token" ON public.user_invitations;
CREATE POLICY "Anyone can view invitations by token"
  ON public.user_invitations FOR SELECT TO authenticated
  USING (true);

GRANT ALL ON TABLE public.user_invitations TO anon;

ALTER TABLE public.user_invitations DISABLE ROW LEVEL SECURITY;

COMMIT;
