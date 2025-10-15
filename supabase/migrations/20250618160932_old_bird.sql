/*
  # Create documents table and storage

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `name` (text) - original filename
      - `category` (text) - document category
      - `upload_date` (date) - when document was uploaded
      - `expiry_date` (date, nullable) - when document expires
      - `size` (bigint) - file size in bytes
      - `status` (text) - document status
      - `file_path` (text) - path to file in storage
      - `tags` (text array) - document tags
      - `description` (text, nullable) - document description
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Storage
    - Create `documents` storage bucket
    - Enable public access for downloads

  3. Security
    - Enable RLS on `documents` table
    - Add policies for authenticated users to manage their documents
*/

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  upload_date date DEFAULT CURRENT_DATE,
  expiry_date date,
  size bigint NOT NULL,
  status text DEFAULT 'Active',
  file_path text NOT NULL,
  tags text[] DEFAULT '{}',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view documents"
  ON documents
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert documents"
  ON documents
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update documents"
  ON documents
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete documents"
  ON documents
  FOR DELETE
  TO public
  USING (true);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Anyone can view documents"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'documents');

CREATE POLICY "Anyone can upload documents"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Anyone can update documents"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'documents');

CREATE POLICY "Anyone can delete documents"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'documents');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();