/*
  # AI Chat Assistant Tables

  ## Overview
  Creates the database schema for the AI chat assistant feature, including chat sessions 
  and message storage with proper user relationships and timestamps.

  ## New Tables
  
  ### `chat_sessions`
  Stores individual chat conversation sessions for users.
  - `id` (uuid, primary key) - Unique session identifier
  - `user_id` (uuid, foreign key) - Links to auth.users
  - `title` (text) - Optional session title/summary
  - `created_at` (timestamptz) - When the session was created
  - `updated_at` (timestamptz) - Last message timestamp
  - `organization_id` (uuid, foreign key) - Links to organizations table

  ### `chat_messages`
  Stores individual messages within chat sessions.
  - `id` (uuid, primary key) - Unique message identifier
  - `session_id` (uuid, foreign key) - Links to chat_sessions
  - `user_id` (uuid, foreign key) - Links to auth.users
  - `message` (text) - The actual message content
  - `role` (text) - Either 'user' or 'assistant'
  - `created_at` (timestamptz) - Message timestamp

  ## Security
  
  ### Row Level Security (RLS)
  - Both tables have RLS enabled
  - Users can only access their own chat sessions and messages
  - Policies enforce user_id matching for all operations
  - Authenticated users only - no public access
  
  ### Policies
  - `chat_sessions`: SELECT, INSERT, UPDATE, DELETE policies for own sessions
  - `chat_messages`: SELECT, INSERT policies for own messages (no update/delete to preserve history)

  ## Important Notes
  - Messages are immutable once created (no UPDATE/DELETE policies)
  - Sessions automatically update their `updated_at` timestamp via trigger
  - All timestamps use `timestamptz` for timezone awareness
  - Foreign key constraints ensure data integrity
*/

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  title text DEFAULT 'New Chat',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_organization_id ON chat_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Enable Row Level Security
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat Sessions Policies
CREATE POLICY "Users can view own chat sessions"
  ON chat_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions"
  ON chat_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON chat_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
  ON chat_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Chat Messages Policies
CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to update chat_sessions.updated_at when new message is added
CREATE OR REPLACE FUNCTION update_chat_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions
  SET updated_at = now()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update session timestamp
CREATE TRIGGER trigger_update_chat_session_timestamp
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_session_timestamp();