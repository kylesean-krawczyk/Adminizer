/*
  # Enable row level security on user_invitations

  Production had RLS turned OFF on user_invitations while the table granted
  ALL privileges to `anon` and `authenticated`. Its existing policies were
  therefore ignored, and anyone holding the public anon key (shipped in the
  browser) could read every pending invitation and token, insert an admin
  invitation for any organization, and update or delete invitations.

  1. Enable RLS (the existing admin SELECT / INSERT policies start applying).
  2. Drop "Anyone can view invitations by token" (USING true): it exposed every
     invitation to any signed-in user. The app reads invitations by token only
     through SECURITY DEFINER RPCs (get_invitation_by_token,
     accept_user_invitation, repair_current_user_invitation_membership),
     which are not affected by RLS.
  3. Add a DELETE policy so org admins can still cancel their own org's
     invitations (the UI does this directly; no policy existed).
  4. Add a super admin policy (admins see everything).
  5. Revoke table privileges from `anon`. Signed-out visitors never need direct
     table access; the RPCs above run as the function owner.

  Safe to re-run. Rollback: supabase/rollbacks/20261125170000_enable_user_invitations_rls.rollback.sql
*/

BEGIN;

ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view invitations by token" ON public.user_invitations;

DROP POLICY IF EXISTS invitations_delete_org_admin ON public.user_invitations;
CREATE POLICY invitations_delete_org_admin
  ON public.user_invitations FOR DELETE TO authenticated
  USING (
    organization_id = public.get_user_organization_id()
    AND public.get_user_role() IN ('master_admin', 'admin')
    AND public.is_user_active()
  );

DROP POLICY IF EXISTS invitations_super_admin_all ON public.user_invitations;
CREATE POLICY invitations_super_admin_all
  ON public.user_invitations FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

REVOKE ALL ON TABLE public.user_invitations FROM anon;

COMMIT;

/*
  Verification (run separately after applying):

  -- Expect rls_on = true
  select relname, relrowsecurity as rls_on
  from pg_class where oid = 'public.user_invitations'::regclass;

  -- Expect exactly 4 policies:
  --   Admins can create invitations for their organization (INSERT)
  --   Admins can view invitations for their organization  (SELECT)
  --   invitations_delete_org_admin                         (DELETE)
  --   invitations_super_admin_all                          (ALL)
  select policyname, cmd from pg_policies
  where schemaname = 'public' and tablename = 'user_invitations'
  order by cmd, policyname;

  -- Expect no rows (anon has no table privileges)
  select privilege_type from information_schema.role_table_grants
  where table_schema = 'public' and table_name = 'user_invitations'
    and grantee = 'anon';
*/
