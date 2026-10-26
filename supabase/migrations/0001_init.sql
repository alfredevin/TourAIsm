-- TourAIsm initial schema. Run in the Supabase SQL editor (or `supabase db push`).
--
-- Accounts live in Supabase Auth (auth.users). The app signs users in with a username,
-- mapped to a synthetic email, so these tables only hold app data.

-- ---------------------------------------------------------------------------
-- profiles: one row per user, created automatically at sign up.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  username       text        not null check (username ~ '^[A-Za-z0-9_.]{3,20}$'),
  name           text        not null check (char_length(name) between 1 and 20),
  character_id   text        not null default 'girl_ana'
                             check (character_id in
                               ('girl_ana', 'girl_bea', 'girl_carla', 'boy_ben', 'boy_carlo', 'boy_dan')),
  show_name_tag  boolean     not null default true,
  theme_mode     text        not null default 'system' check (theme_mode in ('light', 'dark', 'system')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Usernames are unique regardless of casing.
create unique index profiles_username_key on public.profiles (lower(username));

alter table public.profiles enable row level security;

create policy "profiles: read own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Clients may only edit these columns. username/created_at are fixed after sign up,
-- and rows are created by the trigger below, never by the client.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (name, character_id, show_name_tag, theme_mode) on public.profiles to authenticated;

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Creates the profile when someone signs up. The username comes from the sign up metadata.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen text := new.raw_user_meta_data ->> 'username';
begin
  insert into public.profiles (id, username, name)
  values (new.id, chosen, chosen);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only the trigger should run this function, never an API caller.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- recent_places: the last few destinations a user searched, newest first.
-- ---------------------------------------------------------------------------
create table public.recent_places (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid             not null references auth.users (id) on delete cascade default auth.uid(),
  label       text             not null check (char_length(label) between 1 and 300),
  latitude    double precision not null check (latitude between -90 and 90),
  longitude   double precision not null check (longitude between -180 and 180),
  position    smallint         not null check (position between 0 and 4),
  created_at  timestamptz      not null default now(),
  unique (user_id, position)
);

alter table public.recent_places enable row level security;

create policy "recent_places: read own"
  on public.recent_places for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "recent_places: insert own"
  on public.recent_places for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "recent_places: delete own"
  on public.recent_places for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.recent_places from anon;

-- Replaces the caller's recent places in one transaction, so a failed save never leaves
-- a half-written list. `places` is an ordered array of {label, latitude, longitude}.
create function public.replace_recent_places(places jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if jsonb_typeof(places) <> 'array' or jsonb_array_length(places) > 5 then
    raise exception 'places must be an array of at most 5 items';
  end if;

  delete from public.recent_places where user_id = (select auth.uid());

  insert into public.recent_places (user_id, label, latitude, longitude, position)
  select (select auth.uid()), item ->> 'label', (item ->> 'latitude')::double precision,
         (item ->> 'longitude')::double precision, (ord - 1)::smallint
  from jsonb_array_elements(places) with ordinality as t (item, ord);
end;
$$;

revoke execute on function public.replace_recent_places(jsonb) from public, anon;
grant execute on function public.replace_recent_places(jsonb) to authenticated;
