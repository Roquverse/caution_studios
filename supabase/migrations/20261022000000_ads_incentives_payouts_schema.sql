  -- ==============================================================================
  -- Caution Studio Migration: Ads Manager, Download Incentives, Payouts & Schema Sync
  -- Date: 2026-10-22
  -- ==============================================================================

  -- 0. Ensure app_role enum supports admin role
  do $$
  begin
    alter type public.app_role add value if not exists 'admin';
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end $$;

  -- 1. Extend profiles with Paystack Banking and Balances
  alter table public.profiles
    add column if not exists paystack_bank_code text,
    add column if not exists paystack_bank_name text,
    add column if not exists paystack_account_number text,
    add column if not exists paystack_account_name text,
    add column if not exists paystack_recipient_code text,
    add column if not exists available_balance_ngn numeric not null default 0,
    add column if not exists pending_balance_ngn numeric not null default 0;

  -- 2. Extend beats table with Free Streaming & License Policy fields
  alter table public.beats
    add column if not exists is_free_stream_enabled boolean not null default true,
    add column if not exists producer_tag_free boolean not null default true,
    add column if not exists free_commercial_downloads_count int not null default 0;

  -- 3. Create Ad Campaigns Table (Caution Studios Ads Manager)
  create table if not exists public.ad_campaigns (
    id uuid primary key default gen_random_uuid(),
    advertiser_id uuid references public.profiles(id) on delete set null,
    campaign_name text not null,
    artist_name text not null,
    song_title text not null,
    package_name text not null default 'starter', -- 'starter' (₦15k), 'pro' (₦35k), 'studio_blast' (₦75k)
    price_ngn numeric not null default 15000,
    target_plays int not null default 10000,
    delivered_plays int not null default 0,
    clicks_count int not null default 0,
    audio_url text,
    cover_url text,
    spotify_url text,
    apple_music_url text,
    audiomack_url text,
    youtube_url text,
    paystack_reference text,
    status text not null default 'active', -- 'pending_payment', 'active', 'completed', 'paused'
    starts_at timestamptz not null default now(),
    ends_at timestamptz,
    created_at timestamptz not null default now()
  );

  create index if not exists idx_ad_campaigns_status on public.ad_campaigns (status, starts_at, ends_at);

  -- Row Level Security for Ad Campaigns
  alter table public.ad_campaigns enable row level security;

  drop policy if exists "Active ad campaigns are viewable by everyone" on public.ad_campaigns;
  create policy "Active ad campaigns are viewable by everyone"
    on public.ad_campaigns for select
    using (status = 'active');

  drop policy if exists "Advertisers can view their own campaigns" on public.ad_campaigns;
  create policy "Advertisers can view their own campaigns"
    on public.ad_campaigns for select
    using (auth.uid() = advertiser_id);

  drop policy if exists "Advertisers can insert campaigns" on public.ad_campaigns;
  create policy "Advertisers can insert campaigns"
    on public.ad_campaigns for insert
    with check (auth.uid() = advertiser_id);

  drop policy if exists "Admins have full access to ad campaigns" on public.ad_campaigns;
  create policy "Admins have full access to ad campaigns"
    on public.ad_campaigns for all
    using (
      exists (
        select 1 from public.admin_users
        where admin_users.user_id = auth.uid() and admin_users.is_active = true
      )
    );

  -- 4. Create Producer Download Incentives Table (Payment Policy Section 3)
  create table if not exists public.producer_download_incentives (
    id uuid primary key default gen_random_uuid(),
    producer_id uuid not null references public.profiles(id) on delete cascade,
    month_period date not null, -- First day of calendar month e.g. 2026-10-01
    qualifying_downloads int not null default 0,
    rollover_downloads int not null default 0,
    milestones_reached int not null default 0, -- e.g. 2 milestones for 25k downloads
    reward_amount_ngn numeric not null default 0, -- ₦30,000 per 10k downloads
    payout_status text not null default 'pending', -- 'pending', 'verified', 'paid', 'withheld'
    payout_reference text,
    verified_at timestamptz,
    created_at timestamptz not null default now(),
    constraint uq_producer_month unique (producer_id, month_period)
  );

  create index if not exists idx_incentives_producer on public.producer_download_incentives (producer_id, month_period desc);

  alter table public.producer_download_incentives enable row level security;

  drop policy if exists "Producers can view their own download incentives" on public.producer_download_incentives;
  create policy "Producers can view their own download incentives"
    on public.producer_download_incentives for select
    using (auth.uid() = producer_id);

  drop policy if exists "Admins have full access to download incentives" on public.producer_download_incentives;
  create policy "Admins have full access to download incentives"
    on public.producer_download_incentives for all
    using (
      exists (
        select 1 from public.admin_users
        where admin_users.user_id = auth.uid() and admin_users.is_active = true
      )
    );

  -- 5. Create Payouts History Table
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
    status text not null default 'pending', -- 'pending', 'processing', 'completed', 'failed', 'reversed'
    created_at timestamptz not null default now(),
    completed_at timestamptz
  );

  create index if not exists idx_payouts_producer on public.payouts (producer_id, created_at desc);

  alter table public.payouts enable row level security;

  drop policy if exists "Producers can view their own payouts" on public.payouts;
  create policy "Producers can view their own payouts"
    on public.payouts for select
    using (auth.uid() = producer_id);

  drop policy if exists "Admins have full access to payouts" on public.payouts;
  create policy "Admins have full access to payouts"
    on public.payouts for all
    using (
      exists (
        select 1 from public.admin_users
        where admin_users.user_id = auth.uid() and admin_users.is_active = true
      )
    );

  -- 6. Create Admin Operations Audit Log
  create table if not exists public.admin_operations_log (
    id uuid primary key default gen_random_uuid(),
    operator_id uuid not null references public.profiles(id) on delete cascade,
    operation_type text not null, -- 'update_user_plan', 'delete_user', 'manage_download_incentives', 'run_payouts'
    target_user_id uuid references public.profiles(id) on delete set null,
    details jsonb not null,
    created_at timestamptz not null default now()
  );

  create index if not exists idx_admin_ops_log_operator on public.admin_operations_log (operator_id, created_at desc);

  create index if not exists idx_admin_ops_log_created_at on public.admin_operations_log (created_at desc);

  alter table public.admin_operations_log enable row level security;

  drop policy if exists "Admins can view all admin operations" on public.admin_operations_log;
  create policy "Admins can view all admin operations"
    on public.admin_operations_log for all
    using (
      exists (
        select 1 from public.admin_users
        where admin_users.user_id = auth.uid() and admin_users.is_active = true
      )
    );
