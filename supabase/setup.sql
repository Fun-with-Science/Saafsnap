-- SaafSnap database setup. Paste this whole file into Supabase → SQL Editor → Run.
-- Safe to run again: it skips or updates things that already exist.

-- ───────────── Tables ─────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  role text not null default 'citizen' check (role in ('citizen', 'ngo', 'govt', 'group', 'admin')),
  status text not null default 'active' check (status in ('active', 'pending', 'rejected')),
  org jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists avatar text;

-- Emails live apart from profiles so only the owner and admins can read them.
create table if not exists public.contacts (
  id uuid primary key references public.profiles on delete cascade,
  email text not null
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  photo text not null,
  lat double precision not null,
  lng double precision not null,
  landmark text not null default '',
  ward int not null,
  department text not null,
  ai jsonb not null,
  exif jsonb,
  seen_by uuid[] not null default '{}',
  seen_extra int not null default 0,
  likes uuid[] not null default '{}',
  status text not null default 'assigned' check (status in ('assigned', 'in_progress', 'cleaned')),
  timeline jsonb not null default '[]',
  cleanup jsonb,
  attempts jsonb not null default '[]'
);

-- Older databases: add the likes column if it is missing.
alter table public.reports add column if not exists likes uuid[] not null default '{}';

-- Size limits on what people type.
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
do $$ begin
  alter table public.profiles add constraint profiles_avatar check (avatar is null or avatar ~ ('^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/photos/' || id::text || '/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$'));
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

-- ───────────── Helpers ─────────────
create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and status = 'active');
$$;

create or replace function public.now_ms() returns bigint language sql stable as $$
  select floor(extract(epoch from now()) * 1000)::bigint;
$$;

-- A photo link must point at the uploader's own folder in this project's storage.
create or replace function public.is_own_photo(url text) returns boolean
language sql stable set search_path = public as $$
  select url ~ ('^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/photos/' || auth.uid()::text || '/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$');
$$;

-- New sign-ups get a profile. Role comes from sign-up data but can never be admin,
-- and every organisation starts as pending until an admin approves it.
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────── Table access (new projects don't grant this automatically) ─────────────
grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.contacts, public.reports to authenticated;
grant update (status) on public.profiles to authenticated;
grant insert, delete on public.reports to authenticated;
grant execute on function public.is_admin(), public.now_ms(), public.is_own_photo(text) to authenticated;

-- ───────────── Row level security ─────────────
alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.reports enable row level security;

drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select to authenticated using (true);
drop policy if exists "admins manage profiles" on public.profiles;
create policy "admins manage profiles" on public.profiles for update to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "own or admin contact" on public.contacts;
create policy "own or admin contact" on public.contacts for select to authenticated using (id = auth.uid() or is_admin());

drop policy if exists "reports readable" on public.reports;
create policy "reports readable" on public.reports for select to authenticated using (true);
drop policy if exists "create own report" on public.reports;
create policy "create own report" on public.reports for insert to authenticated with check (
  is_admin() or (
    created_by = auth.uid() and status = 'assigned' and cleanup is null
    and seen_extra = 0 and cardinality(seen_by) = 0 and cardinality(likes) = 0
    and attempts = '[]'::jsonb and is_own_photo(photo)
  )
);
drop policy if exists "admins delete reports" on public.reports;
create policy "admins delete reports" on public.reports for delete to authenticated using (is_admin());
-- No update policy: reports change only through the functions below.

-- ───────────── Actions (each one only touches what it should) ─────────────
create or replace function public.back_report(rid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare nm text;
begin
  select name into nm from profiles where id = auth.uid();
  if nm is null then raise exception 'Please log in first'; end if;
  update reports set
    seen_by = array_append(seen_by, auth.uid()),
    timeline = timeline || jsonb_build_array(jsonb_build_object('type', 'seen', 'at', now_ms(), 'by', auth.uid(), 'text', nm || ' saw this too'))
  where id = rid and status <> 'cleaned' and created_by <> auth.uid() and not (auth.uid() = any (seen_by));
end $$;

-- Likes are only for cleaned spots: one per person, tapping again removes it.
create or replace function public.toggle_like(rid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Please log in first'; end if;
  update reports set likes = case when auth.uid() = any (likes) then array_remove(likes, auth.uid()) else array_append(likes, auth.uid()) end
  where id = rid and status = 'cleaned';
end $$;

create or replace function public.start_work(rid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare p profiles;
begin
  select * into p from profiles where id = auth.uid();
  if p is null or p.role <> 'govt' or p.status <> 'active' then raise exception 'Only verified government officers can do this'; end if;
  update reports set
    status = 'in_progress',
    timeline = timeline || jsonb_build_array(jsonb_build_object('type', 'progress', 'at', now_ms(), 'by', auth.uid(),
      'text', coalesce(p.org ->> 'name', p.name) || ' acknowledged and started work'))
  where id = rid and status = 'assigned' and department = p.org ->> 'department';
end $$;

-- Cleanup proof must be the cleaner's own upload.
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

-- NGOs, groups and government accounts can set a logo uploaded to their own photo folder.
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

revoke execute on function public.back_report(uuid), public.toggle_like(uuid), public.start_work(uuid), public.submit_cleanup(uuid, text, jsonb) from public, anon;
grant execute on function public.back_report(uuid), public.toggle_like(uuid), public.start_work(uuid), public.submit_cleanup(uuid, text, jsonb) to authenticated;

-- ───────────── Photo storage: images only, max 5 MB ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "upload own photos" on storage.objects;
create policy "upload own photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ───────────── Live updates ─────────────
do $$ begin
  alter publication supabase_realtime add table public.reports, public.profiles;
exception when duplicate_object then null; end $$;

-- ───────────── Your admin account ─────────────
-- Sign up in the app first (Google or email), then run supabase/make-admin.sql with your email.
