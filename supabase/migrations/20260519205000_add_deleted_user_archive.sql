/*
  # Archive deleted organization users

  Admins need to remove users from active organization membership while keeping
  a recoverable record. The active `user_profiles` row is redacted and detached
  from the organization so existing foreign keys remain valid, and the original
  data is stored in `deleted_user_profiles` for future recovery by an operator.
*/

CREATE TABLE IF NOT EXISTS public.deleted_user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deleted_user_id uuid NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  email text NOT NULL,
  full_name text,
  role text,
  active_vertical text,
  profile_snapshot jsonb NOT NULL,
  auth_user_snapshot jsonb,
  deletion_reason text,
  deleted_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  restored_at timestamptz,
  restored_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_deleted_user_profiles_deleted_user_id
  ON public.deleted_user_profiles(deleted_user_id);

CREATE INDEX IF NOT EXISTS idx_deleted_user_profiles_organization_id
  ON public.deleted_user_profiles(organization_id);

CREATE INDEX IF NOT EXISTS idx_deleted_user_profiles_deleted_at
  ON public.deleted_user_profiles(deleted_at DESC);

ALTER TABLE public.deleted_user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view deleted users for their organization"
  ON public.deleted_user_profiles;

CREATE POLICY "Admins can view deleted users for their organization"
  ON public.deleted_user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND up.is_active = true
        AND (
          up.is_super_admin = true
          OR (
            up.organization_id = deleted_user_profiles.organization_id
            AND up.role IN ('master_admin', 'admin')
          )
        )
    )
  );

CREATE OR REPLACE FUNCTION public.delete_user_from_organization(
  p_user_id uuid,
  p_deletion_reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor public.user_profiles%ROWTYPE;
  v_target public.user_profiles%ROWTYPE;
  v_auth_user jsonb;
  v_archive_id uuid;
  v_redacted_email text;
BEGIN
  SELECT *
  INTO v_actor
  FROM public.user_profiles
  WHERE id = auth.uid()
    AND is_active = true;

  IF v_actor.id IS NULL THEN
    RAISE EXCEPTION 'Authenticated admin profile not found';
  END IF;

  IF v_actor.role NOT IN ('super_admin', 'master_admin', 'admin') AND COALESCE(v_actor.is_super_admin, false) IS FALSE THEN
    RAISE EXCEPTION 'Insufficient permissions to delete users';
  END IF;

  IF p_user_id = v_actor.id THEN
    RAISE EXCEPTION 'You cannot delete your own user account';
  END IF;

  SELECT *
  INTO v_target
  FROM public.user_profiles
  WHERE id = p_user_id;

  IF v_target.id IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  IF COALESCE(v_actor.is_super_admin, false) IS FALSE AND v_target.organization_id IS DISTINCT FROM v_actor.organization_id THEN
    RAISE EXCEPTION 'You can only delete users in your organization';
  END IF;

  IF COALESCE(v_target.is_super_admin, false) = true OR v_target.role = 'super_admin' THEN
    RAISE EXCEPTION 'Super admin users cannot be deleted from this screen';
  END IF;

  IF v_target.role = 'master_admin' AND COALESCE(v_actor.is_super_admin, false) IS FALSE THEN
    RAISE EXCEPTION 'Only super admins can delete master admin users';
  END IF;

  SELECT jsonb_build_object(
    'id', au.id,
    'email', au.email,
    'created_at', au.created_at,
    'updated_at', au.updated_at,
    'last_sign_in_at', au.last_sign_in_at,
    'raw_app_meta_data', au.raw_app_meta_data,
    'raw_user_meta_data', au.raw_user_meta_data
  )
  INTO v_auth_user
  FROM auth.users au
  WHERE au.id = p_user_id;

  INSERT INTO public.deleted_user_profiles (
    deleted_user_id,
    organization_id,
    email,
    full_name,
    role,
    active_vertical,
    profile_snapshot,
    auth_user_snapshot,
    deletion_reason,
    deleted_by
  )
  VALUES (
    v_target.id,
    v_target.organization_id,
    v_target.email,
    v_target.full_name,
    v_target.role,
    v_target.active_vertical,
    to_jsonb(v_target),
    v_auth_user,
    p_deletion_reason,
    v_actor.id
  )
  RETURNING id INTO v_archive_id;

  UPDATE public.organizations
  SET
    created_by = NULL,
    updated_at = now()
  WHERE created_by = p_user_id;

  DELETE FROM public.user_invitations
  WHERE organization_id = v_target.organization_id
    AND lower(email) = lower(v_target.email)
    AND accepted_at IS NULL;

  v_redacted_email := 'deleted+' || replace(v_target.id::text, '-', '') || '@deleted.adminizer.local';

  UPDATE public.user_profiles
  SET
    email = v_redacted_email,
    full_name = 'Deleted User',
    role = 'user',
    organization_id = NULL,
    is_super_admin = false,
    is_active = false,
    invited_by = NULL,
    invited_at = NULL,
    last_login = NULL,
    active_vertical = 'church',
    updated_at = now()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'archive_id', v_archive_id,
    'deleted_user_id', p_user_id,
    'organization_id', v_target.organization_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_from_organization(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_from_organization(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
