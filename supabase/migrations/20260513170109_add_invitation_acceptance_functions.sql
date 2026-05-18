/*
  # Add Invitation Acceptance Functions

  1. New Functions
    - `get_invitation_by_token(p_token text)` - Returns invitation details including org name and inviter info, callable by anonymous users
    - `accept_user_invitation(p_token text, p_user_id uuid)` - Handles the full invitation acceptance flow server-side

  2. Security
    - Both functions use SECURITY DEFINER to bypass RLS
    - get_invitation_by_token validates the token is non-expired and unaccepted
    - accept_user_invitation validates token, assigns org/role, and marks invitation accepted
    - Grants execute permission to anon and authenticated roles respectively

  3. Important Notes
    - This fixes the 406 error when unauthenticated users try to view invitation details
    - This fixes the UPDATE permission issue when newly registered users try to accept invitations
    - All validation is done server-side for security
*/

-- Function to get invitation details by token (accessible to anonymous users)
CREATE OR REPLACE FUNCTION get_invitation_by_token(p_token text)
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
    'organization', json_build_object('name', o.name),
    'invited_by_profile', json_build_object(
      'full_name', p.full_name,
      'email', p.email
    )
  ) INTO v_result
  FROM user_invitations i
  LEFT JOIN organizations o ON o.id = i.organization_id
  LEFT JOIN user_profiles p ON p.id = i.invited_by
  WHERE i.token = p_token
    AND i.accepted_at IS NULL
    AND i.expires_at > now();

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  RETURN v_result;
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION get_invitation_by_token(text) TO anon;
GRANT EXECUTE ON FUNCTION get_invitation_by_token(text) TO authenticated;

-- Function to accept an invitation (called after user signs up)
CREATE OR REPLACE FUNCTION accept_user_invitation(p_token text, p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation record;
  v_result json;
BEGIN
  -- Fetch and validate the invitation
  SELECT * INTO v_invitation
  FROM user_invitations
  WHERE token = p_token
    AND accepted_at IS NULL
    AND expires_at > now();

  IF v_invitation IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  -- Update user profile with organization and role
  UPDATE user_profiles
  SET 
    organization_id = v_invitation.organization_id,
    role = v_invitation.role,
    invited_by = v_invitation.invited_by,
    invited_at = v_invitation.created_at,
    updated_at = now()
  WHERE id = p_user_id;

  -- Mark invitation as accepted
  UPDATE user_invitations
  SET accepted_at = now()
  WHERE id = v_invitation.id;

  -- Build result
  SELECT json_build_object(
    'success', true,
    'organization_id', v_invitation.organization_id,
    'role', v_invitation.role,
    'user_id', p_user_id
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute to authenticated users only (must sign up first)
GRANT EXECUTE ON FUNCTION accept_user_invitation(text, uuid) TO authenticated;
