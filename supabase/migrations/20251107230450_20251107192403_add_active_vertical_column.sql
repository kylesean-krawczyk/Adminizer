/*
  # Add active_vertical Column to user_profiles

  1. Changes
    - Add active_vertical column to user_profiles table
    - Set default value to 'church'
    - Add constraint to ensure valid values (church, business, estate)
    - Update existing records to have 'church' as default vertical

  2. Notes
    - This column tracks which vertical configuration each user is currently using
    - Users can switch between verticals, and this tracks their active selection
*/

-- Add active_vertical column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'user_profiles' 
      AND column_name = 'active_vertical'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN active_vertical TEXT DEFAULT 'church'
    CHECK (active_vertical IN ('church', 'business', 'estate'));
  END IF;
END $$;

-- Update existing records to have the default vertical
UPDATE user_profiles
SET active_vertical = 'church'
WHERE active_vertical IS NULL;
