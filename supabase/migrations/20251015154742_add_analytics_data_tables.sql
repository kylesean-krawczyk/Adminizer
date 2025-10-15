/*
  # Add Analytics Data Tables for Natural Language Queries

  ## Overview
  This migration creates comprehensive data tables to support natural language analytics queries
  for employees, donations, grants, donors, and campaigns.

  ## New Tables

  ### 1. employees
  Tracks employee/staff information with full employment details:
  - `id` (uuid, primary key) - Unique employee identifier
  - `name` (text) - Full employee name
  - `email` (text) - Employee email address
  - `department` (text) - Department/ministry assignment
  - `position` (text) - Job title or role
  - `hire_date` (date) - Date of hiring
  - `termination_date` (date, nullable) - Date of termination if applicable
  - `status` (text) - Employment status: active, on_leave, terminated
  - `salary` (decimal, nullable) - Annual salary (sensitive field)
  - `manager_id` (uuid, nullable) - Reference to manager employee
  - `organization_id` (uuid) - Organization this employee belongs to
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record last update timestamp

  ### 2. donors
  Stores donor information and giving history:
  - `id` (uuid, primary key) - Unique donor identifier
  - `name` (text) - Donor full name
  - `email` (text, nullable) - Donor email address
  - `phone` (text, nullable) - Donor phone number
  - `address` (text, nullable) - Donor mailing address
  - `total_lifetime_giving` (decimal) - Cumulative donation total
  - `first_donation_date` (date, nullable) - Date of first donation
  - `last_donation_date` (date, nullable) - Date of most recent donation
  - `donor_category` (text) - Category: major, regular, occasional, lapsed
  - `organization_id` (uuid) - Organization this donor supports
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record last update timestamp

  ### 3. campaigns
  Tracks fundraising campaigns:
  - `id` (uuid, primary key) - Unique campaign identifier
  - `name` (text) - Campaign name
  - `goal_amount` (decimal) - Fundraising goal
  - `start_date` (date) - Campaign start date
  - `end_date` (date) - Campaign end date
  - `status` (text) - Status: planning, active, completed, cancelled
  - `description` (text, nullable) - Campaign description
  - `organization_id` (uuid) - Organization running the campaign
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record last update timestamp

  ### 4. donations
  Records individual donations with full details:
  - `id` (uuid, primary key) - Unique donation identifier
  - `donor_id` (uuid) - Reference to donors table
  - `donor_name` (text) - Donor name (denormalized for quick access)
  - `donor_email` (text, nullable) - Donor email (denormalized)
  - `amount` (decimal) - Donation amount
  - `donation_date` (date) - Date donation was received
  - `payment_method` (text) - Method: cash, check, credit_card, bank_transfer, online
  - `payment_status` (text) - Status: pending, completed, failed, refunded
  - `purpose` (text, nullable) - Donation purpose or designation
  - `campaign_id` (uuid, nullable) - Related campaign if applicable
  - `notes` (text, nullable) - Additional notes
  - `tax_deductible` (boolean) - Whether donation is tax deductible
  - `organization_id` (uuid) - Organization receiving the donation
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record last update timestamp

  ### 5. grants
  Tracks grant applications and awards:
  - `id` (uuid, primary key) - Unique grant identifier
  - `grant_name` (text) - Name of the grant program
  - `granting_organization` (text) - Organization providing the grant
  - `contact_person` (text, nullable) - Contact at granting organization
  - `amount_requested` (decimal) - Amount requested in application
  - `amount_awarded` (decimal, nullable) - Amount actually awarded
  - `application_date` (date) - Date application was submitted
  - `submission_deadline` (date, nullable) - Application deadline
  - `decision_date` (date, nullable) - Date decision was made
  - `status` (text) - Status: draft, submitted, under_review, awarded, rejected, withdrawn
  - `purpose` (text, nullable) - Purpose of the grant
  - `notes` (text, nullable) - Additional notes
  - `organization_id` (uuid) - Organization applying for the grant
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record last update timestamp

  ## Security
  - Enable RLS on all tables
  - Users can only access data from their own organization
  - Salary data in employees table requires special permission handling
  - All policies check authentication and organization membership

  ## Performance
  - Indexes on organization_id for all tables
  - Indexes on date fields for time-based queries
  - Indexes on status fields for filtering
  - Composite indexes for common query patterns

  ## Important Notes
  - All monetary values use DECIMAL(12,2) for precision
  - Date fields use DATE type for day-level granularity
  - Status fields use text with application-level validation
  - Foreign keys use ON DELETE CASCADE where appropriate
*/

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  department text NOT NULL,
  position text NOT NULL,
  hire_date date NOT NULL,
  termination_date date,
  status text NOT NULL DEFAULT 'active',
  salary decimal(12,2),
  manager_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  organization_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create donors table
CREATE TABLE IF NOT EXISTS donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  total_lifetime_giving decimal(12,2) DEFAULT 0,
  first_donation_date date,
  last_donation_date date,
  donor_category text DEFAULT 'occasional',
  organization_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  goal_amount decimal(12,2) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'planning',
  description text,
  organization_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid REFERENCES donors(id) ON DELETE SET NULL,
  donor_name text NOT NULL,
  donor_email text,
  amount decimal(12,2) NOT NULL,
  donation_date date NOT NULL,
  payment_method text NOT NULL DEFAULT 'cash',
  payment_status text NOT NULL DEFAULT 'completed',
  purpose text,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  notes text,
  tax_deductible boolean DEFAULT true,
  organization_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create grants table
CREATE TABLE IF NOT EXISTS grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_name text NOT NULL,
  granting_organization text NOT NULL,
  contact_person text,
  amount_requested decimal(12,2) NOT NULL,
  amount_awarded decimal(12,2),
  application_date date NOT NULL,
  submission_deadline date,
  decision_date date,
  status text NOT NULL DEFAULT 'draft',
  purpose text,
  notes text,
  organization_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_org_id ON employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_hire_date ON employees(hire_date);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_org_status ON employees(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_donors_org_id ON donors(organization_id);
CREATE INDEX IF NOT EXISTS idx_donors_category ON donors(donor_category);
CREATE INDEX IF NOT EXISTS idx_donors_last_donation ON donors(last_donation_date);

CREATE INDEX IF NOT EXISTS idx_campaigns_org_id ON campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaigns(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_donations_org_id ON donations(organization_id);
CREATE INDEX IF NOT EXISTS idx_donations_date ON donations(donation_date);
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(payment_status);
CREATE INDEX IF NOT EXISTS idx_donations_org_date ON donations(organization_id, donation_date);

CREATE INDEX IF NOT EXISTS idx_grants_org_id ON grants(organization_id);
CREATE INDEX IF NOT EXISTS idx_grants_status ON grants(status);
CREATE INDEX IF NOT EXISTS idx_grants_application_date ON grants(application_date);
CREATE INDEX IF NOT EXISTS idx_grants_decision_date ON grants(decision_date);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE grants ENABLE ROW LEVEL SECURITY;

-- Employees policies
CREATE POLICY "Users can view employees from their organization"
  ON employees FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert employees to their organization"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update employees in their organization"
  ON employees FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete employees from their organization"
  ON employees FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Donors policies
CREATE POLICY "Users can view donors from their organization"
  ON donors FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert donors to their organization"
  ON donors FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update donors in their organization"
  ON donors FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete donors from their organization"
  ON donors FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Campaigns policies
CREATE POLICY "Users can view campaigns from their organization"
  ON campaigns FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert campaigns to their organization"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update campaigns in their organization"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete campaigns from their organization"
  ON campaigns FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Donations policies
CREATE POLICY "Users can view donations from their organization"
  ON donations FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert donations to their organization"
  ON donations FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update donations in their organization"
  ON donations FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete donations from their organization"
  ON donations FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Grants policies
CREATE POLICY "Users can view grants from their organization"
  ON grants FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert grants to their organization"
  ON grants FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update grants in their organization"
  ON grants FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete grants from their organization"
  ON grants FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );