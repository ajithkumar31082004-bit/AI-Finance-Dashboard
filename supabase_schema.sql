-- SUPABASE DATABASE SCHEMA INITIALIZATION
-- Run this script in the Supabase SQL Editor to configure your backend tables.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (linked to auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  paper_balance numeric(15, 2) default 100000.00,
  risk_score numeric(5, 2) default 0.00,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Users can view their own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Users can update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- 2. PORTFOLIO TABLE
create table public.portfolio (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  stock_symbol text not null,
  quantity numeric(12, 4) not null check (quantity >= 0),
  buy_price numeric(12, 2) not null check (buy_price >= 0),
  current_price numeric(12, 2) not null check (current_price >= 0),
  created_at timestamptz default now(),
  unique (user_id, stock_symbol)
);

alter table public.portfolio enable row level security;

create policy "Users can manage their own portfolio" 
  on public.portfolio for all 
  using (auth.uid() = user_id);

-- 3. WATCHLIST TABLE
create table public.watchlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  stock_symbol text not null,
  created_at timestamptz default now(),
  unique (user_id, stock_symbol)
);

alter table public.watchlist enable row level security;

create policy "Users can manage their own watchlist" 
  on public.watchlist for all 
  using (auth.uid() = user_id);

-- 4. ALERTS TABLE
create table public.alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  stock_symbol text not null,
  target_price numeric(12, 2) not null check (target_price >= 0),
  alert_type text not null check (alert_type in ('price', 'breakout', 'volume')),
  is_triggered boolean default false,
  created_at timestamptz default now()
);

alter table public.alerts enable row level security;

create policy "Users can manage their own alerts" 
  on public.alerts for all 
  using (auth.uid() = user_id);

-- 5. PAPER TRADES TABLE
create table public.paper_trades (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  stock_symbol text not null,
  quantity numeric(12, 4) not null check (quantity > 0),
  buy_sell text not null check (buy_sell in ('buy', 'sell')),
  price numeric(12, 2) not null check (price >= 0),
  created_at timestamptz default now()
);

alter table public.paper_trades enable row level security;

create policy "Users can view their own paper trades" 
  on public.paper_trades for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own paper trades" 
  on public.paper_trades for insert 
  with check (auth.uid() = user_id);

-- 6. GOALS TABLE
create table public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  target_amount numeric(15, 2) not null check (target_amount > 0),
  current_amount numeric(15, 2) default 0.00 check (current_amount >= 0),
  target_date timestamptz not null,
  created_at timestamptz default now()
);

alter table public.goals enable row level security;

create policy "Users can manage their own goals" 
  on public.goals for all 
  using (auth.uid() = user_id);


-- AUTOMATIC PROFILE SYNC ON USER SIGNUP
-- Create a trigger function that automatically creates a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, paper_balance, risk_score)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    100000.00,
    0.00
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute the function on user signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
