-- Lets NGOs, groups and government accounts upload their own logo (Settings -> Logo).
-- Run once in Supabase -> SQL Editor on projects set up before this feature. Safe to run again.

alter table public.profiles add column if not exists avatar text;

do $$ begin
  alter table public.profiles add constraint profiles_avatar check (avatar is null or avatar ~ ('^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/photos/' || id::text || '/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$'));
exception when duplicate_object then null; end $$;

create or replace function public.set_avatar(url text) returns void
language plpgsql security definer set search_path = public as $$
declare p profiles;
begin
  select * into p from profiles where id = auth.uid();
  if p is null or p.role not in ('ngo', 'govt', 'group') then raise exception 'Only NGOs, groups and government accounts can set a logo'; end if;
  if url is not null and not is_own_photo(url) then raise exception 'Upload the logo through SaafSnap'; end if;
  update profiles set avatar = url where id = auth.uid();
end $$;

revoke execute on function public.set_avatar(text) from public, anon;
grant execute on function public.set_avatar(text) to authenticated;
