-- ==============================================================================
-- Migration: Dynamic Ad Placement Pricing & Admin Control
-- ==============================================================================

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Seed default ad placement prices
insert into public.platform_settings (key, value)
values (
  'ad_pricing',
  jsonb_build_object(
    'stream_ad_price_ngn', 15000,
    'download_ad_price_ngn', 15000,
    'both_placements_price_ngn', 25000,
    'stream_ad_plays', 5000,
    'download_ad_plays', 5000,
    'both_placements_plays', 12000
  )
)
on conflict (key) do nothing;

alter table public.platform_settings enable row level security;

-- Public read access
drop policy if exists "Anyone can read platform settings" on public.platform_settings;
create policy "Anyone can read platform settings"
  on public.platform_settings for select
  using (true);

-- Admin update access
drop policy if exists "Admins can update platform settings" on public.platform_settings;
create policy "Admins can update platform settings"
  on public.platform_settings for all
  using (coalesce(public.is_admin(auth.uid()), false) = true);

