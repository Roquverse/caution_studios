-- ==============================================================================
-- Caution Studio Migration: Studio Recording Session Usage (Plus = 2 / month)
-- Date: 2026-11-18
-- ==============================================================================

create table if not exists public.studio_recording_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_key text not null,
  usage_month text not null, -- 'YYYY-MM' (UTC)
  plan text,
  created_at timestamptz not null default now(),
  unique (user_id, session_key)
);

create index if not exists idx_studio_recording_sessions_user_month
  on public.studio_recording_sessions (user_id, usage_month);

alter table public.studio_recording_sessions enable row level security;

-- Users may read their own usage; inserts happen server-side via service role.
drop policy if exists "Users can view their own studio recording sessions" on public.studio_recording_sessions;
create policy "Users can view their own studio recording sessions"
  on public.studio_recording_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Admins have full access to studio recording sessions" on public.studio_recording_sessions;
create policy "Admins have full access to studio recording sessions"
  on public.studio_recording_sessions for all
  using (
    exists (
      select 1 from public.admin_users
      where admin_users.user_id = auth.uid() and admin_users.is_active = true
    )
  );

