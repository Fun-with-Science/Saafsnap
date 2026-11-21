-- Creates (or resets) a ready-to-use admin login, so you don't need to sign up first.
-- 1. Change the email and password on the two lines marked below.
-- 2. Paste into Supabase -> SQL Editor -> Run. Safe to run again: it just resets the password.
-- Never commit a copy with a real password in it.

do $$
declare
  em  text := 'admin@saafsnap.app';   -- <- admin email
  pw  text := 'CHANGE-ME';            -- <- admin password (12+ characters)
  uid uuid;
begin
  if pw = 'CHANGE-ME' or char_length(pw) < 12 then
    raise exception 'Set a password of at least 12 characters first';
  end if;

  select id into uid from auth.users where email = em;
  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em,
      extensions.crypt(pw, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{"name":"SaafSnap Admin"}', now(), now(), '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true), 'email', now(), now(), now());
  else
    update auth.users set encrypted_password = extensions.crypt(pw, extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
    where id = uid;
  end if;

  update public.profiles set role = 'admin', status = 'active' where id = uid;
end $$;

select p.name, c.email, p.role, p.status
from public.profiles p join public.contacts c on c.id = p.id
where p.role = 'admin';
