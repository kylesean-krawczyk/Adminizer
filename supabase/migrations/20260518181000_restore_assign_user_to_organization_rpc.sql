/*
  # Restore invite creation RPC

  Netlify production reported a 404 for `/rest/v1/rpc/assign_user_to_organization`,
  which means PostgREST could not find this function in the deployed schema cache.
  Recreate the function idempotently and notify PostgREST to reload its schema.
*/

CREATE OR REPLACE FUNCTION public.assign_user_to_organization(
  p_user_email text,
  p_organization_id uuid,
  p_role text,
  p_invited_by_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inviter_is_super_admin boolean;
  v_inviter_org_id uuid;
  v_invitation_id uuid;
  v_invitation_token text;
  v_invitation_expires_at timestamptz;
  v_normalized_email text;
  v_existing_invitation record;
BEGIN
  v_normalized_email := lower(trim(p_user_email));

  IF v_normalized_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  IF p_role NOT IN ('admin', 'user') THEN
    RAISE EXCEPTION 'Invalid role. Must be admin or user.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = p_organization_id) THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  SELECT is_super_admin, organization_id
  INTO v_inviter_is_super_admin, v_inviter_org_id
  FROM public.user_profiles
  WHERE id = p_invited_by_user_id
    AND is_active = true;

  IF NOT (
    v_inviter_is_super_admin = true
    OR (
      v_inviter_org_id = p_organization_id
      AND EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = p_invited_by_user_id
          AND role IN ('master_admin', 'admin')
          AND is_active = true
      )
    )
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to invite users to this organization';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.user_profiles up
    INNER JOIN auth.users au ON au.id = up.id
    WHERE lower(au.email) = v_normalized_email
      AND up.organization_id = p_organization_id
  ) THEN
    RAISE EXCEPTION 'User already exists in this organization';
  END IF;

  SELECT id, token, expires_at, role
  INTO v_existing_invitation
  FROM public.user_invitations
  WHERE lower(email) = v_normalized_email
    AND organization_id = p_organization_id
    AND accepted_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing_invitation.id IS NOT NULL THEN
    RETURN json_build_object(
      'invitation_id', v_existing_invitation.id,
      'token', v_existing_invitation.token,
      'email', v_normalized_email,
      'organization_id', p_organization_id,
      'role', v_existing_invitation.role,
      'expires_at', v_existing_invitation.expires_at
    );
  END IF;

  INSERT INTO public.user_invitations (
    email,
    role,
    organization_id,
    invited_by
  )
  VALUES (
    v_normalized_email,
    p_role,
    p_organization_id,
    p_invited_by_user_id
  )
  RETURNING id, token, expires_at
  INTO v_invitation_id, v_invitation_token, v_invitation_expires_at;

  RETURN json_build_object(
    'invitation_id', v_invitation_id,
    'token', v_invitation_token,
    'email', v_normalized_email,
    'organization_id', p_organization_id,
    'role', p_role,
    'expires_at', v_invitation_expires_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.assign_user_to_organization(text, uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_user_to_organization(text, uuid, text, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
