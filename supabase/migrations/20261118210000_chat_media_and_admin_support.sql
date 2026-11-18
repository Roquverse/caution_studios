-- ==============================================================================
-- Migration: Add Media Support (Images/Audio in R2) & Admin Support to Chats
-- ==============================================================================

-- 1. Make content column nullable in public.chats to allow media-only messages
alter table public.chats alter column content drop not null;

-- 2. Add media columns to public.chats
alter table public.chats
  add column if not exists media_url text,
  add column if not exists media_key text,
  add column if not exists media_type text,      -- 'image', 'audio', 'file'
  add column if not exists media_name text,      -- Original filename
  add column if not exists media_size bigint,    -- File size in bytes
  add column if not exists media_duration numeric; -- Audio duration in seconds

-- 3. Create index for media queries and timestamp sorting
create index if not exists idx_chats_media on public.chats (media_type) where media_type is not null;
create index if not exists idx_chats_created_at on public.chats (created_at desc);

-- 4. Update Row Level Security (RLS) for Admin-Producer Chat
alter table public.chats enable row level security;

-- Drop and recreate comprehensive select policy
drop policy if exists "Users can view chats they sent or received" on public.chats;
create policy "Users and admins can view participant chats"
  on public.chats for select
  using (
    auth.uid() = sender_id 
    or auth.uid() = recipient_id
    or coalesce(public.is_admin(auth.uid()), false) = true
  );

-- Drop and recreate insert policy
drop policy if exists "Users can insert chats where they are sender" on public.chats;
create policy "Users and admins can send chats"
  on public.chats for insert
  with check (
    auth.uid() = sender_id
    or coalesce(public.is_admin(auth.uid()), false) = true
  );

-- 5. Helper function to find or assign the official Caution Admin profile ID
create or replace function public.get_or_create_admin_profile()
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_admin_id uuid;
begin
  -- 1. Check if an admin exists in admin_users
  select user_id into v_admin_id 
  from public.admin_users 
  where is_active = true and user_id is not null 
  limit 1;

  if v_admin_id is not null then
    return v_admin_id;
  end if;

  -- 2. Check if a profile with role 'admin' exists
  select id into v_admin_id
  from public.profiles
  where (role = 'admin' or 'admin' = any(coalesce(roles, array[]::text[])))
  limit 1;

  if v_admin_id is not null then
    return v_admin_id;
  end if;

  -- 3. Check for specific known admin email
  select id into v_admin_id
  from auth.users
  where email in ('admin@cautionstudioz.com', 'admin@caution.studio', 'damicoledj@gmail.com')
  limit 1;

  if v_admin_id is not null then
    return v_admin_id;
  end if;

  -- 4. Fallback: first profile in profiles table
  select id into v_admin_id
  from public.profiles
  order by created_at asc
  limit 1;

  return v_admin_id;
end;
$$;

