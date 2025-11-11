/*
  # Fix ai_tool_registry RLS for Admin Join Queries

  1. Problem
    - Admins need to view ALL tools (including disabled ones) when joining ai_tool_access_requests
    - Current policy only allows viewing enabled tools
    - This causes 400 errors when joining requests with disabled/deleted tools

  2. Solution
    - Add separate policy for admins and master_admins to view all tools
    - Keep existing policy for regular users (enabled tools only)
    - This enables successful joins in ai_tool_access_requests queries

  3. Security
    - Only master_admin and admin roles can view disabled tools
    - Regular users still see only enabled tools
    - No changes to INSERT/UPDATE/DELETE policies
*/

-- Add policy for admins to view all tools (including disabled)
CREATE POLICY "Admins can view all tools for management"
  ON ai_tool_registry FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('master_admin', 'admin')
    )
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'RLS policy added: Admins can now view all tools including disabled ones';
  RAISE NOTICE 'This fixes 400 errors in ai_tool_access_requests join queries';
END $$;
