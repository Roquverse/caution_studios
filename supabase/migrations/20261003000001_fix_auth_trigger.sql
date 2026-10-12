-- ==============================================================================
-- FIX: Supabase Auth "Database error saving new user" (HTTP 500)
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yvsoqighrijqqnojelgp/sql/new
-- ==============================================================================

-- 1. Ensure RLS allows insert on public.profiles
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- 2. Drop and recreate handle_new_user with search_path and exception fallback
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_handle text;
  v_name text;
  v_roles public.app_role[];
begin
  -- Safe handle extraction, fallback to unique email prefix
  v_handle := coalesce(
    nullif(trim(new.raw_user_meta_data->>'handle'), ''),
    split_part(new.email, '@', 1) || '_' || substr(replace(new.id::text, '-', ''), 1, 4)
  );

  -- Safe display name extraction
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(new.email, '@', 1)
  );

  -- Determine roles
  v_roles := array['artist']::public.app_role[];
  if (new.raw_user_meta_data->>'roles') like '%producer%' then
    v_roles := array['artist', 'producer']::public.app_role[];
  end if;

  insert into public.profiles (
    id,
    handle,
    display_name,
    avatar_url,
    roles,
    plan
  )
  values (
    new.id,
    lower(v_handle),
    v_name,
    new.raw_user_meta_data->>'avatar_url',
    v_roles,
    'free'::public.plan_tier
  )
  on conflict (id) do update
  set
    display_name = coalesce(excluded.display_name, profiles.display_name),
    handle = coalesce(excluded.handle, profiles.handle);

  return new;
exception
  when others then
    -- Log warning in Postgres logs, but NEVER abort auth.users signup!
    raise warning 'handle_new_user encountered error: %', SQLERRM;
    return new;
end;
$$;

-- 3. Re-bind the trigger cleanly
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
