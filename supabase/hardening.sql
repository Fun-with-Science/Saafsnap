-- Extra safety rules. Already part of setup.sql; run this once on projects set up before it existed.
-- Safe to run again.

-- Photos: images only, max 5 MB each.
update storage.buckets
set file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'photos';

-- Sensible size limits on text people type.
do $$ begin
  alter table public.reports add constraint reports_landmark_len check (char_length(landmark) <= 120) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.reports add constraint reports_ai_size check (pg_column_size(ai) <= 20000) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.reports add constraint reports_location check (lat between -90 and 90 and lng between -180 and 180) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.profiles add constraint profiles_name_len check (char_length(name) <= 80) not valid;
exception when duplicate_object then null; end $$;
-- Reports must have the fields the app needs, so one bad row can't break the feed.
do $$ begin
  alter table public.reports add constraint reports_ai_shape check (
    jsonb_typeof(ai) = 'object' and jsonb_typeof(ai -> 'title') = 'string' and jsonb_typeof(ai -> 'severity') = 'number'
    and jsonb_typeof(ai -> 'waste_types') = 'array' and jsonb_typeof(ai -> 'hazards') = 'array'
  ) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.reports add constraint reports_department check (
    department in ('swm', 'water', 'drainage', 'health', 'hazardous', 'construction', 'animal')
  ) not valid;
exception when duplicate_object then null; end $$;

-- A photo link must point at the uploader's own folder in this project's storage.
create or replace function public.is_own_photo(url text) returns boolean
language sql stable set search_path = public as $$
  select url ~ ('^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/photos/' || auth.uid()::text || '/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$');
$$;
grant execute on function public.is_own_photo(text) to authenticated;

-- Likes column must exist for the policy below (older projects).
alter table public.reports add column if not exists likes uuid[] not null default '{}';

drop policy if exists "create own report" on public.reports;
create policy "create own report" on public.reports for insert to authenticated with check (
  is_admin() or (
    created_by = auth.uid() and status = 'assigned' and cleanup is null
    and seen_extra = 0 and cardinality(seen_by) = 0 and cardinality(likes) = 0
    and attempts = '[]'::jsonb and is_own_photo(photo)
  )
);

-- Cleanup proof must also be the cleaner's own upload.
create or replace function public.submit_cleanup(rid uuid, photo_url text, verification jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare p profiles; ok boolean := coalesce((verification ->> 'verified')::boolean, false);
begin
  select * into p from profiles where id = auth.uid();
  if p is null then raise exception 'Please log in first'; end if;
  if not is_own_photo(photo_url) then raise exception 'Upload the proof photo through the app'; end if;
  if pg_column_size(verification) > 8000 then raise exception 'Verification data too large'; end if;
  if ok then
    update reports set
      status = 'cleaned',
      cleanup = jsonb_build_object('by', auth.uid(), 'at', now_ms(), 'photo', photo_url, 'verification', verification),
      timeline = timeline || jsonb_build_array(jsonb_build_object('type', 'cleaned', 'at', now_ms(), 'by', auth.uid(),
        'text', 'Cleaned by ' || coalesce(p.org ->> 'name', p.name) || ' · AI verified the proof photo'))
    where id = rid and status <> 'cleaned';
  else
    update reports set
      attempts = attempts || jsonb_build_array(jsonb_build_object('by', auth.uid(), 'at', now_ms(), 'photo', photo_url, 'verification', verification)),
      timeline = timeline || jsonb_build_array(jsonb_build_object('type', 'rejected', 'at', now_ms(), 'by', auth.uid(),
        'text', 'Cleanup proof from ' || p.name || ' was not accepted by AI check'))
    where id = rid and status <> 'cleaned';
  end if;
  return ok;
end $$;

-- Names from sign-up data are trimmed to 80 characters; organisation details are capped in size.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r text := coalesce(new.raw_user_meta_data ->> 'role', 'citizen');
  o jsonb := new.raw_user_meta_data -> 'org';
begin
  if r not in ('citizen', 'ngo', 'govt', 'group') then r := 'citizen'; end if;
  if o is not null and (jsonb_typeof(o) <> 'object' or pg_column_size(o) > 2000) then o := null; end if;
  insert into profiles (id, name, role, status, org)
  values (
    new.id,
    left(coalesce(nullif(trim(coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name')), ''), 'Citizen'), 80),
    r,
    case when r = 'citizen' then 'active' else 'pending' end,
    case when r = 'citizen' then null else o end
  );
  insert into contacts (id, email) values (new.id, new.email);
  return new;
end $$;
