/*
  # Fix restored deleted-user display name cleanup

  This is a standalone follow-up for environments that hit the invalid
  target-table alias reference in the previous cleanup query.
*/

WITH restored_names AS (
  SELECT
    up.id,
    COALESCE(
      (
        SELECT
          CASE
            WHEN archived_name IS NULL OR lower(archived_name) = 'deleted user' THEN NULL
            ELSE archived_name
          END
        FROM (
          SELECT NULLIF(btrim(du.profile_snapshot->>'full_name'), '') AS archived_name
          FROM public.deleted_user_profiles du
          WHERE du.deleted_user_id = up.id
          ORDER BY du.deleted_at DESC
          LIMIT 1
        ) archived
      ),
      NULLIF(btrim(au.raw_user_meta_data->>'full_name'), ''),
      au.email,
      up.email
    ) AS restored_full_name
  FROM public.user_profiles up
  JOIN auth.users au ON au.id = up.id
  WHERE up.organization_id IS NOT NULL
    AND up.is_active = true
    AND lower(COALESCE(up.full_name, '')) = 'deleted user'
)
UPDATE public.user_profiles up
SET
  full_name = restored_names.restored_full_name,
  updated_at = now()
FROM restored_names
WHERE up.id = restored_names.id;
