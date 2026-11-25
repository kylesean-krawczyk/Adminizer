/*
  ROLLBACK for 20261125180000_restrict_documents_to_organization.sql

  Not a migration: run manually in the Supabase SQL editor only if documents
  stop working after the fix.

  WARNING: this reopens the hole (every signed-in user can read, change and
  delete every document row). Prefer a targeted fix-forward.

  Restores the four policies exactly as they were on production
  (2026-11-25 export). Compare with your saved snapshot output.
*/

BEGIN;

DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.documents;
CREATE POLICY "Authenticated users can view documents"
  ON public.documents FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert documents" ON public.documents;
CREATE POLICY "Authenticated users can insert documents"
  ON public.documents FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update documents" ON public.documents;
CREATE POLICY "Authenticated users can update documents"
  ON public.documents FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete documents" ON public.documents;
CREATE POLICY "Authenticated users can delete documents"
  ON public.documents FOR DELETE TO authenticated USING (true);

GRANT ALL ON TABLE public.documents TO anon;

COMMIT;
