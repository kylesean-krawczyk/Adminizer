/*
  # Restore Redemption onboarding RPCs

  The Redemption production database is missing PostgREST RPCs used by
  organization setup and invitation acceptance. Recreate them idempotently and
  ask PostgREST to reload its schema cache.
*/

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
  v_existing_org_id uuid;
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

  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  SELECT organization_id, COALESCE(is_super_admin, false)
  INTO v_user_org_id, v_is_super_admin
  FROM public.user_profiles
  WHERE id = p_user_id;

  IF v_user_org_id IS NOT NULL AND NOT v_is_super_admin THEN
    RAISE EXCEPTION 'You already belong to an organization. Only super admins can create multiple organizations.';
  END IF;

  SELECT id
  INTO v_existing_org_id
  FROM public.organizations
  WHERE lower(name) IN (
    lower(trim(p_organization_name)),
    'redemption flagstaff',
    'redemption church flagstaff',
    'primary organization',
    'church'
  )
  ORDER BY
    CASE
      WHEN id = '00000000-0000-0000-0000-000000000001'::uuid THEN 0
      ELSE 1
    END,
    created_at
  LIMIT 1;

  IF v_existing_org_id IS NOT NULL THEN
    v_org_id := v_existing_org_id;

    UPDATE public.organizations
    SET
      name = 'Redemption Flagstaff',
      vertical = 'church',
      updated_at = now()
    WHERE id = v_org_id;
  ELSE
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
  END IF;

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

  UPDATE public.organizations
  SET created_by = COALESCE(created_by, p_user_id)
  WHERE id = v_org_id;

  RETURN json_build_object(
    'organization_id', v_org_id,
    'organization_name', (SELECT name FROM public.organizations WHERE id = v_org_id),
    'user_id', p_user_id,
    'role', v_new_role,
    'is_super_admin', (v_new_role = 'super_admin')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_organization_with_admin(text, uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization_with_admin(text, uuid, boolean) TO authenticated;

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
  SELECT
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email),
    v_invitation.role,
    v_invitation.organization_id,
    true,
    v_invitation.invited_by,
    v_invitation.created_at,
    'church',
    now(),
    now()
  FROM auth.users au
  WHERE au.id = p_user_id
  ON CONFLICT (id) DO UPDATE SET
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
GRANT EXECUTE ON FUNCTION public.accept_user_invitation(text, uuid) TO authenticated;

UPDATE public.organizations
SET
  name = 'Redemption Flagstaff',
  vertical = 'church',
  updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
  OR lower(name) IN ('primary organization', 'church', 'redemption church flagstaff');

NOTIFY pgrst, 'reload schema';
