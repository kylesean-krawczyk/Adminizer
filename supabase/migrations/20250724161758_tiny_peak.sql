/*
  # Add donor data processing flag to documents table

  1. Schema Changes
    - Add `is_donor_data_processed` column to `documents` table
    - Set default value to `false` for new documents
    - Update existing documents to have `false` value

  2. Purpose
    - Track which donor data documents have been processed for analytics
    - Prevent duplicate processing of the same document
    - Enable automatic sync between document center and donor analytics
*/

-- Add the new column to track donor data processing status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'is_donor_data_processed'
  ) THEN
    ALTER TABLE documents ADD COLUMN is_donor_data_processed boolean DEFAULT false;
  END IF;
END $$;

-- Update existing documents to have the default value
UPDATE documents 
SET is_donor_data_processed = false 
WHERE is_donor_data_processed IS NULL;