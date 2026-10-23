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
  add column if not exists notify_payouts boolean not null default true,
  add column if not exists streaming_earnings_cents bigint not null default 0,
  add column if not exists streaming_streams_count bigint not null default 0,
  add column if not exists promo_until timestamptz default (now() + interval '90 days');

-- 2. Ensure licenses table exists and has producer linkage & license numbers
create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  beat_id uuid references public.beats(id) on delete cascade,
  buyer_id uuid references public.profiles(id) on delete cascade,
  license_type text not null default 'basic',
  pdf_url text,
  issued_at timestamptz not null default now()
);

alter table public.licenses
  add column if not exists license_number text,
  add column if not exists producer_id uuid references public.profiles(id) on delete set null,
  add column if not exists price_cents int not null default 0,
  add column if not exists producer_amount_cents int not null default 0,
  add column if not exists status text not null default 'active';

create index if not exists idx_licenses_producer on public.licenses (producer_id, issued_at desc);

-- 3. Ensure chats table exists for Artist-Producer Collaboration
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  beat_id uuid references public.beats(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  content text not null,
  is_encrypted boolean not null default true,
  has_contact_info boolean not null default false,
  contact_audit_note text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.chats
  add column if not exists beat_id uuid references public.beats(id) on delete set null,
  add column if not exists order_id uuid references public.orders(id) on delete set null,
  add column if not exists is_encrypted boolean not null default true,
  add column if not exists has_contact_info boolean not null default false,
  add column if not exists contact_audit_note text,
  add column if not exists read_at timestamptz;

create index if not exists idx_chats_participants on public.chats (sender_id, recipient_id, created_at desc);

alter table public.chats enable row level security;

drop policy if exists "Users can view chats they sent or received" on public.chats;
create policy "Users can view chats they sent or received"
  on public.chats for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "Users can insert chats where they are sender" on public.chats;
create policy "Users can insert chats where they are sender"
  on public.chats for insert
  with check (auth.uid() = sender_id);

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

-- 5. Ensure payouts table exists and allows creator requests
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  producer_id uuid not null references public.profiles(id) on delete cascade,
  amount_ngn numeric not null,
  fee_ngn numeric not null default 100,
  net_ngn numeric not null,
  bank_name text not null,
  bank_code text not null,
  account_number text not null,
  account_name text not null,
  paystack_transfer_reference text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_payouts_producer on public.payouts (producer_id, created_at desc);

alter table public.payouts enable row level security;

drop policy if exists "Producers can view their own payouts" on public.payouts;
create policy "Producers can view their own payouts"
  on public.payouts for select
  using (auth.uid() = producer_id);

drop policy if exists "Producers can create payout requests" on public.payouts;
create policy "Producers can create payout requests"
  on public.payouts for insert
  with check (auth.uid() = producer_id);

-- 6. Row Level Security for licenses table
alter table public.licenses enable row level security;

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

-- 7. Row Level Security for order_items table (allowing producers to view their sales)
alter table public.order_items enable row level security;

drop policy if exists "Producers can view order items for their beats" on public.order_items;
create policy "Producers can view order items for their beats"
  on public.order_items for select
  using (auth.uid() = producer_id);

-- 8. Ensure beats table allows producers to insert and update their own beats
alter table public.beats enable row level security;

drop policy if exists "Beats viewable by everyone" on public.beats;
create policy "Beats viewable by everyone"
  on public.beats for select
  using (true);

drop policy if exists "Producers can insert their own beats" on public.beats;
create policy "Producers can insert their own beats"
  on public.beats for insert
  with check (auth.uid() = producer_id);

drop policy if exists "Producers can update their own beats" on public.beats;
create policy "Producers can update their own beats"
  on public.beats for update
  using (auth.uid() = producer_id);

-- 9. Ensure beat_licenses table allows producers to insert and update licenses
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
