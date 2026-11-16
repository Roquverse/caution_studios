-- ==============================================================================
-- Caution Studio Migration: Add ad_type to ad_campaigns (Listening vs Download)
-- Date: 2026-11-16
-- ==============================================================================

alter table public.ad_campaigns
  add column if not exists ad_type text not null default 'all'; -- 'listening', 'download', 'all'

create index if not exists idx_ad_campaigns_type on public.ad_campaigns (ad_type, status);

