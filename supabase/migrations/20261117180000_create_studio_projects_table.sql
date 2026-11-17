-- ==============================================================================
-- Caution Studio Migration: Studio Projects & Multi-Track Session Cloud Persistence
-- Date: 2026-11-17
-- ==============================================================================

create table if not exists public.studio_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null default 'Untitled Session',
  beat_id uuid references public.beats(id) on delete set null,
  beat_data jsonb,
  vocal_tracks jsonb default '[]'::jsonb,
  master_url text,
  bpm integer default 92,
  musical_key text,
  time_signature text default '4/4',
  effects jsonb default '{}'::jsonb,
  lyrics text default '',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_studio_projects_user_id on public.studio_projects (user_id, updated_at desc);

-- RLS
alter table public.studio_projects enable row level security;

drop policy if exists "Users can manage their own studio projects" on public.studio_projects;
create policy "Users can manage their own studio projects"
  on public.studio_projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins have full access to studio projects" on public.studio_projects;
create policy "Admins have full access to studio projects"
  on public.studio_projects for all
  using (
    exists (
      select 1 from public.admin_users
      where admin_users.user_id = auth.uid() and admin_users.is_active = true
    )
  );
