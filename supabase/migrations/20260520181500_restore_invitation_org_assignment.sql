/*
  # Restore invitation organization assignment

  Invited users should be attached to the organization from their invitation.
  This migration recreates the onboarding RPCs needed by the invite acceptance
  screen and permits `accept_user_invitation` to run during signup, even when
  Supabase has not created an authenticated session yet.
*/

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS active_vertical text DEFAULT 'church';

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'id', i.id,
    'email', i.email,
    'role', i.role,
    'organization_id', i.organization_id,
    'invited_by', i.invited_by,
    'token', i.token,
    'expires_at', i.expires_at,
    'accepted_at', i.accepted_at,
    'created_at', i.created_at,
    'organization', json_build_object(
      'name',
      CASE
        WHEN lower(COALESCE(o.name, '')) IN ('primary organization', 'church') THEN 'Redemption Flagstaff'
        ELSE COALESCE(o.name, 'Redemption Flagstaff')
      END
    ),
    'invited_by_profile', json_build_object(
      'full_name', p.full_name,
      'email', p.email
    )
  )
  INTO v_result
  FROM public.user_invitations i
  LEFT JOIN public.organizations o ON o.id = i.organization_id
  LEFT JOIN public.user_profiles p ON p.id = i.invited_by
  WHERE i.token = p_token
    AND i.accepted_at IS NULL
    AND i.expires_at > now();

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_invitation_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_user_invitation(p_token text, p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation record;
  v_auth_user record;
BEGIN
  SELECT *
  INTO v_invitation
  FROM public.user_invitations
  WHERE token = p_token
    AND accepted_at IS NULL
    AND expires_at > now();

  IF v_invitation IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  SELECT *
  INTO v_auth_user
  FROM auth.users
  WHERE id = p_user_id;

  IF v_auth_user.id IS NULL THEN
    RAISE EXCEPTION 'User account not found';
  END IF;

  IF lower(v_auth_user.email) <> lower(v_invitation.email) THEN
    RAISE EXCEPTION 'Invitation email does not match the signed up user';
  END IF;

  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    role,
    organization_id,
    is_active,
    invited_by,
    invited_at,
    active_vertical,
    created_at,
    updated_at
  )
  VALUES (
    v_auth_user.id,
    v_auth_user.email,
    COALESCE(v_auth_user.raw_user_meta_data->>'full_name', v_auth_user.email),
    v_invitation.role,
    v_invitation.organization_id,
    true,
    v_invitation.invited_by,
    v_invitation.created_at,
    'church',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.user_profiles.full_name, EXCLUDED.full_name),
    organization_id = EXCLUDED.organization_id,
    role = EXCLUDED.role,
    is_active = true,
    invited_by = EXCLUDED.invited_by,
    invited_at = EXCLUDED.invited_at,
    active_vertical = EXCLUDED.active_vertical,
    updated_at = now();

  UPDATE public.user_invitations
  SET accepted_at = now()
  WHERE id = v_invitation.id;

  RETURN json_build_object(
    'success', true,
    'organization_id', v_invitation.organization_id,
    'role', v_invitation.role,
    'user_id', p_user_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_user_invitation(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_user_invitation(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.accept_user_invitation(text, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_organization_with_admin(
  p_organization_name text,
  p_user_id uuid,
  p_make_super_admin boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_user_org_id uuid;
  v_is_super_admin boolean;
  v_new_role text;
BEGIN
  IF p_organization_name IS NULL OR trim(p_organization_name) = '' THEN
    RAISE EXCEPTION 'Organization name is required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_user_id) THEN
    INSERT INTO public.user_profiles (
      id,
      email,
      full_name,
      role,
      is_active,
      active_vertical,
      created_at,
      updated_at
    )
    SELECT
      au.id,
      au.email,
      COALESCE(au.raw_user_meta_data->>'full_name', au.email),
      'user',
      true,
      'church',
      now(),
      now()
    FROM auth.users au
    WHERE au.id = p_user_id;
  END IF;

  SELECT organization_id, COALESCE(is_super_admin, false)
  INTO v_user_org_id, v_is_super_admin
  FROM public.user_profiles
  WHERE id = p_user_id;

  IF v_user_org_id IS NOT NULL AND NOT v_is_super_admin THEN
    RAISE EXCEPTION 'You already belong to an organization. Only super admins can create multiple organizations.';
  END IF;

  INSERT INTO public.organizations (
    name,
    created_by,
    vertical,
    enabled_verticals
  )
  VALUES (
    trim(p_organization_name),
    p_user_id,
    'church',
    ARRAY['church', 'business', 'estate']
  )
  RETURNING id INTO v_org_id;

  IF p_make_super_admin OR v_is_super_admin THEN
    v_new_role := 'super_admin';
  ELSE
    v_new_role := 'master_admin';
  END IF;

  UPDATE public.user_profiles
  SET
    organization_id = v_org_id,
    role = v_new_role,
    is_super_admin = (v_new_role = 'super_admin'),
    active_vertical = 'church',
    updated_at = now()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'organization_id', v_org_id,
    'organization_name', trim(p_organization_name),
    'user_id', p_user_id,
    'role', v_new_role,
    'is_super_admin', (v_new_role = 'super_admin')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_organization_with_admin(text, uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization_with_admin(text, uuid, boolean) TO authenticated;

UPDATE public.organizations
SET
  name = 'Redemption Flagstaff',
  vertical = 'church',
  updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
  OR lower(name) IN ('primary organization', 'church', 'redemption church flagstaff');

NOTIFY pgrst, 'reload schema';
