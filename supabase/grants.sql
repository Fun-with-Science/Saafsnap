-- Run this once if you ran setup.sql before table access was added to it.
-- Row level security still decides which rows each user can see or change.
grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.contacts, public.reports to authenticated;
grant update (status) on public.profiles to authenticated;
grant insert, delete on public.reports to authenticated;
grant execute on function public.is_admin(), public.now_ms() to authenticated;
