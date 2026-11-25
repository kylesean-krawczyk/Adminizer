/*
  PRE-APPLY SNAPSHOT for 20261125170000_enable_user_invitations_rls.sql

  Run BEFORE applying the migration, in each database. Read-only.
  Save the whole output; it records the current RLS setting, policies and
  table privileges on user_invitations.
*/

SELECT 'rls' AS kind, relname AS name,
  CASE WHEN relrowsecurity THEN 'ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;'
       ELSE 'ALTER TABLE public.user_invitations DISABLE ROW LEVEL SECURITY;' END AS restore_sql
FROM pg_class WHERE oid = 'public.user_invitations'::regclass

UNION ALL

SELECT 'policy', policyname,
  format(
    'CREATE POLICY %I ON public.user_invitations AS %s FOR %s TO %s%s%s;',
    policyname, permissive, cmd, array_to_string(roles, ', '),
    COALESCE(' USING (' || qual || ')', ''),
    COALESCE(' WITH CHECK (' || with_check || ')', '')
  )
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'user_invitations'

UNION ALL

SELECT 'grant', grantee || ':' || privilege_type,
  format('GRANT %s ON TABLE public.user_invitations TO %I;', privilege_type, grantee)
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'user_invitations'
  AND grantee IN ('anon', 'authenticated')

ORDER BY 1, 2;
