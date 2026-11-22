-- DARNA London: initial database schema for Supabase
-- Run in Supabase SQL Editor. Never expose the service_role key in the browser.

create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'staff', 'customer');
create type public.request_status as enum ('new', 'in_progress', 'waiting_customer', 'completed', 'cancelled');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text not null,
  request_type text not null,
  details text not null,
  preferred_date date,
  status public.request_status not null default 'new',
  assigned_to uuid references public.profiles(id),
  customer_id uuid references public.profiles(id),
  source text not null default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  property_type text not null default 'rental',
  location text,
  price numeric(12,2),
  currency text not null default 'GBP',
  status text not null default 'available',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.hotel_inquiries (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  hotel_name text,
  check_in date,
  check_out date,
  guests integer not null default 1 check (guests > 0),
  notes text,
  status public.request_status not null default 'new',
  assigned_to uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  related_request uuid references public.service_requests(id) on delete set null,
  related_property uuid references public.properties(id) on delete set null,
  staff_id uuid references public.profiles(id),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'GBP',
  commission_status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now()
);

create or replace function public.is_staff_or_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'staff')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.service_requests enable row level security;
alter table public.properties enable row level security;
alter table public.hotel_inquiries enable row level security;
alter table public.commissions enable row level security;

-- Profiles: users can read/update their own profile; admin can manage all.
create policy "profile read self or admin" on public.profiles for select
using (id = auth.uid() or public.is_admin());
create policy "profile update self" on public.profiles for update
using (id = auth.uid()) with check (id = auth.uid());
create policy "admin manages profiles" on public.profiles for all
using (public.is_admin()) with check (public.is_admin());

-- Website visitors can submit requests. Only staff/admin can read and update them.
create policy "public submit service requests" on public.service_requests for insert
with check (status = 'new' and assigned_to is null);
create policy "staff read requests" on public.service_requests for select
using (public.is_staff_or_admin() or customer_id = auth.uid());
create policy "staff update requests" on public.service_requests for update
using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

-- Public can see available property listings; staff manage inventory.
create policy "public read available properties" on public.properties for select
using (status = 'available' or public.is_staff_or_admin());
create policy "staff manage properties" on public.properties for all
using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

-- Hotel inquiries are submitted publicly; staff handle them.
create policy "public submit hotel inquiries" on public.hotel_inquiries for insert
with check (status = 'new' and assigned_to is null);
create policy "staff manage hotel inquiries" on public.hotel_inquiries for all
using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

-- Commission data is restricted to staff; only admin can alter commission records.
create policy "staff read commissions" on public.commissions for select
using (public.is_staff_or_admin());
create policy "admin manages commissions" on public.commissions for all
using (public.is_admin()) with check (public.is_admin());

-- Create a profile row automatically when a user is registered through Supabase Auth.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    'customer'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- IMPORTANT: promote the first trusted administrator manually from SQL Editor:
-- update public.profiles set role = 'admin' where id = 'AUTH_USER_UUID';
-- Create staff accounts via Supabase Auth, then set role='staff' for their profile.
