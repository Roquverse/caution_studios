-- ==============================================================================
-- Caution Studio Migration: Soundstage Artist Scouting & Free Beat Submissions
-- Date: 2026-10-23
-- ==============================================================================

create table if not exists public.soundstage_submissions (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references public.profiles(id) on delete set null,
  beat_id uuid references public.beats(id) on delete set null,
  artist_name text not null,
  contact_phone text,
  social_handle text,
  beat_title text,
  audio_url text,
  notes text,
  status text not null default 'pending_review', -- 'pending_review', 'shortlisted', 'sponsored', 'rejected'
  created_at timestamptz not null default now()
);

create index if not exists idx_soundstage_submissions_status on public.soundstage_submissions (status, created_at desc);

-- RLS
alter table public.soundstage_submissions enable row level security;

drop policy if exists "Anyone authenticated or guest can insert soundstage submissions" on public.soundstage_submissions;
create policy "Anyone authenticated or guest can insert soundstage submissions"
  on public.soundstage_submissions for insert
  with check (true);

drop policy if exists "Artists can view their own submissions" on public.soundstage_submissions;
create policy "Artists can view their own submissions"
  on public.soundstage_submissions for select
  using (auth.uid() = artist_id);

drop policy if exists "Admins have full access to soundstage submissions" on public.soundstage_submissions;
create policy "Admins have full access to soundstage submissions"
  on public.soundstage_submissions for all
  using (
    exists (
      select 1 from public.admin_users
      where admin_users.user_id = auth.uid() and admin_users.is_active = true
    )
  );
