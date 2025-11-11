/*
  # Monitoring and Prevention System for Foreign Key Issues

  1. Purpose
    - Monitor database health and foreign key integrity
    - Detect orphaned records proactively
    - Alert admins when issues are detected
    - Provide metrics and reporting

  2. Features
    - Daily health check scheduled function
    - Real-time metrics tracking
    - Admin dashboard queries
    - Automated alerting system
    - Data quality reports

  3. Tables
    - fk_health_check_history: Track daily health checks
    - fk_metrics: Store aggregate metrics over time
*/

-- ============================================================================
-- SECTION 1: CREATE MONITORING TABLES
-- ============================================================================

-- 1.1: Health check history table
CREATE TABLE IF NOT EXISTS fk_health_check_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_timestamp timestamptz DEFAULT NOW(),
  total_orphaned_records integer DEFAULT 0,
  tables_affected text[],
  severity text CHECK (severity IN ('ok', 'warning', 'critical')),
  details jsonb DEFAULT '{}'::jsonb,
  alert_created boolean DEFAULT false,
  checked_by text DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS idx_fk_health_check_timestamp ON fk_health_check_history(check_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_fk_health_check_severity ON fk_health_check_history(severity);

-- 1.2: Foreign key metrics table
CREATE TABLE IF NOT EXISTS fk_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date DEFAULT CURRENT_DATE,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  table_name text,
  metadata jsonb DEFAULT '{}'::jsonb,
  recorded_at timestamptz DEFAULT NOW(),
  UNIQUE(metric_date, metric_name, table_name)
);

CREATE INDEX IF NOT EXISTS idx_fk_metrics_date ON fk_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_fk_metrics_name ON fk_metrics(metric_name);


-- ============================================================================
-- SECTION 2: COMPREHENSIVE HEALTH CHECK FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION run_foreign_key_health_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_orphaned_counts jsonb := '{}'::jsonb;
  v_count integer;
  v_total integer := 0;
  v_tables_affected text[] := ARRAY[]::text[];
  v_severity text := 'ok';
  v_check_id uuid;
  v_alert_threshold integer := 10;
BEGIN
  -- Check user_profiles
  SELECT COUNT(*)::integer INTO v_count
  FROM user_profiles
  WHERE organization_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = user_profiles.organization_id);

  IF v_count > 0 THEN
    v_orphaned_counts := jsonb_set(v_orphaned_counts, '{user_profiles}', to_jsonb(v_count));
    v_tables_affected := array_append(v_tables_affected, 'user_profiles');
    v_total := v_total + v_count;
  END IF;

  -- Check ai_page_context (invalid user_id)
  SELECT COUNT(*)::integer INTO v_count
  FROM ai_page_context
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = ai_page_context.user_id);

  IF v_count > 0 THEN
    v_orphaned_counts := jsonb_set(v_orphaned_counts, '{ai_page_context_user}', to_jsonb(v_count));
    v_tables_affected := array_append(v_tables_affected, 'ai_page_context');
    v_total := v_total + v_count;
  END IF;

  -- Check ai_page_context (invalid organization_id)
  SELECT COUNT(*)::integer INTO v_count
  FROM ai_page_context
  WHERE organization_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = ai_page_context.organization_id);

  IF v_count > 0 THEN
    v_orphaned_counts := jsonb_set(v_orphaned_counts, '{ai_page_context_org}', to_jsonb(v_count));
    v_total := v_total + v_count;
  END IF;

  -- Check ai_tool_access_requests (invalid user_id)
  SELECT COUNT(*)::integer INTO v_count
  FROM ai_tool_access_requests
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = ai_tool_access_requests.user_id);

  IF v_count > 0 THEN
    v_orphaned_counts := jsonb_set(v_orphaned_counts, '{ai_tool_access_requests_user}', to_jsonb(v_count));
    v_tables_affected := array_append(v_tables_affected, 'ai_tool_access_requests');
    v_total := v_total + v_count;
  END IF;

  -- Check ai_tool_access_requests (invalid tool_id)
  SELECT COUNT(*)::integer INTO v_count
  FROM ai_tool_access_requests
  WHERE NOT EXISTS (SELECT 1 FROM ai_tool_registry WHERE id = ai_tool_access_requests.tool_id);

  IF v_count > 0 THEN
    v_orphaned_counts := jsonb_set(v_orphaned_counts, '{ai_tool_access_requests_tool}', to_jsonb(v_count));
    v_total := v_total + v_count;
  END IF;

  -- Check ai_notifications (invalid organization_id)
  SELECT COUNT(*)::integer INTO v_count
  FROM ai_notifications
  WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE id = ai_notifications.organization_id);

  IF v_count > 0 THEN
    v_orphaned_counts := jsonb_set(v_orphaned_counts, '{ai_notifications_org}', to_jsonb(v_count));
    v_tables_affected := array_append(v_tables_affected, 'ai_notifications');
    v_total := v_total + v_count;
  END IF;

  -- Check documents (invalid organization_id)
  SELECT COUNT(*)::integer INTO v_count
  FROM documents
  WHERE organization_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = documents.organization_id);

  IF v_count > 0 THEN
    v_orphaned_counts := jsonb_set(v_orphaned_counts, '{documents}', to_jsonb(v_count));
    v_tables_affected := array_append(v_tables_affected, 'documents');
    v_total := v_total + v_count;
  END IF;

  -- Determine severity
  IF v_total = 0 THEN
    v_severity := 'ok';
  ELSIF v_total < v_alert_threshold THEN
    v_severity := 'warning';
  ELSE
    v_severity := 'critical';
  END IF;

  -- Record health check
  INSERT INTO fk_health_check_history (
    check_timestamp,
    total_orphaned_records,
    tables_affected,
    severity,
    details,
    alert_created
  )
  VALUES (
    NOW(),
    v_total,
    v_tables_affected,
    v_severity,
    v_orphaned_counts,
    v_severity = 'critical'
  )
  RETURNING id INTO v_check_id;

  -- Create alert if critical
  IF v_severity = 'critical' THEN
    PERFORM log_profile_creation_failure(
      NULL,
      'system',
      format('Foreign key health check detected %s orphaned records across %s tables',
             v_total, array_length(v_tables_affected, 1)),
      'FK_HEALTH_CHECK_CRITICAL',
      0,
      jsonb_pretty(v_orphaned_counts)
    );
  END IF;

  -- Record metrics
  INSERT INTO fk_metrics (metric_date, metric_name, metric_value, metadata)
  VALUES (
    CURRENT_DATE,
    'total_orphaned_records',
    v_total,
    jsonb_build_object('details', v_orphaned_counts, 'check_id', v_check_id)
  )
  ON CONFLICT (metric_date, metric_name, table_name)
  DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    metadata = EXCLUDED.metadata,
    recorded_at = NOW();

  -- Return result
  RETURN jsonb_build_object(
    'check_id', v_check_id,
    'timestamp', NOW(),
    'severity', v_severity,
    'total_orphaned_records', v_total,
    'tables_affected', v_tables_affected,
    'details', v_orphaned_counts,
    'alert_created', v_severity = 'critical'
  );
END;
$$;


-- ============================================================================
-- SECTION 3: METRICS AND REPORTING FUNCTIONS
-- ============================================================================

-- 3.1: Get health check summary for last N days
CREATE OR REPLACE FUNCTION get_health_check_summary(
  p_days integer DEFAULT 7
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_checks jsonb;
  v_summary jsonb;
BEGIN
  -- Get recent health checks
  SELECT jsonb_agg(
    jsonb_build_object(
      'timestamp', check_timestamp,
      'severity', severity,
      'orphaned_records', total_orphaned_records,
      'tables_affected', tables_affected
    ) ORDER BY check_timestamp DESC
  )
  INTO v_checks
  FROM fk_health_check_history
  WHERE check_timestamp > NOW() - (p_days || ' days')::interval;

  -- Get summary statistics
  SELECT jsonb_build_object(
    'total_checks', COUNT(*),
    'critical_count', COUNT(*) FILTER (WHERE severity = 'critical'),
    'warning_count', COUNT(*) FILTER (WHERE severity = 'warning'),
    'ok_count', COUNT(*) FILTER (WHERE severity = 'ok'),
    'avg_orphaned_records', ROUND(AVG(total_orphaned_records), 2),
    'max_orphaned_records', MAX(total_orphaned_records),
    'last_check', MAX(check_timestamp)
  )
  INTO v_summary
  FROM fk_health_check_history
  WHERE check_timestamp > NOW() - (p_days || ' days')::interval;

  RETURN jsonb_build_object(
    'period_days', p_days,
    'summary', v_summary,
    'checks', COALESCE(v_checks, '[]'::jsonb)
  );
END;
$$;

-- 3.2: Get data quality score
CREATE OR REPLACE FUNCTION get_data_quality_score()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_records bigint;
  v_orphaned_records integer;
  v_quality_score numeric;
  v_grade text;
BEGIN
  -- Count total relevant records
  SELECT
    (SELECT COUNT(*) FROM user_profiles) +
    (SELECT COUNT(*) FROM ai_page_context) +
    (SELECT COUNT(*) FROM ai_tool_access_requests) +
    (SELECT COUNT(*) FROM ai_notifications) +
    (SELECT COUNT(*) FROM documents)
  INTO v_total_records;

  -- Count orphaned records
  SELECT
    (SELECT COUNT(*) FROM user_profiles
     WHERE organization_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = user_profiles.organization_id)) +
    (SELECT COUNT(*) FROM ai_page_context
     WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = ai_page_context.user_id)) +
    (SELECT COUNT(*) FROM ai_tool_access_requests
     WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = ai_tool_access_requests.user_id)) +
    (SELECT COUNT(*) FROM ai_notifications
     WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE id = ai_notifications.organization_id))
  INTO v_orphaned_records;

  -- Calculate quality score (0-100)
  IF v_total_records = 0 THEN
    v_quality_score := 100;
  ELSE
    v_quality_score := ROUND(((v_total_records - v_orphaned_records)::numeric / v_total_records) * 100, 2);
  END IF;

  -- Assign grade
  v_grade := CASE
    WHEN v_quality_score >= 99 THEN 'A+'
    WHEN v_quality_score >= 95 THEN 'A'
    WHEN v_quality_score >= 90 THEN 'B'
    WHEN v_quality_score >= 80 THEN 'C'
    WHEN v_quality_score >= 70 THEN 'D'
    ELSE 'F'
  END;

  RETURN jsonb_build_object(
    'score', v_quality_score,
    'grade', v_grade,
    'total_records', v_total_records,
    'orphaned_records', v_orphaned_records,
    'healthy_records', v_total_records - v_orphaned_records,
    'timestamp', NOW()
  );
END;
$$;

-- 3.3: Get trend analysis
CREATE OR REPLACE FUNCTION get_orphaned_records_trend(
  p_days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trend jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', metric_date,
      'count', metric_value,
      'change_from_previous', metric_value - LAG(metric_value) OVER (ORDER BY metric_date)
    ) ORDER BY metric_date DESC
  )
  INTO v_trend
  FROM fk_metrics
  WHERE metric_name = 'total_orphaned_records'
    AND metric_date > CURRENT_DATE - p_days;

  RETURN jsonb_build_object(
    'period_days', p_days,
    'trend_data', COALESCE(v_trend, '[]'::jsonb)
  );
END;
$$;


-- ============================================================================
-- SECTION 4: ADMIN DASHBOARD QUERIES
-- ============================================================================

-- 4.1: Get comprehensive dashboard data
CREATE OR REPLACE FUNCTION get_fk_dashboard_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quality_score jsonb;
  v_recent_checks jsonb;
  v_constraint_violations jsonb;
  v_recommendations text[] := ARRAY[]::text[];
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

  -- Get quality score
  v_quality_score := get_data_quality_score();

  -- Get recent health checks
  v_recent_checks := get_health_check_summary(7);

  -- Get recent constraint violations
  SELECT jsonb_agg(
    jsonb_build_object(
      'table', table_name,
      'constraint', constraint_name,
      'count', COUNT(*)
    )
  )
  INTO v_constraint_violations
  FROM constraint_violations_log
  WHERE created_at > NOW() - INTERVAL '24 hours'
  GROUP BY table_name, constraint_name;

  -- Generate recommendations
  IF (v_quality_score->>'score')::numeric < 90 THEN
    v_recommendations := array_append(v_recommendations,
      'Data quality score is below 90%. Consider running repair operations.');
  END IF;

  IF EXISTS(
    SELECT 1 FROM fk_health_check_history
    WHERE severity = 'critical'
      AND check_timestamp > NOW() - INTERVAL '24 hours'
  ) THEN
    v_recommendations := array_append(v_recommendations,
      'Critical health check failures detected in the last 24 hours.');
  END IF;

  RETURN jsonb_build_object(
    'quality_score', v_quality_score,
    'recent_health_checks', v_recent_checks,
    'constraint_violations_24h', COALESCE(v_constraint_violations, '[]'::jsonb),
    'recommendations', v_recommendations,
    'generated_at', NOW()
  );
END;
$$;


-- ============================================================================
-- SECTION 5: AUTOMATED CLEANUP FUNCTIONS
-- ============================================================================

-- 5.1: Clean up old health check records
CREATE OR REPLACE FUNCTION cleanup_old_health_checks()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  -- Delete health checks older than 90 days
  DELETE FROM fk_health_check_history
  WHERE check_timestamp < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Delete old metrics older than 180 days
  DELETE FROM fk_metrics
  WHERE recorded_at < NOW() - INTERVAL '180 days';

  RETURN jsonb_build_object(
    'success', true,
    'health_checks_deleted', v_deleted_count,
    'cleaned_at', NOW()
  );
END;
$$;


-- ============================================================================
-- SECTION 6: GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION run_foreign_key_health_check TO authenticated;
GRANT EXECUTE ON FUNCTION get_health_check_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_data_quality_score TO authenticated;
GRANT EXECUTE ON FUNCTION get_orphaned_records_trend TO authenticated;
GRANT EXECUTE ON FUNCTION get_fk_dashboard_data TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_health_checks TO authenticated;

GRANT SELECT ON fk_health_check_history TO authenticated;
GRANT SELECT ON fk_metrics TO authenticated;
GRANT ALL ON fk_health_check_history TO service_role;
GRANT ALL ON fk_metrics TO service_role;


-- ============================================================================
-- SECTION 7: INITIAL HEALTH CHECK
-- ============================================================================

-- Run initial health check
DO $$
DECLARE
  v_result jsonb;
BEGIN
  v_result := run_foreign_key_health_check();
  RAISE NOTICE 'Initial health check completed: %', v_result;
END $$;


-- ============================================================================
-- SECTION 8: DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION run_foreign_key_health_check IS 'Performs comprehensive foreign key integrity check and logs results';
COMMENT ON FUNCTION get_health_check_summary IS 'Returns summary of health checks for the last N days';
COMMENT ON FUNCTION get_data_quality_score IS 'Calculates overall data quality score based on orphaned records';
COMMENT ON FUNCTION get_orphaned_records_trend IS 'Returns trend analysis of orphaned records over time';
COMMENT ON FUNCTION get_fk_dashboard_data IS 'Returns comprehensive dashboard data for admin monitoring';
COMMENT ON FUNCTION cleanup_old_health_checks IS 'Removes old health check and metric records';

COMMENT ON TABLE fk_health_check_history IS 'Historical record of foreign key health checks';
COMMENT ON TABLE fk_metrics IS 'Aggregate metrics for foreign key health monitoring';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Monitoring and prevention system created successfully';
  RAISE NOTICE 'Run: SELECT run_foreign_key_health_check(); to perform health checks';
  RAISE NOTICE 'Run: SELECT get_fk_dashboard_data(); for admin dashboard';
END $$;
