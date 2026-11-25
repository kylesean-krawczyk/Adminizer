/*
  # Harden user_profiles row level security

  Production had 13 overlapping policies on user_profiles, accumulated from
  manual fix scripts. Several were unsafe:

  - users_view_same_org: its subquery selected the *outer* row's
    organization_id from an unrelated `users` table, so it was true for any
    authenticated user with a `users` row -> every profile in every org visible.
  - user_profiles_select_admin / _update_admin / _delete_admin: any
    master_admin (anyone who creates an org) could read, edit or delete
    profiles in *every* organization.
  - "Users can update own profile" / user_profiles_update_own had no column
    limits, so a user could set their own role, organization_id or
    is_super_admin and promote themselves into any organization.

  1. Helper functions (SECURITY DEFINER, fixed search_path) used by policies so
     they never re-enter user_profiles RLS (no recursion).
  2. Drop every existing policy on user_profiles and recreate a minimal set:
     - SELECT: own row; active members see their own org; super admins see all
     - INSERT: own row only, as a plain user with no org
     - UPDATE: own row; org admins within their org; super admins
     - DELETE: master admin within their org (not self); super admins
     - service_role: full access
  3. A BEFORE UPDATE trigger that guards privileged columns (organization_id,
     is_super_admin, role, is_active, default_permission_template,
     permission_overrides) on direct client writes. SECURITY DEFINER RPCs
     (invites, org creation, member deletion) run as the function owner and
     are not affected.

  Safe to re-run.
*/

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Helper functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id FROM public.user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_user_active()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_active FROM public.user_profiles WHERE id = auth.uid() LIMIT 1),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.user_profiles WHERE id = auth.uid() AND is_active = true),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_user_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_active() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Replace all policies on user_profiles
-- ---------------------------------------------------------------------------

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_profiles', p.policyname);
  END LOOP;
END $$;

-- SELECT
CREATE POLICY profiles_select_own
  ON public.user_profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY profiles_select_same_org
  ON public.user_profiles FOR SELECT TO authenticated
  USING (
    organization_id IS NOT NULL
    AND organization_id = public.get_user_organization_id()
    AND public.is_user_active()
  );

CREATE POLICY profiles_select_super_admin
  ON public.user_profiles FOR SELECT TO authenticated
  USING (public.is_super_admin());

-- INSERT (profile recovery when the signup trigger did not run)
CREATE POLICY profiles_insert_own
  ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND role = 'user'
    AND organization_id IS NULL
    AND COALESCE(is_super_admin, false) = false
  );

-- UPDATE (privileged columns are additionally guarded by the trigger below)
CREATE POLICY profiles_update_own
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_org_admin
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (
    organization_id IS NOT NULL
    AND organization_id = public.get_user_organization_id()
    AND public.get_user_role() IN ('master_admin', 'admin')
    AND public.is_user_active()
  )
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY profiles_update_super_admin
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- DELETE
CREATE POLICY profiles_delete_org_master_admin
  ON public.user_profiles FOR DELETE TO authenticated
  USING (
    id <> auth.uid()
    AND organization_id IS NOT NULL
    AND organization_id = public.get_user_organization_id()
    AND public.get_user_role() = 'master_admin'
    AND public.is_user_active()
  );

CREATE POLICY profiles_delete_super_admin
  ON public.user_profiles FOR DELETE TO authenticated
  USING (public.is_super_admin() AND id <> auth.uid());

-- Service role (Edge Functions, dashboard)
CREATE POLICY profiles_service_role_all
  ON public.user_profiles FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 3. Guard privileged columns on direct client updates
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_user_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_actor_role text;
  v_actor_org uuid;
  -- Compare via jsonb so the trigger keeps working even if an optional column
  -- (e.g. permission_overrides) does not exist in this database.
  v_old jsonb;
  v_new jsonb;
BEGIN
  -- Only police direct API writes. SECURITY DEFINER functions, the dashboard
  -- and service_role run as other database roles and are trusted.
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF public.is_super_admin() THEN
    RETURN NEW;
  END IF;

  v_old := to_jsonb(OLD);
  v_new := to_jsonb(NEW);

  IF v_new->'organization_id' IS DISTINCT FROM v_old->'organization_id' THEN
    RAISE EXCEPTION 'organization_id can only be changed through an invitation or organization setup'
      USING ERRCODE = '42501';
  END IF;

  IF v_new->'is_super_admin' IS DISTINCT FROM v_old->'is_super_admin' THEN
    RAISE EXCEPTION 'is_super_admin cannot be changed' USING ERRCODE = '42501';
  END IF;

  IF v_new->'role' IS DISTINCT FROM v_old->'role'
     OR v_new->'is_active' IS DISTINCT FROM v_old->'is_active'
     OR v_new->'default_permission_template' IS DISTINCT FROM v_old->'default_permission_template'
     OR v_new->'permission_overrides' IS DISTINCT FROM v_old->'permission_overrides'
  THEN
    IF OLD.id = auth.uid() THEN
      RAISE EXCEPTION 'You cannot change your own role, status or permissions'
        USING ERRCODE = '42501';
    END IF;

    v_actor_role := COALESCE(public.get_user_role(), '');
    v_actor_org := public.get_user_organization_id();

    IF v_actor_org IS NULL
       OR v_actor_org IS DISTINCT FROM OLD.organization_id
       OR v_actor_role NOT IN ('master_admin', 'admin')
       OR NOT public.is_user_active()
    THEN
      RAISE EXCEPTION 'Insufficient permissions' USING ERRCODE = '42501';
    END IF;

    -- Nobody but a super admin can modify a master admin's role/status here
    IF v_old->>'role' = 'master_admin' THEN
      RAISE EXCEPTION 'The master admin can only be changed by a super admin'
        USING ERRCODE = '42501';
    END IF;

    IF v_new->'role' IS DISTINCT FROM v_old->'role' THEN
      IF v_actor_role <> 'master_admin' THEN
        RAISE EXCEPTION 'Only the master admin can change roles' USING ERRCODE = '42501';
      END IF;
      IF COALESCE(v_new->>'role', '') NOT IN ('admin', 'user') THEN
        RAISE EXCEPTION 'Role must be admin or user' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_user_profile_privileged_columns ON public.user_profiles;
CREATE TRIGGER guard_user_profile_privileged_columns
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_user_profile_privileged_columns();

COMMIT;

/*
  Verification (run separately after applying; each block rolls back):

  -- Expect exactly the 10 policies created above
  select policyname, cmd, roles from pg_policies
  where tablename = 'user_profiles' order by cmd, policyname;

  -- As the work admin: sees only Redemption Flagstaff profiles
  begin;
  select set_config('request.jwt.claims',
         json_build_object('sub', id, 'role', 'authenticated')::text, true)
  from user_profiles where email = 'kyle@redemptionflagstaff.com';
  set local role authenticated;
  select count(*) as visible, count(distinct organization_id) as orgs from user_profiles;
  -- Must fail with "You cannot change your own role, status or permissions"
  update user_profiles set role = 'master_admin' where id = auth.uid();
  rollback;
*/
