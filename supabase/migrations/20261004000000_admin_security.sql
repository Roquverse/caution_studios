-- Caution Studio Admin Security & Authorization Migration
-- Database-backed admin access management

-- 1. Create admin_users table for auditing & role assignment
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  email text unique not null,
  role text not null default 'superadmin',
  is_active boolean not null default true,
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now()
);

-- 2. Enable Row Level Security (RLS)
alter table public.admin_users enable row level security;

-- 3. RLS Policies: Only service role or authorized admin users can view admin records
create policy "Admins can view admin_users table"
  on public.admin_users for select
  using (
    auth.uid() = user_id
    or (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
    or (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'superadmin')
  );

-- 4. Helper function to check if an arbitrary user UUID is an admin
create or replace function public.is_admin(check_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_is_admin boolean;
begin
  -- Check in admin_users table
  select exists(
    select 1 from public.admin_users
    where user_id = check_user_id and is_active = true
  ) into v_is_admin;

  if v_is_admin then
    return true;
  end if;

  -- Fallback check in auth.users app_metadata
  select (raw_app_meta_data->>'is_admin')::boolean = true
      or (raw_app_meta_data->>'role') in ('admin', 'superadmin')
  from auth.users
  where id = check_user_id
  into v_is_admin;

  return coalesce(v_is_admin, false);
end;
$$;

-- 5. Seed default admin records from auth.users if they exist
insert into public.admin_users (user_id, email, role, is_active)
select id, email, 'superadmin', true
from auth.users
where email in ('admin@caution.studio', 'damicoledj@gmail.com')
on conflict (email) do update
set
  user_id = excluded.user_id,
  is_active = true;
