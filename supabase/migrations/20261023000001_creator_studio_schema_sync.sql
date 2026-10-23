-- ==============================================================================
-- Caution Studio Migration: Creator Studio Schema Sync & Tables
-- Date: 2026-10-23
-- ==============================================================================

-- 1. Extend profiles table with Creator Studio fields
alter table public.profiles
  add column if not exists daw text,
  add column if not exists location text,
  add column if not exists instagram_handle text,
  add column if not exists youtube_channel text,
  add column if not exists twitter_handle text,
  add column if not exists phone_number text,
  add column if not exists notify_sales boolean not null default true,
  add column if not exists notify_chats boolean not null default true,
  add column if not exists notify_payouts boolean not null default true;

-- 2. Extend licenses table with producer linkage & license numbers
alter table public.licenses
  add column if not exists license_number text,
  add column if not exists producer_id uuid references public.profiles(id) on delete set null,
  add column if not exists price_cents int not null default 0,
  add column if not exists producer_amount_cents int not null default 0,
  add column if not exists status text not null default 'active';

create index if not exists idx_licenses_producer on public.licenses (producer_id, issued_at desc);

-- 3. Extend chats table with project/beat references
alter table public.chats
  add column if not exists beat_id uuid references public.beats(id) on delete set null,
  add column if not exists order_id uuid references public.orders(id) on delete set null;

-- 4. Create Stream Events table for granular play telemetry
create table if not exists public.stream_events (
  id uuid primary key default gen_random_uuid(),
  beat_id uuid not null references public.beats(id) on delete cascade,
  producer_id uuid not null references public.profiles(id) on delete cascade,
  listener_id uuid references public.profiles(id) on delete set null,
  duration_seconds int not null default 0,
  completed boolean not null default false,
  device text,
  created_at timestamptz not null default now()
);

create index if not exists idx_stream_events_beat on public.stream_events (beat_id, created_at desc);
create index if not exists idx_stream_events_producer on public.stream_events (producer_id, created_at desc);

alter table public.stream_events enable row level security;

drop policy if exists "Producers can view their own stream events" on public.stream_events;
create policy "Producers can view their own stream events"
  on public.stream_events for select
  using (auth.uid() = producer_id);

drop policy if exists "Anyone can record stream events" on public.stream_events;
create policy "Anyone can record stream events"
  on public.stream_events for insert
  with check (true);

-- 5. Row Level Security for licenses table (allowing producers to view licenses of beats they produced)
drop policy if exists "Producers can view licenses for their beats" on public.licenses;
create policy "Producers can view licenses for their beats"
  on public.licenses for select
  using (
    auth.uid() = buyer_id or 
    auth.uid() = producer_id or
    exists (
      select 1 from public.beats
      where beats.id = licenses.beat_id and beats.producer_id = auth.uid()
    )
  );

-- 6. Row Level Security for order_items table (allowing producers to view their sales)
alter table public.order_items enable row level security;

drop policy if exists "Producers can view order items for their beats" on public.order_items;
create policy "Producers can view order items for their beats"
  on public.order_items for select
  using (auth.uid() = producer_id);

-- 7. Ensure beats table allows producers to insert and update their own beats
drop policy if exists "Producers can insert their own beats" on public.beats;
create policy "Producers can insert their own beats"
  on public.beats for insert
  with check (auth.uid() = producer_id);

drop policy if exists "Producers can update their own beats" on public.beats;
create policy "Producers can update their own beats"
  on public.beats for update
  using (auth.uid() = producer_id);

-- 8. Ensure beat_licenses table allows producers to insert and update licenses
alter table public.beat_licenses enable row level security;

drop policy if exists "Beat licenses viewable by everyone" on public.beat_licenses;
create policy "Beat licenses viewable by everyone"
  on public.beat_licenses for select
  using (true);

drop policy if exists "Producers can manage licenses for their beats" on public.beat_licenses;
create policy "Producers can manage licenses for their beats"
  on public.beat_licenses for all
  using (
    exists (
      select 1 from public.beats
      where beats.id = beat_licenses.beat_id and beats.producer_id = auth.uid()
    )
  );
