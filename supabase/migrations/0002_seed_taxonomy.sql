-- ===========================================================================
-- NCERT4IAS — M1 taxonomy seed (idempotent)
-- Seeds Classes 6–12, the four MVP subjects, and the GS lens tags.
-- Books & chapters are authored later via the admin taxonomy manager (M2).
-- ===========================================================================

insert into public.classes (number, label) values
  (6,  'Class 6'),
  (7,  'Class 7'),
  (8,  'Class 8'),
  (9,  'Class 9'),
  (10, 'Class 10'),
  (11, 'Class 11'),
  (12, 'Class 12')
on conflict (number) do nothing;

insert into public.subjects (slug, name, ncert_name, code_prefix, "order", enabled) values
  ('history',   'History',   null,                          'H', 1, true),
  ('polity',    'Polity',    'Political Science / Civics',  'P', 2, true),
  ('geography', 'Geography', null,                          'G', 3, true),
  ('economy',   'Economy',   'Economics',                   'E', 4, true),
  ('science',   'Science',   null,                          'S', 5, true)
on conflict (slug) do nothing;

insert into public.gs_tags (code, label, note, "order") values
  ('GS-I',   'GS-I',   'History, Geography, Society, Art & Culture', 1),
  ('GS-II',  'GS-II',  'Polity, Governance, IR, Social Justice',    2),
  ('GS-III', 'GS-III', 'Economy, Environment, Sci-Tech, Security',  3),
  ('GS-IV',  'GS-IV',  'Ethics, Integrity & Aptitude',              4)
on conflict (code) do nothing;
