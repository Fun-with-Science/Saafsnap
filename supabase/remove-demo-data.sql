-- Deletes every demo account (all emails ending in @saafsnap.demo), including the demo admin,
-- together with their profiles and every report they created. This cannot be undone.
-- Run supabase/make-admin.sql for your own account FIRST, or you will have no admin left.

-- Safety check: stop if no real admin exists yet.
do $$ begin
  if not exists (
    select 1 from public.profiles p join auth.users u on u.id = p.id
    where p.role = 'admin' and p.status = 'active' and u.email not like '%@saafsnap.demo'
  ) then
    raise exception 'No real admin account found. Run make-admin.sql with your own email first.';
  end if;
end $$;

-- Removing the login also removes the profile, contact and reports (they cascade).
delete from auth.users where email like '%@saafsnap.demo';

-- Should show 0 demo accounts left, and how many real accounts and reports remain.
select
  (select count(*) from auth.users where email like '%@saafsnap.demo') as demo_accounts_left,
  (select count(*) from auth.users) as accounts,
  (select count(*) from public.reports) as reports;
