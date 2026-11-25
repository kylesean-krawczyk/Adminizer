/*
  PRE-APPLY SNAPSHOT for 20261119180000_harden_user_profiles_rls.sql

  Run this in the Supabase SQL editor BEFORE applying the migration, in each
  database (dev first, then production). It is read-only.

  Each output row is a SQL statement that recreates one existing
  user_profiles policy or helper function exactly as it is today. Copy the
  entire `restore_sql` column and save it somewhere safe (e.g. a text file
  named with the database and date). That saved output is what step 3 of the
  rollback script restores.
*/

SELECT 1 AS step, policyname AS name,
  format(
    'CREATE POLICY %I ON public.user_profiles AS %s FOR %s TO %s%s%s;',
    policyname,
    permissive,
    cmd,
    array_to_string(roles, ', '),
    COALESCE(' USING (' || qual || ')', ''),
    COALESCE(' WITH CHECK (' || with_check || ')', '')
  ) AS restore_sql
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'user_profiles'

UNION ALL

SELECT 0 AS step, p.proname AS name,
  pg_get_functiondef(p.oid) || ';' AS restore_sql
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('get_user_organization_id', 'get_user_role', 'is_user_active', 'is_super_admin')

ORDER BY step, name;
