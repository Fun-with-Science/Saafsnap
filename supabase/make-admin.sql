-- Makes an existing account the SaafSnap admin.
-- 1. Sign up in the app with your own Google account or email.
-- 2. Replace the email below with that account's email, then click Run.
update public.profiles
set role = 'admin', status = 'active'
where id = (select id from auth.users where email = 'YOUR-EMAIL@example.com');

-- Should list your email with role "admin". If it is empty, the email above has no account yet.
select u.email, p.role, p.status
from public.profiles p join auth.users u on u.id = p.id
where p.role = 'admin';
