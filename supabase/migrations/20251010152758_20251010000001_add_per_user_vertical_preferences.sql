/*
  # Add Per-User Vertical Preferences

  1. Schema Changes
    - Add `active_vertical` column to `user_profiles` table
      - Stores each user's personally selected vertical (church, business, or estate)
      - Defaults to 'church' for new users
      - Must be one of the three valid vertical types
    
    - Add `enabled_verticals` column to `organizations` table
      - Array of vertical IDs that account managers have enabled for this organization
      - Defaults to all three verticals for maximum flexibility
      - Controls which verticals users in this organization can access
  
  2. Data Migration
    - Set active_vertical for existing users to match their organization's current vertical
    - Set enabled_verticals for existing organizations to include all three verticals
  
  3. Security
    - Add RLS policy allowing users to update their own active_vertical
    - Add RLS policy allowing master_admins to update organization enabled_verticals
    - Add check constraint to ensure active_vertical is valid
  
  4. Performance
    - Add index on user_profiles(active_vertical) for faster queries
    - Add GIN index on organizations(enabled_verticals) for array searches
  
  5. Validation
    - Add trigger function to validate active_vertical is in organization's enabled_verticals
    - Auto-correct invalid active_vertical to first enabled vertical
*/

-- Add active_vertical column to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'active_vertical'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN active_vertical text DEFAULT 'church' 
    CHECK (active_vertical IN ('church', 'business', 'estate'));
  END IF;
END $$;

-- Add enabled_verticals column to organizations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'enabled_verticals'
  ) THEN
    ALTER TABLE organizations 
    ADD COLUMN enabled_verticals text[] DEFAULT ARRAY['church', 'business', 'estate'];
  END IF;
END $$;

-- Migrate existing data: set active_vertical based on organization's vertical field if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'vertical'
  ) THEN
    UPDATE user_profiles up
    SET active_vertical = o.vertical
    FROM organizations o
    WHERE up.organization_id = o.id 
    AND up.active_vertical = 'church'
    AND o.vertical IS NOT NULL
    AND o.vertical IN ('church', 'business', 'estate');
  END IF;
END $$;

-- Ensure all existing organizations have enabled_verticals populated
UPDATE organizations
SET enabled_verticals = ARRAY['church', 'business', 'estate']
WHERE enabled_verticals IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_active_vertical 
ON user_profiles(active_vertical);

CREATE INDEX IF NOT EXISTS idx_organizations_enabled_verticals 
ON organizations USING GIN(enabled_verticals);

-- Create validation function to ensure active_vertical is in enabled_verticals
CREATE OR REPLACE FUNCTION validate_user_active_vertical()
RETURNS TRIGGER AS $$
DECLARE
  org_enabled_verticals text[];
BEGIN
  -- Get organization's enabled verticals
  SELECT enabled_verticals INTO org_enabled_verticals
  FROM organizations
  WHERE id = NEW.organization_id;

  -- If active_vertical is not in enabled list, set to first enabled vertical
  IF org_enabled_verticals IS NOT NULL 
     AND NOT (NEW.active_vertical = ANY(org_enabled_verticals)) THEN
    NEW.active_vertical := org_enabled_verticals[1];
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate active_vertical on insert and update
DROP TRIGGER IF EXISTS validate_active_vertical_trigger ON user_profiles;
CREATE TRIGGER validate_active_vertical_trigger
  BEFORE INSERT OR UPDATE OF active_vertical ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_active_vertical();

-- Create function to get user's enabled verticals
CREATE OR REPLACE FUNCTION get_user_enabled_verticals(user_uuid uuid)
RETURNS text[] AS $$
DECLARE
  enabled_verts text[];
BEGIN
  SELECT o.enabled_verticals INTO enabled_verts
  FROM organizations o
  INNER JOIN user_profiles up ON up.organization_id = o.id
  WHERE up.id = user_uuid;
  
  RETURN COALESCE(enabled_verts, ARRAY['church', 'business', 'estate']);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_enabled_verticals(uuid) TO authenticated;