-- Caution Studio Supabase Initial Migration
-- Spec Section 6

create type app_role as enum ('artist', 'producer');
create type beat_status as enum ('draft', 'processing', 'live', 'sold', 'removed');
create type license_type as enum ('basic', 'premium', 'exclusive');
create type order_status as enum ('pending', 'paid', 'failed', 'refunded');
create type plan_tier as enum ('free', 'plus');

-- 1. Profiles Table
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  handle text unique not null,
  display_name text not null,
  avatar_url text,
  bio text,
  roles app_role[] not null default '{artist}',
  plan plan_tier not null default 'free',
  stripe_customer_id text,
  stripe_account_id text,            -- producers (Connect)
  stripe_payouts_enabled boolean not null default false,
  basic_leases_used_this_period int not null default 0,
  period_resets_at timestamptz,
  created_at timestamptz not null default now()
);

-- 2. Beats Table
create table beats (
  id uuid primary key default gen_random_uuid(),
  producer_id uuid not null references profiles(id) on delete cascade,
  slug text unique not null,
  title text not null,
  description text,
  genre text not null,
  moods text[] not null default '{}',
  tags text[] not null default '{}',
  bpm int,
  musical_key text,
  cover_url text,
  status beat_status not null default 'draft',
  -- R2 object keys (never public URLs)
  master_wav_key text,
  stems_zip_key text,
  preview_tagged_key text,           -- 128kbps MP3 with producer tag
  preview_clean_key text,            -- 128kbps MP3 without tag (Plus)
  waveform_peaks jsonb,
  duration_seconds int,
  play_count int not null default 0,
  like_count int not null default 0,
  sold_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index beats_status_published_idx on beats (status, published_at desc);
create index beats_producer_idx on beats (producer_id);
create index beats_slug_idx on beats (slug);

-- 3. Beat Licenses (per-beat pricing & tier availability)
create table beat_licenses (
  beat_id uuid references beats(id) on delete cascade,
  type license_type not null,
  price_cents int not null check (price_cents > 0),
  enabled boolean not null default true,
  primary key (beat_id, type)
);

-- 4. Orders Table
create table orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references profiles(id),
  status order_status not null default 'pending',
  subtotal_cents int not null,
  credit_cents int not null default 0,       -- Plus plan lease credit
  tax_cents int not null default 0,
  total_cents int not null,
  stripe_payment_intent_id text unique,
  paystack_reference text unique,
  created_at timestamptz not null default now()
);

-- 5. Order Items Table
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  beat_id uuid not null references beats(id),
  producer_id uuid not null references profiles(id),
  license license_type not null,
  price_cents int not null,
  platform_fee_cents int not null,           -- 20%
  producer_amount_cents int not null         -- 80%
);

-- 6. Licenses Table (Issued post-payment)
create table licenses (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid unique not null references order_items(id),
  buyer_id uuid not null references profiles(id),
  beat_id uuid not null references beats(id),
  type license_type not null,
  stream_cap int,                    -- 100000 for basic, null = unlimited
  video_cap int,                     -- 1 for basic
  agreement_pdf_key text not null,
  issued_at timestamptz not null default now()
);

create index licenses_buyer_idx on licenses (buyer_id);
create index licenses_beat_idx on licenses (beat_id);

-- 7. Social Tables (Likes, Follows)
create table likes (
  user_id uuid references profiles(id) on delete cascade,
  beat_id uuid references beats(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, beat_id)
);

create table follows (
  follower_id uuid references profiles(id) on delete cascade,
  producer_id uuid references profiles(id) on delete cascade,
  primary key (follower_id, producer_id)
);

-- 8. Audio Jobs Queue (Worker processing)
create table audio_jobs (
  id uuid primary key default gen_random_uuid(),
  beat_id uuid not null references beats(id) on delete cascade,
  state text not null default 'queued',      -- queued | running | done | failed
  error text,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

-- 9. Producer Watermark Tags
create table producer_tags (
  producer_id uuid primary key references profiles(id) on delete cascade,
  tag_audio_key text not null
);

-- 10. Atomic Exclusive Lock Function (Spec Section 7.4)
create or replace function acquire_exclusive_beat(p_beat_id uuid)
returns boolean as $$
declare
  v_updated_id uuid;
begin
  update beats
  set status = 'sold', sold_at = now()
  where id = p_beat_id and status = 'live'
  returning id into v_updated_id;

  return v_updated_id is not null;
end;
$$ language plpgsql security definer;

-- 11. Profile Auto-Creation Trigger on Auth Sign-Up
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
    -- Log warning but NEVER abort the signup transaction
    raise warning 'handle_new_user encountered error: %', SQLERRM;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 12. Row Level Security Policies
alter table profiles enable row level security;
alter table beats enable row level security;
alter table beat_licenses enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table licenses enable row level security;
alter table likes enable row level security;
alter table follows enable row level security;
alter table audio_jobs enable row level security;

-- Profiles: Anyone can view public profiles; user edits their own
create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Beats: Anyone reads live or sold beats; producers read and edit their own
create policy "Public reads live and sold beats"
  on beats for select using (status in ('live', 'sold') or auth.uid() = producer_id);

create policy "Producers can insert beats"
  on beats for insert with check (auth.uid() = producer_id);

create policy "Producers can update own beats"
  on beats for update using (auth.uid() = producer_id);

-- Beat Licenses: Readable by everyone
create policy "Beat licenses are viewable by everyone"
  on beat_licenses for select using (true);

create policy "Producers manage their beat licenses"
  on beat_licenses for all using (
    exists (select 1 from beats where beats.id = beat_licenses.beat_id and beats.producer_id = auth.uid())
  );

-- Orders: Buyer can read own orders
create policy "Buyers view own orders"
  on orders for select using (auth.uid() = buyer_id);

-- Order Items: Buyer views own, producer views items for their beats
create policy "Order items viewable by buyer or producer"
  on order_items for select using (
    auth.uid() = producer_id or
    exists (select 1 from orders where orders.id = order_items.order_id and orders.buyer_id = auth.uid())
  );

-- Licenses: Buyer views own licenses, producer views for their beats
create policy "Licenses viewable by buyer or producer"
  on licenses for select using (
    auth.uid() = buyer_id or
    exists (select 1 from beats where beats.id = licenses.beat_id and beats.producer_id = auth.uid())
  );

-- Likes & Follows: Users manage own
create policy "Likes viewable by everyone"
  on likes for select using (true);

create policy "Users manage own likes"
  on likes for all using (auth.uid() = user_id);

create policy "Follows viewable by everyone"
  on follows for select using (true);

create policy "Users manage own follows"
  on follows for all using (auth.uid() = follower_id);
