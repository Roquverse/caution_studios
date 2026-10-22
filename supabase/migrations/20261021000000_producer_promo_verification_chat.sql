-- ==============================================================================
-- Caution Studio Migration: Producer 3-Month Promo, Streaming Verification & Chat
-- ==============================================================================

-- 1. Extend profiles with verification & promo subscription fields
alter table public.profiles
  add column if not exists is_verified boolean not null default false,
  add column if not exists verification_reason text,
  add column if not exists streaming_earnings_cents int not null default 0,
  add column if not exists streaming_streams_count int not null default 0,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists promo_applied text,
  add column if not exists primary_role text not null default 'artist';

-- 2. Create Chats table for Verified Producer - Artist Collaboration
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  is_encrypted boolean not null default true,
  has_contact_info boolean not null default false,
  contact_audit_note text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_chats_participants on public.chats (sender_id, recipient_id, created_at desc);

-- 3. Row Level Security for Chats
alter table public.chats enable row level security;

create policy "Users can view chats they sent or received"
  on public.chats for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Users can insert chats where they are sender"
  on public.chats for insert
  with check (auth.uid() = sender_id);

-- 4. Promoted Songs for Ads & Rewarded Downloads
create table if not exists public.promoted_songs (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references public.profiles(id) on delete set null,
  title text not null,
  artist_name text not null,
  cover_url text,
  audio_url text,
  duration_seconds int not null default 180,
  snippet_seconds int not null default 15,
  spotify_url text,
  apple_music_url text,
  audiomack_url text,
  youtube_url text,
  impressions_count int not null default 0,
  clicks_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.promoted_songs enable row level security;

create policy "Promoted songs are viewable by everyone"
  on public.promoted_songs for select
  using (is_active = true);

-- 5. Updated handle_new_user trigger to grant 3-month free promo to producers
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
  v_primary_role text;
  v_plan public.plan_tier;
  v_trial_ends timestamptz;
  v_promo text;
begin
  -- Safe handle extraction
  v_handle := coalesce(
    nullif(trim(new.raw_user_meta_data->>'handle'), ''),
    split_part(new.email, '@', 1) || '_' || substr(replace(new.id::text, '-', ''), 1, 4)
  );

  -- Safe display name extraction
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(new.email, '@', 1)
  );

  -- Check if user selected producer
  v_primary_role := coalesce(new.raw_user_meta_data->>'primary_role', 'artist');
  if (new.raw_user_meta_data->>'roles') like '%producer%' or v_primary_role = 'producer' then
    v_roles := array['producer']::public.app_role[];
    v_primary_role := 'producer';
    -- 3 Months Free Promo for Producers
    v_plan := 'plus'::public.plan_tier;
    v_trial_ends := now() + interval '3 months';
    v_promo := 'producer_3mo_free_launch';
  else
    v_roles := array['artist']::public.app_role[];
    v_primary_role := 'artist';
    v_plan := 'free'::public.plan_tier;
    v_trial_ends := null;
    v_promo := null;
  end if;

  insert into public.profiles (
    id,
    handle,
    display_name,
    avatar_url,
    roles,
    primary_role,
    plan,
    trial_ends_at,
    promo_applied,
    is_verified,
    streaming_earnings_cents
  )
  values (
    new.id,
    lower(v_handle),
    v_name,
    new.raw_user_meta_data->>'avatar_url',
    v_roles,
    v_primary_role,
    v_plan,
    v_trial_ends,
    v_promo,
    false, -- Verified only once streaming payout threshold is met!
    0
  )
  on conflict (id) do update
  set
    display_name = coalesce(excluded.display_name, profiles.display_name),
    handle = coalesce(excluded.handle, profiles.handle),
    primary_role = coalesce(excluded.primary_role, profiles.primary_role);

  return new;
exception
  when others then
    raise warning 'handle_new_user encountered error: %', SQLERRM;
    return new;
end;
$$;
