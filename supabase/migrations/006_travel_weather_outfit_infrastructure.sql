-- Stylove travel/weather/outfit infrastructure (idempotent, additive only)
-- Does NOT reset or delete data.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.travel_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  destination text not null,
  destination_lat double precision,
  destination_lon double precision,
  start_date date not null,
  end_date date not null,
  travel_type text,
  baggage_type text,
  plan_json jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists travel_plans_user_id_created_at_idx
  on public.travel_plans (user_id, created_at desc);

create table if not exists public.travel_weather_cache (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  country text,
  latitude double precision,
  longitude double precision,
  forecast_date date not null,
  normalized_weather_json jsonb not null,
  source text default 'open-meteo',
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  unique(city, forecast_date)
);

create index if not exists travel_weather_cache_lookup_idx
  on public.travel_weather_cache (city, forecast_date, expires_at);

create table if not exists public.saved_outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  occasion text,
  category text,
  outfit_json jsonb not null default '{}'::jsonb,
  favorite boolean default false,
  created_at timestamptz default now()
);

create index if not exists saved_outfits_user_id_created_at_idx
  on public.saved_outfits (user_id, created_at desc);

create table if not exists public.style_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  dominant_tones jsonb,
  style_signature text,
  energy text,
  style_dna text,
  history_json jsonb,
  updated_at timestamptz default now()
);

create index if not exists style_profiles_user_id_idx
  on public.style_profiles (user_id);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_travel_plans_updated_at'
      and tgrelid = 'public.travel_plans'::regclass
  ) then
    create trigger set_travel_plans_updated_at
      before update on public.travel_plans
      for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_style_profiles_updated_at'
      and tgrelid = 'public.style_profiles'::regclass
  ) then
    create trigger set_style_profiles_updated_at
      before update on public.style_profiles
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.travel_plans enable row level security;
alter table public.travel_weather_cache enable row level security;
alter table public.saved_outfits enable row level security;
alter table public.style_profiles enable row level security;

drop policy if exists "Travel plans readable by owner" on public.travel_plans;
drop policy if exists "Travel plans insertable by owner" on public.travel_plans;
drop policy if exists "Travel plans updatable by owner" on public.travel_plans;
drop policy if exists "Travel plans deletable by owner" on public.travel_plans;

create policy "Travel plans readable by owner"
  on public.travel_plans for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Travel plans insertable by owner"
  on public.travel_plans for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Travel plans updatable by owner"
  on public.travel_plans for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Travel plans deletable by owner"
  on public.travel_plans for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Weather cache readable by authenticated users" on public.travel_weather_cache;

create policy "Weather cache readable by authenticated users"
  on public.travel_weather_cache for select
  to authenticated
  using (true);

drop policy if exists "Saved outfits readable by owner" on public.saved_outfits;
drop policy if exists "Saved outfits insertable by owner" on public.saved_outfits;
drop policy if exists "Saved outfits updatable by owner" on public.saved_outfits;
drop policy if exists "Saved outfits deletable by owner" on public.saved_outfits;

create policy "Saved outfits readable by owner"
  on public.saved_outfits for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Saved outfits insertable by owner"
  on public.saved_outfits for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Saved outfits updatable by owner"
  on public.saved_outfits for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Saved outfits deletable by owner"
  on public.saved_outfits for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Style profiles readable by owner" on public.style_profiles;
drop policy if exists "Style profiles insertable by owner" on public.style_profiles;
drop policy if exists "Style profiles updatable by owner" on public.style_profiles;
drop policy if exists "Style profiles deletable by owner" on public.style_profiles;

create policy "Style profiles readable by owner"
  on public.style_profiles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Style profiles insertable by owner"
  on public.style_profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Style profiles updatable by owner"
  on public.style_profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Style profiles deletable by owner"
  on public.style_profiles for delete
  to authenticated
  using (auth.uid() = user_id);
