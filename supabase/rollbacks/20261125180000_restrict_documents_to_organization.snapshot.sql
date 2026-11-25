/*
  PRE-APPLY SNAPSHOT for 20261125180000_restrict_documents_to_organization.sql

  Run BEFORE applying, in each database. Read-only. Save the whole output.

  The first rows are a pre-check:
    documents_total             all document rows
    documents_without_org       rows with organization_id IS NULL
    documents_in_other_orgs     rows whose organization is not the single
                                organization in this database
  If documents_without_org is above 0, tell Claude before applying: those
  rows stay visible to every signed-in user until they are assigned an
  organization.
*/

SELECT 'precheck' AS kind, 'documents_total' AS name, count(*)::text AS restore_sql FROM public.documents
UNION ALL
SELECT 'precheck', 'documents_without_org', count(*)::text FROM public.documents WHERE organization_id IS NULL
UNION ALL
SELECT 'precheck', 'organizations', count(*)::text FROM public.organizations

UNION ALL

SELECT 'policy', policyname,
  format(
    'CREATE POLICY %I ON public.documents AS %s FOR %s TO %s%s%s;',
    policyname, permissive, cmd, array_to_string(roles, ', '),
    COALESCE(' USING (' || qual || ')', ''),
    COALESCE(' WITH CHECK (' || with_check || ')', '')
  )
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'documents'

UNION ALL

SELECT 'grant', grantee || ':' || privilege_type,
  format('GRANT %s ON TABLE public.documents TO %I;', privilege_type, grantee)
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'documents'
  AND grantee IN ('anon', 'authenticated')

ORDER BY 1, 2;
