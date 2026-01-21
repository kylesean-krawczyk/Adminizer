/*
  # Context-Aware AI Assistant with Smart Notifications

  ## Overview
  This migration creates the complete database schema for context-aware AI assistance,
  including page context tracking, proactive suggestions, and smart notification system.

  ## New Tables

  ### 1. `ai_page_context`
  Tracks user page navigation and context for generating relevant suggestions.
  - `id` (uuid, primary key) - Unique context entry identifier
  - `user_id` (uuid, foreign key) - User who navigated
  - `organization_id` (uuid) - Organization context
  - `page_type` (text) - Type of page: dashboard, documents, employees, fundraising, etc.
  - `page_route` (text) - Full route path
  - `context_data` (jsonb) - Rich context data including stats, entity IDs, filters
  - `created_at` (timestamptz) - Context capture timestamp

  ### 2. `ai_suggestions`
  Stores generated contextual suggestions for users.
  - `id` (uuid, primary key) - Unique suggestion identifier
  - `user_id` (uuid, foreign key) - Target user
  - `organization_id` (uuid) - Organization context
  - `page_type` (text) - Page where suggestion was generated
  - `suggestion_text` (text) - The actual suggestion text
  - `suggestion_query` (text) - Pre-filled query if user clicks the suggestion
  - `priority` (integer) - Priority level 1-10
  - `context_data` (jsonb) - Context that generated this suggestion
  - `clicked` (boolean) - Whether user clicked on this suggestion
  - `dismissed` (boolean) - Whether user dismissed this suggestion
  - `expires_at` (timestamptz) - When this suggestion becomes irrelevant
  - `created_at` (timestamptz) - Suggestion creation timestamp

  ### 3. `ai_notifications`
  Smart notifications about compliance, deadlines, patterns, and optimization opportunities.
  - `id` (uuid, primary key) - Unique notification identifier
  - `user_id` (uuid, foreign key) - Target user (null for organization-wide)
  - `organization_id` (uuid) - Organization context
  - `notification_type` (text) - Type: compliance, deadline, pattern, optimization
  - `priority` (text) - Priority: urgent, high, normal, low
  - `title` (text) - Notification title
  - `message` (text) - Detailed notification message
  - `category` (text) - Specific category: document_expiry, grant_deadline, etc.
  - `related_entity_type` (text) - Type of related entity: document, employee, grant, etc.
  - `related_entity_id` (uuid) - ID of related entity
  - `action_url` (text) - URL to navigate to for action
  - `action_label` (text) - Label for action button
  - `status` (text) - Status: unread, read, dismissed, actioned
  - `data` (jsonb) - Additional notification data
  - `snoozed_until` (timestamptz) - If snoozed, when to show again
  - `created_at` (timestamptz) - Notification creation timestamp
  - `read_at` (timestamptz) - When notification was read
  - `actioned_at` (timestamptz) - When action was taken

  ### 4. `notification_preferences`
  User preferences for notifications.
  - `id` (uuid, primary key) - Unique preference identifier
  - `user_id` (uuid, foreign key) - User these preferences belong to
  - `notification_type` (text) - Type of notification
  - `enabled` (boolean) - Whether this notification type is enabled
  - `frequency` (text) - Frequency: realtime, hourly, daily, weekly
  - `min_priority` (text) - Minimum priority to show: urgent, high, normal, low
  - `created_at` (timestamptz) - Preference creation timestamp
  - `updated_at` (timestamptz) - Preference update timestamp

  ### 5. `notification_rules`
  Configurable rules for generating smart notifications.
  - `id` (uuid, primary key) - Unique rule identifier
  - `organization_id` (uuid) - Organization this rule applies to (null for global)
  - `rule_name` (text) - Human-readable rule name
  - `notification_type` (text) - Type of notification this rule generates
  - `category` (text) - Specific category
  - `priority` (text) - Default priority for notifications from this rule
  - `conditions` (jsonb) - Rule conditions (e.g., days before deadline)
  - `enabled` (boolean) - Whether rule is active
  - `created_at` (timestamptz) - Rule creation timestamp
  - `updated_at` (timestamptz) - Rule update timestamp

  ## Security
  - Enable RLS on all tables
  - Users can only access their own context and suggestions
  - Notifications can be user-specific or organization-wide
  - Notification rules are organization-scoped
  - All policies check authentication and organization membership

  ## Performance
  - Indexes on user_id and organization_id for all tables
  - Index on page_type for quick context lookups
  - Index on notification status and priority for filtering
  - Index on created_at for time-based queries
  - Composite indexes for common query patterns

  ## Important Notes
  - Context data stored as JSONB for flexibility
  - Suggestions expire automatically for relevance
  - Notifications support snoozing and action tracking
  - Preferences allow fine-grained control
  - Rules enable organization-specific customization
*/

-- Create ai_page_context table
CREATE TABLE IF NOT EXISTS ai_page_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid,
  page_type text NOT NULL,
  page_route text NOT NULL,
  context_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create ai_suggestions table
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid,
  page_type text NOT NULL,
  suggestion_text text NOT NULL,
  suggestion_query text,
  priority integer DEFAULT 5,
  context_data jsonb DEFAULT '{}',
  clicked boolean DEFAULT false,
  dismissed boolean DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create ai_notifications table
CREATE TABLE IF NOT EXISTS ai_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  notification_type text NOT NULL,
  priority text NOT NULL DEFAULT 'normal',
  title text NOT NULL,
  message text NOT NULL,
  category text NOT NULL,
  related_entity_type text,
  related_entity_id uuid,
  action_url text,
  action_label text,
  status text NOT NULL DEFAULT 'unread',
  data jsonb DEFAULT '{}',
  snoozed_until timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  read_at timestamptz,
  actioned_at timestamptz
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notification_type text NOT NULL,
  enabled boolean DEFAULT true,
  frequency text DEFAULT 'realtime',
  min_priority text DEFAULT 'low',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, notification_type)
);

-- Create notification_rules table
CREATE TABLE IF NOT EXISTS notification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  rule_name text NOT NULL,
  notification_type text NOT NULL,
  category text NOT NULL,
  priority text NOT NULL DEFAULT 'normal',
  conditions jsonb DEFAULT '{}',
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_context_user_id ON ai_page_context(user_id);
CREATE INDEX IF NOT EXISTS idx_page_context_org_id ON ai_page_context(organization_id);
CREATE INDEX IF NOT EXISTS idx_page_context_page_type ON ai_page_context(page_type);
CREATE INDEX IF NOT EXISTS idx_page_context_created_at ON ai_page_context(created_at);

CREATE INDEX IF NOT EXISTS idx_suggestions_user_id ON ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_org_id ON ai_suggestions(organization_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_page_type ON ai_suggestions(page_type);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON ai_suggestions(clicked, dismissed);
CREATE INDEX IF NOT EXISTS idx_suggestions_expires ON ai_suggestions(expires_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON ai_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON ai_notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON ai_notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON ai_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON ai_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON ai_notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON ai_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_snoozed ON ai_notifications(snoozed_until);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_rules_org_id ON notification_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_notification_rules_enabled ON notification_rules(enabled);

-- Enable Row Level Security
ALTER TABLE ai_page_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;

-- Page Context Policies
CREATE POLICY "Users can view own page context"
  ON ai_page_context FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own page context"
  ON ai_page_context FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Suggestions Policies
CREATE POLICY "Users can view own suggestions"
  ON ai_suggestions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own suggestions"
  ON ai_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own suggestions"
  ON ai_suggestions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notifications Policies
CREATE POLICY "Users can view own notifications"
  ON ai_notifications FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    (user_id IS NULL AND organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can insert notifications to their organization"
  ON ai_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own notifications"
  ON ai_notifications FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    (user_id IS NULL AND organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    ))
  )
  WITH CHECK (
    auth.uid() = user_id OR
    (user_id IS NULL AND organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    ))
  );

-- Notification Preferences Policies
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notification Rules Policies
CREATE POLICY "Users can view notification rules for their organization"
  ON notification_rules FOR SELECT
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert notification rules"
  ON notification_rules FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IS NULL OR
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admins can update notification rules"
  ON notification_rules FOR UPDATE
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Insert default notification rules
INSERT INTO notification_rules (rule_name, notification_type, category, priority, conditions, enabled)
VALUES
  ('Document Expiring Soon', 'deadline', 'document_expiry', 'high', '{"days_before": 30}', true),
  ('Document Expired', 'compliance', 'document_expired', 'urgent', '{"days_overdue": 0}', true),
  ('Grant Deadline Approaching', 'deadline', 'grant_deadline', 'high', '{"days_before": 14}', true),
  ('Missing Required Documents', 'compliance', 'missing_documents', 'urgent', '{}', true),
  ('Employee Review Due', 'deadline', 'employee_review', 'normal', '{"days_before": 7}', true),
  ('Unusual Donation Pattern', 'pattern', 'donation_anomaly', 'normal', '{"threshold_percent": 50}', true),
  ('Workflow Bottleneck Detected', 'optimization', 'workflow_efficiency', 'normal', '{}', true)
ON CONFLICT DO NOTHING;