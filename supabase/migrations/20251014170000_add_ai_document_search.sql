/*
  # AI-Powered Document Search Enhancement

  ## Overview
  This migration adds comprehensive AI-powered document search capabilities to the platform,
  enabling natural language queries, intelligent filtering, and semantic search.

  ## 1. Schema Enhancements

  ### Documents Table Updates
  - `content_extracted` (text, nullable) - Extracted text content from documents for full-text search
  - `document_type` (text) - Classified document type (invoice, contract, report, etc.)
  - `indexed_keywords` (text array) - AI-extracted keywords for better search matching
  - `author` (text, nullable) - Document author or creator
  - `department` (text, nullable) - Associated department or business unit
  - Full-text search index on multiple columns

  ## 2. New Tables

  ### document_search_history
  Tracks user search queries to improve AI suggestions and learn patterns
  - `id` (uuid, primary key)
  - `user_id` (uuid) - User who performed the search
  - `query` (text) - Original natural language query
  - `extracted_params` (jsonb) - AI-extracted search parameters
  - `results_count` (integer) - Number of results returned
  - `clicked_document_id` (uuid, nullable) - Document user clicked from results
  - `search_timestamp` (timestamptz)

  ### document_metadata
  Stores additional extracted metadata for advanced filtering
  - `id` (uuid, primary key)
  - `document_id` (uuid, foreign key) - Reference to documents table
  - `fiscal_year` (text, nullable) - Extracted fiscal year
  - `fiscal_quarter` (text, nullable) - Extracted fiscal quarter (Q1, Q2, Q3, Q4)
  - `project_name` (text, nullable) - Associated project name
  - `confidence_score` (numeric) - AI confidence in extracted metadata
  - `metadata_json` (jsonb) - Additional flexible metadata storage

  ### document_relationships
  Tracks related documents for recommendation engine
  - `id` (uuid, primary key)
  - `document_id` (uuid, foreign key) - Primary document
  - `related_document_id` (uuid, foreign key) - Related document
  - `relationship_type` (text) - Type of relationship (similar, supersedes, references)
  - `similarity_score` (numeric) - How similar/related the documents are

  ## 3. Security
  - Enable RLS on all new tables
  - Restrict access to authenticated users only
  - Users can only see their own organization's search history
  - Document metadata and relationships follow document access permissions

  ## 4. Indexes
  - Full-text search indexes for performance
  - GIN indexes on array and JSONB columns
  - B-tree indexes on frequently filtered columns
*/

-- Add new columns to documents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'content_extracted'
  ) THEN
    ALTER TABLE documents ADD COLUMN content_extracted text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'document_type'
  ) THEN
    ALTER TABLE documents ADD COLUMN document_type text DEFAULT 'other';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'indexed_keywords'
  ) THEN
    ALTER TABLE documents ADD COLUMN indexed_keywords text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'author'
  ) THEN
    ALTER TABLE documents ADD COLUMN author text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'department'
  ) THEN
    ALTER TABLE documents ADD COLUMN department text;
  END IF;
END $$;

-- Create document_search_history table
CREATE TABLE IF NOT EXISTS document_search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid,
  query text NOT NULL,
  extracted_params jsonb DEFAULT '{}'::jsonb,
  results_count integer DEFAULT 0,
  clicked_document_id uuid,
  search_timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create document_metadata table
CREATE TABLE IF NOT EXISTS document_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  fiscal_year text,
  fiscal_quarter text,
  project_name text,
  confidence_score numeric DEFAULT 0.0,
  metadata_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document_relationships table
CREATE TABLE IF NOT EXISTS document_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  related_document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  relationship_type text NOT NULL,
  similarity_score numeric DEFAULT 0.0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_id, related_document_id, relationship_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_department ON documents(department);
CREATE INDEX IF NOT EXISTS idx_documents_author ON documents(author);
CREATE INDEX IF NOT EXISTS idx_documents_indexed_keywords ON documents USING GIN(indexed_keywords);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_documents_fulltext ON documents USING GIN(
  to_tsvector('english',
    coalesce(name, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(content_extracted, '') || ' ' ||
    coalesce(array_to_string(tags, ' '), '') || ' ' ||
    coalesce(array_to_string(indexed_keywords, ' '), '')
  )
);

-- Indexes for search history
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON document_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_org_id ON document_search_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_search_history_timestamp ON document_search_history(search_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_params ON document_search_history USING GIN(extracted_params);

-- Indexes for metadata
CREATE INDEX IF NOT EXISTS idx_metadata_document_id ON document_metadata(document_id);
CREATE INDEX IF NOT EXISTS idx_metadata_fiscal_year ON document_metadata(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_metadata_fiscal_quarter ON document_metadata(fiscal_quarter);
CREATE INDEX IF NOT EXISTS idx_metadata_json ON document_metadata USING GIN(metadata_json);

-- Indexes for relationships
CREATE INDEX IF NOT EXISTS idx_relationships_document_id ON document_relationships(document_id);
CREATE INDEX IF NOT EXISTS idx_relationships_related_id ON document_relationships(related_document_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON document_relationships(relationship_type);

-- Enable RLS on new tables
ALTER TABLE document_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_search_history
CREATE POLICY "Users can view own search history"
  ON document_search_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history"
  ON document_search_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own search history"
  ON document_search_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history"
  ON document_search_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for document_metadata
CREATE POLICY "Users can view metadata for accessible documents"
  ON document_metadata FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_metadata.document_id
    )
  );

CREATE POLICY "Users can insert document metadata"
  ON document_metadata FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_metadata.document_id
    )
  );

CREATE POLICY "Users can update document metadata"
  ON document_metadata FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_metadata.document_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_metadata.document_id
    )
  );

CREATE POLICY "Users can delete document metadata"
  ON document_metadata FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_metadata.document_id
    )
  );

-- RLS Policies for document_relationships
CREATE POLICY "Users can view relationships for accessible documents"
  ON document_relationships FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_relationships.document_id
    )
  );

CREATE POLICY "Users can insert document relationships"
  ON document_relationships FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_relationships.document_id
    )
  );

CREATE POLICY "Users can update document relationships"
  ON document_relationships FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_relationships.document_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_relationships.document_id
    )
  );

CREATE POLICY "Users can delete document relationships"
  ON document_relationships FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_relationships.document_id
    )
  );

-- Update trigger for document_metadata
DROP TRIGGER IF EXISTS update_document_metadata_updated_at ON document_metadata;
CREATE TRIGGER update_document_metadata_updated_at
  BEFORE UPDATE ON document_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper function for intelligent document search
CREATE OR REPLACE FUNCTION search_documents_intelligent(
  search_query text,
  doc_type text DEFAULT NULL,
  doc_category text DEFAULT NULL,
  doc_department text DEFAULT NULL,
  date_from date DEFAULT NULL,
  date_to date DEFAULT NULL,
  doc_tags text[] DEFAULT NULL,
  max_results integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  name text,
  category text,
  document_type text,
  department text,
  upload_date date,
  expiry_date date,
  size bigint,
  status text,
  file_path text,
  tags text[],
  description text,
  author text,
  indexed_keywords text[],
  relevance_score real,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.name,
    d.category,
    d.document_type,
    d.department,
    d.upload_date,
    d.expiry_date,
    d.size,
    d.status,
    d.file_path,
    d.tags,
    d.description,
    d.author,
    d.indexed_keywords,
    ts_rank(
      to_tsvector('english',
        coalesce(d.name, '') || ' ' ||
        coalesce(d.description, '') || ' ' ||
        coalesce(d.content_extracted, '') || ' ' ||
        coalesce(array_to_string(d.tags, ' '), '') || ' ' ||
        coalesce(array_to_string(d.indexed_keywords, ' '), '')
      ),
      plainto_tsquery('english', search_query)
    )::real AS relevance_score,
    d.created_at
  FROM documents d
  WHERE
    (search_query IS NULL OR search_query = '' OR
      to_tsvector('english',
        coalesce(d.name, '') || ' ' ||
        coalesce(d.description, '') || ' ' ||
        coalesce(d.content_extracted, '') || ' ' ||
        coalesce(array_to_string(d.tags, ' '), '') || ' ' ||
        coalesce(array_to_string(d.indexed_keywords, ' '), '')
      ) @@ plainto_tsquery('english', search_query)
    )
    AND (doc_type IS NULL OR d.document_type = doc_type)
    AND (doc_category IS NULL OR d.category = doc_category)
    AND (doc_department IS NULL OR d.department = doc_department)
    AND (date_from IS NULL OR d.upload_date >= date_from)
    AND (date_to IS NULL OR d.upload_date <= date_to)
    AND (doc_tags IS NULL OR d.tags && doc_tags)
  ORDER BY relevance_score DESC, d.created_at DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;
