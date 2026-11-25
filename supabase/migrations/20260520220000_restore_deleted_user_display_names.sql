/*
  # Restore display names for users restored from deletion

  Deleted profiles are redacted to `Deleted User`. When the same user is
  restored by invitation repair/acceptance, that placeholder should be replaced
  with the archived full name, auth metadata name, or email fallback.
*/

CREATE OR REPLACE FUNCTION public.accept_user_invitation(p_token text, p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation record;
  v_auth_user record;
  v_restored_full_name text;
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

  SELECT
    CASE
      WHEN archived_name IS NULL OR lower(archived_name) = 'deleted user' THEN NULL
      ELSE archived_name
    END
  INTO v_restored_full_name
  FROM (
    SELECT NULLIF(btrim(du.profile_snapshot->>'full_name'), '') AS archived_name
    FROM public.deleted_user_profiles du
    WHERE du.deleted_user_id = p_user_id
    ORDER BY du.deleted_at DESC
    LIMIT 1
  ) archived;

  v_restored_full_name := COALESCE(
    v_restored_full_name,
    NULLIF(btrim(v_auth_user.raw_user_meta_data->>'full_name'), ''),
    v_auth_user.email
  );

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
    v_restored_full_name,
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
    full_name = CASE
      WHEN public.user_profiles.full_name IS NULL
        OR btrim(public.user_profiles.full_name) = ''
        OR lower(public.user_profiles.full_name) = 'deleted user'
      THEN EXCLUDED.full_name
      ELSE public.user_profiles.full_name
    END,
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

CREATE OR REPLACE FUNCTION public.repair_current_user_invitation_membership()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_invitation record;
  v_restored_full_name text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  SELECT email
  INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'Authenticated user email not found';
  END IF;

  SELECT *
  INTO v_invitation
  FROM public.user_invitations
  WHERE lower(email) = lower(v_user_email)
    AND expires_at > now()
  ORDER BY
    accepted_at DESC NULLS FIRST,
    created_at DESC
  LIMIT 1;

  IF v_invitation.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'repaired', false,
      'reason', 'No active invitation found for current user'
    );
  END IF;

  SELECT
    CASE
      WHEN archived_name IS NULL OR lower(archived_name) = 'deleted user' THEN NULL
      ELSE archived_name
    END
  INTO v_restored_full_name
  FROM (
    SELECT NULLIF(btrim(du.profile_snapshot->>'full_name'), '') AS archived_name
    FROM public.deleted_user_profiles du
    WHERE du.deleted_user_id = v_user_id
    ORDER BY du.deleted_at DESC
    LIMIT 1
  ) archived;

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
    COALESCE(
      v_restored_full_name,
      NULLIF(btrim(au.raw_user_meta_data->>'full_name'), ''),
      au.email
    ),
    v_invitation.role,
    v_invitation.organization_id,
    true,
    v_invitation.invited_by,
    v_invitation.created_at,
    'church',
    now(),
    now()
  FROM auth.users au
  WHERE au.id = v_user_id
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE
      WHEN public.user_profiles.full_name IS NULL
        OR btrim(public.user_profiles.full_name) = ''
        OR lower(public.user_profiles.full_name) = 'deleted user'
      THEN EXCLUDED.full_name
      ELSE public.user_profiles.full_name
    END,
    organization_id = EXCLUDED.organization_id,
    role = EXCLUDED.role,
    is_active = true,
    invited_by = EXCLUDED.invited_by,
    invited_at = EXCLUDED.invited_at,
    active_vertical = EXCLUDED.active_vertical,
    updated_at = now();

  UPDATE public.user_invitations
  SET accepted_at = COALESCE(accepted_at, now())
  WHERE id = v_invitation.id;

  RETURN json_build_object(
    'success', true,
    'repaired', true,
    'organization_id', v_invitation.organization_id,
    'role', v_invitation.role
  );
END;
$$;

REVOKE ALL ON FUNCTION public.repair_current_user_invitation_membership() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.repair_current_user_invitation_membership() TO authenticated;

WITH restored_names AS (
  SELECT
    up.id,
    COALESCE(
      (
        SELECT
          CASE
            WHEN archived_name IS NULL OR lower(archived_name) = 'deleted user' THEN NULL
            ELSE archived_name
          END
        FROM (
          SELECT NULLIF(btrim(du.profile_snapshot->>'full_name'), '') AS archived_name
          FROM public.deleted_user_profiles du
          WHERE du.deleted_user_id = up.id
          ORDER BY du.deleted_at DESC
          LIMIT 1
        ) archived
      ),
      NULLIF(btrim(au.raw_user_meta_data->>'full_name'), ''),
      au.email,
      up.email
    ) AS restored_full_name
  FROM public.user_profiles up
  JOIN auth.users au ON au.id = up.id
  WHERE up.organization_id IS NOT NULL
    AND up.is_active = true
    AND lower(COALESCE(up.full_name, '')) = 'deleted user'
)
UPDATE public.user_profiles up
SET
  full_name = restored_names.restored_full_name,
  updated_at = now()
FROM restored_names
WHERE up.id = restored_names.id;

NOTIFY pgrst, 'reload schema';
