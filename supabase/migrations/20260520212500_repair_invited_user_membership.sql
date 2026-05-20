/*
  # Repair invited user organization membership

  If signup succeeds but invite acceptance does not attach the profile to the
  invited organization, this RPC lets the signed-in user repair their membership
  from the latest invitation for their email.
*/

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS active_vertical text DEFAULT 'church';

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
  WHERE au.id = v_user_id
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

NOTIFY pgrst, 'reload schema';
