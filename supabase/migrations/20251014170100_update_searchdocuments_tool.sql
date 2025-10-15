/*
  # Update searchDocuments Tool Definition

  ## Overview
  Updates the searchDocuments tool in the AI tool registry to support the new
  AI-powered search capabilities with enhanced parameters.

  ## Changes
  - Update tool description to reflect AI capabilities
  - Add new parameters: documentType, department, dateFrom, dateTo, author
  - Update existing parameters with better descriptions
*/

-- Update the searchDocuments tool description
UPDATE ai_tool_registry
SET
  description = 'AI-powered intelligent document search. Supports natural language queries and automatically extracts search parameters like document type, date ranges, categories, departments, and tags. Provides relevance-ranked results with suggestions when no matches are found.',
  updated_at = now()
WHERE slug = 'searchDocuments';

-- Add new parameters for enhanced search
DO $$
DECLARE
  tool_id uuid;
BEGIN
  SELECT id INTO tool_id FROM ai_tool_registry WHERE slug = 'searchDocuments';

  IF tool_id IS NOT NULL THEN
    INSERT INTO ai_tool_parameters (tool_id, name, type, description, is_required, default_value)
    VALUES
      (tool_id, 'documentType', 'string', 'Type of document to search for (e.g., invoice, contract, report, policy, handbook, manual, guideline, presentation, spreadsheet, form)', false, null),
      (tool_id, 'department', 'string', 'Department or business unit (e.g., Finance, HR, Marketing, Sales, Operations, IT, Legal)', false, null),
      (tool_id, 'dateFrom', 'string', 'Start date for date range filter (YYYY-MM-DD format)', false, null),
      (tool_id, 'dateTo', 'string', 'End date for date range filter (YYYY-MM-DD format)', false, null),
      (tool_id, 'author', 'string', 'Document author or creator name', false, null)
    ON CONFLICT (tool_id, name) DO UPDATE
    SET
      type = EXCLUDED.type,
      description = EXCLUDED.description,
      is_required = EXCLUDED.is_required,
      default_value = EXCLUDED.default_value,
      updated_at = now();

    UPDATE ai_tool_parameters
    SET
      description = 'Natural language search query. Can include document names, keywords, dates, document types, categories, and any descriptive text about what you are looking for.',
      updated_at = now()
    WHERE tool_id = tool_id AND name = 'query';

    UPDATE ai_tool_parameters
    SET
      description = 'Document category filter (e.g., HR, Accounting, Branding, Social Media, Legal, Financial, Operations). Leave empty to search all categories.',
      updated_at = now()
    WHERE tool_id = tool_id AND name = 'category';

    UPDATE ai_tool_parameters
    SET
      description = 'Array of tags to filter by. Documents must have at least one matching tag.',
      updated_at = now()
    WHERE tool_id = tool_id AND name = 'tags';
  END IF;
END $$;

-- Add example usage documentation
DO $$
DECLARE
  tool_id uuid;
BEGIN
  SELECT id INTO tool_id FROM ai_tool_registry WHERE slug = 'searchDocuments';

  IF tool_id IS NOT NULL THEN
    INSERT INTO ai_tool_configuration (tool_id, config_key, config_value)
    VALUES
      (tool_id, 'example_queries', jsonb_build_array(
        'find the Q3 financial report',
        'show me all invoices from last month',
        'search for employee handbooks',
        'get legal documents from 2024',
        'find contracts in the HR department'
      )),
      (tool_id, 'search_tips', jsonb_build_array(
        'Use natural language - the AI will extract relevant parameters',
        'Mention time periods like "last month", "Q3", or specific years',
        'Include document types like "report", "invoice", "contract"',
        'Specify departments or categories when known',
        'Be as specific or general as needed'
      ))
    ON CONFLICT (tool_id, config_key) DO UPDATE
    SET
      config_value = EXCLUDED.config_value,
      updated_at = now();
  END IF;
END $$;
