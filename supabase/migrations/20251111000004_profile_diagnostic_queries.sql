/*
  # Profile Diagnostic Queries and Functions

  1. Diagnostic Functions
    - check_user_profile_health: Complete health check for user profile
    - get_profile_creation_stats: Statistics about profile creation
    - get_recent_profile_failures: Recent failed profile creation attempts

  2. Maintenance Functions
    - cleanup_old_resolved_alerts: Remove old resolved alerts
    - retry_failed_profile_creation: Retry profile creation for failed users
*/

-- Complete profile health check function
CREATE OR REPLACE FUNCTION check_user_profile_health(p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_auth_user_exists boolean;
  v_profile_exists boolean;
  v_profile_data jsonb;
  v_org_exists boolean;
  v_rls_enabled boolean;
  v_trigger_exists boolean;
  v_recent_alerts integer;
  v_health_status text;
  v_issues text[] := ARRAY[]::text[];
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'message', 'No user ID provided and not authenticated',
      'health', 'unhealthy'
    );
  END IF;

  -- Check if auth user exists
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE id = v_user_id
  ) INTO v_auth_user_exists;

  IF NOT v_auth_user_exists THEN
    v_issues := array_append(v_issues, 'Auth user does not exist');
  END IF;

  -- Check if profile exists
  SELECT EXISTS(
    SELECT 1 FROM user_profiles WHERE id = v_user_id
  ) INTO v_profile_exists;

  IF NOT v_profile_exists THEN
    v_issues := array_append(v_issues, 'User profile does not exist');
  ELSE
    -- Get profile data
    SELECT jsonb_build_object(
      'id', id,
      'email', email,
      'role', role,
      'is_active', is_active,
      'active_vertical', active_vertical,
      'organization_id', organization_id,
      'created_at', created_at,
      'updated_at', updated_at
    )
    INTO v_profile_data
    FROM user_profiles
    WHERE id = v_user_id;

    -- Check if organization exists (if profile has one)
    IF (v_profile_data->>'organization_id') IS NOT NULL THEN
      SELECT EXISTS(
        SELECT 1 FROM organizations
        WHERE id = (v_profile_data->>'organization_id')::uuid
      ) INTO v_org_exists;

      IF NOT v_org_exists THEN
        v_issues := array_append(v_issues, 'Organization referenced but does not exist');
      END IF;
    END IF;
  END IF;

  -- Check if RLS is enabled on user_profiles
  SELECT EXISTS(
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public'
    AND t.tablename = 'user_profiles'
    AND c.relrowsecurity = true
  ) INTO v_rls_enabled;

  IF NOT v_rls_enabled THEN
    v_issues := array_append(v_issues, 'RLS not enabled on user_profiles table');
  END IF;

  -- Check if trigger exists
  SELECT EXISTS(
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) INTO v_trigger_exists;

  IF NOT v_trigger_exists THEN
    v_issues := array_append(v_issues, 'Profile creation trigger does not exist');
  END IF;

  -- Check for recent alerts for this user
  IF v_profile_exists THEN
    SELECT COUNT(*)::integer INTO v_recent_alerts
    FROM admin_alerts
    WHERE user_id = v_user_id
    AND created_at > NOW() - INTERVAL '24 hours'
    AND resolved_at IS NULL;

    IF v_recent_alerts > 0 THEN
      v_issues := array_append(v_issues, format('%s unresolved alerts in last 24 hours', v_recent_alerts));
    END IF;
  END IF;

  -- Determine overall health status
  IF array_length(v_issues, 1) IS NULL THEN
    v_health_status := 'healthy';
  ELSIF array_length(v_issues, 1) <= 1 THEN
    v_health_status := 'warning';
  ELSE
    v_health_status := 'unhealthy';
  END IF;

  -- Build response
  RETURN jsonb_build_object(
    'status', 'success',
    'health', v_health_status,
    'user_id', v_user_id,
    'checks', jsonb_build_object(
      'auth_user_exists', v_auth_user_exists,
      'profile_exists', v_profile_exists,
      'rls_enabled', v_rls_enabled,
      'trigger_exists', v_trigger_exists,
      'organization_valid', COALESCE(v_org_exists, true),
      'recent_unresolved_alerts', COALESCE(v_recent_alerts, 0)
    ),
    'profile', v_profile_data,
    'issues', v_issues,
    'checked_at', NOW()
  );
END;
$$;

-- Profile creation statistics
CREATE OR REPLACE FUNCTION get_profile_creation_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_profiles integer;
  v_profiles_today integer;
  v_profiles_this_week integer;
  v_total_alerts integer;
  v_unresolved_alerts integer;
  v_alerts_today integer;
  v_success_rate numeric;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS(
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('master_admin', 'admin')
  ) THEN
    RETURN jsonb_build_object(
      'error', 'Unauthorized - admin access required'
    );
  END IF;

  -- Get total profiles
  SELECT COUNT(*)::integer INTO v_total_profiles
  FROM user_profiles;

  -- Get profiles created today
  SELECT COUNT(*)::integer INTO v_profiles_today
  FROM user_profiles
  WHERE created_at >= CURRENT_DATE;

  -- Get profiles created this week
  SELECT COUNT(*)::integer INTO v_profiles_this_week
  FROM user_profiles
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

  -- Get total alerts
  SELECT COUNT(*)::integer INTO v_total_alerts
  FROM admin_alerts
  WHERE alert_type = 'profile_creation_failure';

  -- Get unresolved alerts
  SELECT COUNT(*)::integer INTO v_unresolved_alerts
  FROM admin_alerts
  WHERE alert_type = 'profile_creation_failure'
  AND resolved_at IS NULL;

  -- Get alerts today
  SELECT COUNT(*)::integer INTO v_alerts_today
  FROM admin_alerts
  WHERE alert_type = 'profile_creation_failure'
  AND created_at >= CURRENT_DATE;

  -- Calculate success rate
  IF v_total_profiles + v_total_alerts > 0 THEN
    v_success_rate := (v_total_profiles::numeric / (v_total_profiles + v_total_alerts)) * 100;
  ELSE
    v_success_rate := 100;
  END IF;

  RETURN jsonb_build_object(
    'total_profiles', v_total_profiles,
    'profiles_created_today', v_profiles_today,
    'profiles_created_this_week', v_profiles_this_week,
    'total_failure_alerts', v_total_alerts,
    'unresolved_alerts', v_unresolved_alerts,
    'alerts_today', v_alerts_today,
    'success_rate_percent', ROUND(v_success_rate, 2),
    'generated_at', NOW()
  );
END;
$$;

-- Get recent profile failures
CREATE OR REPLACE FUNCTION get_recent_profile_failures(p_limit integer DEFAULT 10)
RETURNS TABLE(
  alert_id uuid,
  user_id uuid,
  user_email text,
  error_message text,
  error_code text,
  retry_count integer,
  created_at timestamptz,
  resolved boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS(
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('master_admin', 'admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized - admin access required';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.user_id,
    a.user_email,
    a.error_message,
    a.error_code,
    a.retry_count,
    a.created_at,
    (a.resolved_at IS NOT NULL) as resolved
  FROM admin_alerts a
  WHERE a.alert_type = 'profile_creation_failure'
  ORDER BY a.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Cleanup old resolved alerts (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_resolved_alerts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  -- Check if user is master_admin
  IF NOT EXISTS(
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role = 'master_admin'
  ) THEN
    RETURN jsonb_build_object(
      'error', 'Unauthorized - master admin access required'
    );
  END IF;

  -- Delete resolved alerts older than 90 days
  DELETE FROM admin_alerts
  WHERE resolved_at IS NOT NULL
  AND resolved_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', v_deleted_count,
    'deleted_at', NOW()
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_user_profile_health TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_creation_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_profile_failures TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_resolved_alerts TO authenticated;

COMMENT ON FUNCTION check_user_profile_health IS 'Performs comprehensive health check on user profile and related data';
COMMENT ON FUNCTION get_profile_creation_stats IS 'Returns statistics about profile creation success rates and failures';
COMMENT ON FUNCTION get_recent_profile_failures IS 'Returns list of recent profile creation failures for admin review';
COMMENT ON FUNCTION cleanup_old_resolved_alerts IS 'Removes resolved alerts older than 90 days to maintain database performance';
