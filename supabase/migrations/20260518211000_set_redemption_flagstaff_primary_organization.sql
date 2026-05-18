/*
  # Set the primary organization to Redemption Flagstaff

  The setup scripts created the canonical organization with the stable ID
  `00000000-0000-0000-0000-000000000001` and a placeholder name. Production
  invites should target and display Redemption Flagstaff instead.
*/

INSERT INTO public.organizations (
  id,
  name,
  vertical,
  enabled_verticals,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Redemption Flagstaff',
  'church',
  ARRAY['church', 'business', 'estate'],
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  vertical = EXCLUDED.vertical,
  enabled_verticals = EXCLUDED.enabled_verticals,
  updated_at = now();

UPDATE public.user_profiles
SET
  organization_id = '00000000-0000-0000-0000-000000000001'::uuid,
  active_vertical = 'church',
  updated_at = now()
WHERE lower(email) IN (
  'kyle.sean.krawczyk@gmail.com',
  'kyle@redemptionflagstaff.com'
);

UPDATE public.organizations
SET
  name = 'Redemption Flagstaff',
  vertical = 'church',
  updated_at = now()
WHERE lower(name) IN ('primary organization', 'church');
