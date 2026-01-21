/*
  # Update RLS policies for authenticated users only

  1. Security Changes
    - Remove public access policies
    - Add authenticated-only policies for documents table
    - Add authenticated-only policies for storage bucket
    - Ensure only authenticated users can access documents

  2. Policy Updates
    - Documents table: Only authenticated users can CRUD
    - Storage: Only authenticated users can access files
*/

-- Drop existing public policies for documents table
DROP POLICY IF EXISTS "Anyone can view documents" ON documents;
DROP POLICY IF EXISTS "Anyone can insert documents" ON documents;
DROP POLICY IF EXISTS "Anyone can update documents" ON documents;
DROP POLICY IF EXISTS "Anyone can delete documents" ON documents;

-- Create new authenticated-only policies for documents table
CREATE POLICY "Authenticated users can view documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete documents"
  ON documents
  FOR DELETE
  TO authenticated
  USING (true);

-- Drop existing public policies for storage
DROP POLICY IF EXISTS "Anyone can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete documents" ON storage.objects;

-- Create new authenticated-only policies for storage
CREATE POLICY "Authenticated users can view documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can update documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');