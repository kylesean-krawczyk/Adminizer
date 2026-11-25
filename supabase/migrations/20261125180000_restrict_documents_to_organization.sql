/*
  # Restrict documents to the signed-in user's organization

  Production's documents table had four policies with USING (true) /
  WITH CHECK (true):

    "Authenticated users can view documents"   (SELECT)
    "Authenticated users can insert documents" (INSERT)
    "Authenticated users can update documents" (UPDATE)
    "Authenticated users can delete documents" (DELETE)

  Policies are OR'ed together, so these cancelled the organization-scoped
  policies next to them: any signed-in user, in any organization, could read,
  change and delete every document row.

  1. Drop the four USING (true) policies. The existing
     "Users can ... documents in their organization" policies remain and now
     take effect.
  2. Revoke table privileges from `anon` (signed-out visitors never read
     documents directly).

  Known, unchanged here: the remaining organization policies also allow rows
  whose organization_id IS NULL. The app always sets organization_id on
  upload; see the pre-check in the snapshot script.

  Safe to re-run. Rollback: supabase/rollbacks/20261125180000_restrict_documents_to_organization.rollback.sql
*/

BEGIN;

DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can insert documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON public.documents;

REVOKE ALL ON TABLE public.documents FROM anon;

COMMIT;

/*
  Verification (run separately after applying):

  -- Expect exactly 4 policies, all named "Users can ... documents in their organization"
  select policyname, cmd from pg_policies
  where schemaname = 'public' and tablename = 'documents'
  order by cmd, policyname;

  -- Expect no rows
  select privilege_type from information_schema.role_table_grants
  where table_schema = 'public' and table_name = 'documents' and grantee = 'anon';
*/
