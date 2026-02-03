/*
  # Add Customization History Retention and Cleanup

  ## Summary
  Implements automatic cleanup of old customization history entries based on retention policy:
  - Keep last 20 changes (always retained)
  - Keep all changes from last 90 days
  - Keep changes marked as milestones indefinitely
  - Auto-delete older changes outside these rules

  ## Changes
  1. Create cleanup function enforcing retention policy
  2. Create trigger to run cleanup after each history insert
  3. Create RPC function for manual cleanup operations
  4. Add helper function to get retention summary

  ## Security
  - Only master_admins can trigger manual cleanup
  - Automatic cleanup runs for all qualifying records
*/

-- Function to cleanup old customization versions based on retention policy
CREATE OR REPLACE FUNCTION auto_cleanup_old_customization_versions()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
  v_vertical_id TEXT;
  v_cutoff_date TIMESTAMPTZ;
  v_top_20_cutoff TIMESTAMPTZ;
BEGIN
  v_org_id := NEW.organization_id;
  v_vertical_id := NEW.vertical_id;
  v_cutoff_date := now() - INTERVAL '90 days';

  -- Get the timestamp of the 20th most recent entry for this org+vertical
  SELECT created_at INTO v_top_20_cutoff
  FROM organization_customization_history
  WHERE organization_id = v_org_id
    AND vertical_id = v_vertical_id
  ORDER BY created_at DESC
  OFFSET 19 LIMIT 1;

  -- Delete old versions that meet ALL these conditions:
  -- 1. Older than 90 days
  -- 2. Not a milestone
  -- 3. Not in the top 20 most recent (if top 20 exists)
  DELETE FROM organization_customization_history
  WHERE organization_id = v_org_id
    AND vertical_id = v_vertical_id
    AND created_at < v_cutoff_date
    AND is_milestone = false
    AND (v_top_20_cutoff IS NULL OR created_at < v_top_20_cutoff);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run cleanup after each history insert
DROP TRIGGER IF EXISTS trigger_cleanup_old_versions ON organization_customization_history;
CREATE TRIGGER trigger_cleanup_old_versions
  AFTER INSERT ON organization_customization_history
  FOR EACH ROW
  EXECUTE FUNCTION auto_cleanup_old_customization_versions();

-- Manual cleanup RPC function (for admin-initiated cleanup)
CREATE OR REPLACE FUNCTION cleanup_customization_history_manual(
  p_organization_id UUID,
  p_vertical_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  deleted_count INTEGER,
  organization_id UUID,
  vertical_id TEXT
) AS $$
DECLARE
  v_cutoff_date TIMESTAMPTZ;
  v_top_20_cutoff TIMESTAMPTZ;
  v_deleted_count INTEGER;
  v_vertical TEXT;
BEGIN
  -- Check if user is master_admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
      AND organization_id = p_organization_id
      AND role = 'master_admin'
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Only master admins can perform manual cleanup';
  END IF;

  v_cutoff_date := now() - INTERVAL '90 days';

  -- If specific vertical specified, clean only that vertical
  IF p_vertical_id IS NOT NULL THEN
    -- Get top 20 cutoff for this specific vertical
    SELECT created_at INTO v_top_20_cutoff
    FROM organization_customization_history
    WHERE organization_id = p_organization_id
      AND vertical_id = p_vertical_id
    ORDER BY created_at DESC
    OFFSET 19 LIMIT 1;

    -- Delete old versions
    WITH deleted AS (
      DELETE FROM organization_customization_history
      WHERE organization_id = p_organization_id
        AND vertical_id = p_vertical_id
        AND created_at < v_cutoff_date
        AND is_milestone = false
        AND (v_top_20_cutoff IS NULL OR created_at < v_top_20_cutoff)
      RETURNING *
    )
    SELECT count(*)::INTEGER INTO v_deleted_count FROM deleted;

    RETURN QUERY SELECT v_deleted_count, p_organization_id, p_vertical_id;

  ELSE
    -- Clean all verticals for this organization
    FOR v_vertical IN SELECT DISTINCT vertical_id
                      FROM organization_customization_history
                      WHERE organization_id = p_organization_id
    LOOP
      -- Get top 20 cutoff for this vertical
      SELECT created_at INTO v_top_20_cutoff
      FROM organization_customization_history
      WHERE organization_id = p_organization_id
        AND vertical_id = v_vertical
      ORDER BY created_at DESC
      OFFSET 19 LIMIT 1;

      -- Delete old versions
      WITH deleted AS (
        DELETE FROM organization_customization_history
        WHERE organization_id = p_organization_id
          AND vertical_id = v_vertical
          AND created_at < v_cutoff_date
          AND is_milestone = false
          AND (v_top_20_cutoff IS NULL OR created_at < v_top_20_cutoff)
        RETURNING *
      )
      SELECT count(*)::INTEGER INTO v_deleted_count FROM deleted;

      RETURN QUERY SELECT v_deleted_count, p_organization_id, v_vertical;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get retention summary for an organization
CREATE OR REPLACE FUNCTION get_customization_retention_summary(
  p_organization_id UUID,
  p_vertical_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  vertical_id TEXT,
  total_versions INTEGER,
  milestone_versions INTEGER,
  last_90_days_versions INTEGER,
  top_20_versions INTEGER,
  eligible_for_cleanup INTEGER
) AS $$
DECLARE
  v_cutoff_date TIMESTAMPTZ;
BEGIN
  -- Check if user belongs to the organization
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
      AND organization_id = p_organization_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_cutoff_date := now() - INTERVAL '90 days';

  -- Return summary for specified vertical or all verticals
  RETURN QUERY
  WITH ranked_versions AS (
    SELECT
      och.vertical_id,
      och.id,
      och.is_milestone,
      och.created_at,
      ROW_NUMBER() OVER (PARTITION BY och.vertical_id ORDER BY och.created_at DESC) as rn
    FROM organization_customization_history och
    WHERE och.organization_id = p_organization_id
      AND (p_vertical_id IS NULL OR och.vertical_id = p_vertical_id)
  )
  SELECT
    rv.vertical_id,
    COUNT(*)::INTEGER as total_versions,
    COUNT(*) FILTER (WHERE rv.is_milestone = true)::INTEGER as milestone_versions,
    COUNT(*) FILTER (WHERE rv.created_at >= v_cutoff_date)::INTEGER as last_90_days_versions,
    COUNT(*) FILTER (WHERE rv.rn <= 20)::INTEGER as top_20_versions,
    COUNT(*) FILTER (
      WHERE rv.created_at < v_cutoff_date
        AND rv.is_milestone = false
        AND rv.rn > 20
    )::INTEGER as eligible_for_cleanup
  FROM ranked_versions rv
  GROUP BY rv.vertical_id
  ORDER BY rv.vertical_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cleanup_customization_history_manual(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_customization_retention_summary(UUID, TEXT) TO authenticated;

-- Create index to optimize cleanup queries
CREATE INDEX IF NOT EXISTS idx_history_cleanup_criteria
  ON organization_customization_history(organization_id, vertical_id, created_at DESC, is_milestone)
  WHERE is_milestone = false;