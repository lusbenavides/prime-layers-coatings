-- Prime Layer Business Manager — CRM schema
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- ─── Extensions ───────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Enums ────────────────────────────────────────────────────
do $$ begin
  create type user_role as enum ('admin', 'employee');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lead_status as enum ('new', 'contacted', 'quoted', 'won', 'lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estimate_status as enum ('draft', 'sent', 'approved', 'rejected', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type project_status as enum ('scheduled', 'in_progress', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'partial', 'paid', 'refunded');
exception when duplicate_object then null; end $$;

-- ─── Profiles (staff linked to auth.users) ────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role user_role not null default 'employee',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Clients ──────────────────────────────────────────────────
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text not null,
  address text,
  city text default 'Las Vegas',
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_phone_idx on public.clients (phone);
create index if not exists clients_email_idx on public.clients (email);

-- ─── Leads (enhanced — backward compatible with existing inserts) ─
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  email text,
  phone text not null,
  project_type text,
  description text,
  source text default 'form',
  status lead_status not null default 'new',
  assigned_to uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migrate existing leads table if columns missing
alter table public.leads add column if not exists client_id uuid references public.clients(id) on delete set null;
alter table public.leads add column if not exists status lead_status not null default 'new';
alter table public.leads add column if not exists assigned_to uuid references public.profiles(id);
alter table public.leads add column if not exists updated_at timestamptz not null default now();

create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_created_at_idx on public.leads (created_at desc);

-- ─── Estimates ─────────────────────────────────────────────────
create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  title text not null default 'Painting Estimate',
  status estimate_status not null default 'draft',
  subtotal numeric(12,2) not null default 0,
  tax_rate numeric(5,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  valid_until date,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Estimate line items ───────────────────────────────────────
create table if not exists public.estimate_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  sort_order int not null default 0
);

-- ─── Projects ──────────────────────────────────────────────────
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  estimate_id uuid references public.estimates(id) on delete set null,
  title text not null,
  status project_status not null default 'scheduled',
  address text,
  start_date date,
  end_date date,
  notes text,
  assigned_to uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_start_date_idx on public.projects (start_date);

-- ─── Payments ──────────────────────────────────────────────────
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  amount numeric(12,2) not null,
  status payment_status not null default 'pending',
  method text,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

-- ─── Project photos ────────────────────────────────────────────
create table if not exists public.project_photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null,
  caption text,
  photo_type text default 'progress',
  created_at timestamptz not null default now()
);

-- ─── updated_at trigger ────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists clients_updated_at on public.clients;
create trigger clients_updated_at before update on public.clients
  for each row execute function public.set_updated_at();

drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

drop trigger if exists estimates_updated_at on public.estimates;
create trigger estimates_updated_at before update on public.estimates
  for each row execute function public.set_updated_at();

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- ─── Auto-create profile on signup ─────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'employee')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Helper: is staff ───────────────────────────────────────────
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid()
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ─── RLS ───────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.leads enable row level security;
alter table public.estimates enable row level security;
alter table public.estimate_items enable row level security;
alter table public.projects enable row level security;
alter table public.payments enable row level security;
alter table public.project_photos enable row level security;

-- Profiles: staff read all, users edit own
drop policy if exists "Staff read profiles" on public.profiles;
create policy "Staff read profiles" on public.profiles for select using (public.is_staff());
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- Clients: staff full access
drop policy if exists "Staff manage clients" on public.clients;
create policy "Staff manage clients" on public.clients for all using (public.is_staff()) with check (public.is_staff());

-- Leads: anon can INSERT (website forms), staff full access
drop policy if exists "Anon insert leads" on public.leads;
create policy "Anon insert leads" on public.leads for insert with check (true);
drop policy if exists "Staff manage leads" on public.leads;
create policy "Staff manage leads" on public.leads for select using (public.is_staff());
drop policy if exists "Staff update leads" on public.leads;
create policy "Staff update leads" on public.leads for update using (public.is_staff());
drop policy if exists "Staff delete leads" on public.leads;
create policy "Staff delete leads" on public.leads for delete using (public.is_admin());

-- Estimates, items, projects, payments, photos: staff only
drop policy if exists "Staff manage estimates" on public.estimates;
create policy "Staff manage estimates" on public.estimates for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Staff manage estimate_items" on public.estimate_items;
create policy "Staff manage estimate_items" on public.estimate_items for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Staff manage projects" on public.projects;
create policy "Staff manage projects" on public.projects for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Staff manage payments" on public.payments;
create policy "Staff manage payments" on public.payments for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Staff manage project_photos" on public.project_photos;
create policy "Staff manage project_photos" on public.project_photos for all using (public.is_staff()) with check (public.is_staff());

-- ─── Dashboard stats view ───────────────────────────────────────
create or replace view public.dashboard_stats as
select
  (select count(*) from public.clients)::int as total_clients,
  (select count(*) from public.leads where status = 'new')::int as pending_leads,
  (select count(*) from public.estimates where status in ('draft','sent'))::int as pending_estimates,
  (select count(*) from public.projects where status in ('scheduled','in_progress'))::int as active_projects,
  (select count(*) from public.projects where status = 'completed')::int as completed_projects,
  (select coalesce(sum(total), 0) from public.estimates where status = 'approved')::numeric as approved_revenue,
  (select coalesce(sum(amount), 0) from public.payments where status = 'paid')::numeric as total_paid;

grant select on public.dashboard_stats to authenticated;
