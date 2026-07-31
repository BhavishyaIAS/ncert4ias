-- ===========================================================================
-- Promote a signed-up user to admin.
-- 1. First sign up in the app (/signup) with this email.
-- 2. Replace the email below, then run this in the SQL Editor.
-- ===========================================================================

update public.profiles
set role = 'admin'
where id = (
  select id from auth.users
  where email = 'girishvenky007@gmail.com'
);

-- Verify:
-- select u.email, p.role
-- from public.profiles p join auth.users u on u.id = p.id
-- where p.role = 'admin';
