/*
  # Add Intent Tracking to Chat System

  This migration enhances the chat system with intent detection capabilities,
  allowing the AI assistant to categorize and track user intentions.

  ## Changes to Existing Tables

  ### `chat_messages`
  - Add `intent` column to store detected intent category
  - Add `intent_confidence` column to store confidence score (0.0 to 1.0)
  - Add `metadata` column (JSONB) for additional context and analysis data

  ## Security
  - All new columns are nullable to maintain backward compatibility
  - No changes to existing RLS policies needed
  - Existing policies on chat_messages already restrict access appropriately

  ## Important Notes
  - Intent categories: employee_onboarding, document_search, data_analysis, general_question, system_navigation
  - Confidence scores help determine when clarification is needed
  - Metadata can store raw Claude responses, clarification questions, etc.
*/

-- Add intent tracking columns to chat_messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'intent'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN intent text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'intent_confidence'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN intent_confidence numeric(3,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add constraint to ensure intent is from valid set
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chat_messages_intent_check'
  ) THEN
    ALTER TABLE chat_messages
    ADD CONSTRAINT chat_messages_intent_check
    CHECK (intent IS NULL OR intent IN (
      'employee_onboarding',
      'document_search',
      'data_analysis',
      'general_question',
      'system_navigation'
    ));
  END IF;
END $$;

-- Add constraint to ensure confidence is between 0 and 1
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chat_messages_confidence_check'
  ) THEN
    ALTER TABLE chat_messages
    ADD CONSTRAINT chat_messages_confidence_check
    CHECK (intent_confidence IS NULL OR (intent_confidence >= 0 AND intent_confidence <= 1));
  END IF;
END $$;

-- Create index on intent for analytics and filtering
CREATE INDEX IF NOT EXISTS idx_chat_messages_intent ON chat_messages(intent) WHERE intent IS NOT NULL;

-- Create index on metadata for JSONB queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_metadata ON chat_messages USING gin(metadata);

-- Create a view for intent analytics
CREATE OR REPLACE VIEW chat_intent_analytics AS
SELECT
  user_id,
  intent,
  COUNT(*) as intent_count,
  AVG(intent_confidence) as avg_confidence,
  MIN(created_at) as first_occurrence,
  MAX(created_at) as last_occurrence
FROM chat_messages
WHERE intent IS NOT NULL AND role = 'user'
GROUP BY user_id, intent;
