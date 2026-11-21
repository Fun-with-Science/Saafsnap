-- Run once on a project set up before likes existed. Adds likes on cleaned spots.
alter table public.reports add column if not exists likes uuid[] not null default '{}';

create or replace function public.toggle_like(rid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Please log in first'; end if;
  update reports set likes = case when auth.uid() = any (likes) then array_remove(likes, auth.uid()) else array_append(likes, auth.uid()) end
  where id = rid and status = 'cleaned';
end $$;

revoke execute on function public.toggle_like(uuid) from public, anon;
grant execute on function public.toggle_like(uuid) to authenticated;

-- New reports must start with no likes.
drop policy if exists "create own report" on public.reports;
create policy "create own report" on public.reports for insert to authenticated with check (
  is_admin() or (
    created_by = auth.uid() and status = 'assigned' and cleanup is null
    and seen_extra = 0 and cardinality(seen_by) = 0 and cardinality(likes) = 0
  )
);
