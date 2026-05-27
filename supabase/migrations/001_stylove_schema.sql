-- Stylove: profiles + wardrobe_items with RLS
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  first_name text not null default '',
  last_name text not null default '',
  username text not null default '',
  photo_uri text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are readable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  category text not null,
  image_uri text not null,
  created_at bigint not null,
  updated_at timestamptz not null default now()
);

create index if not exists wardrobe_items_user_id_idx on public.wardrobe_items (user_id);

alter table public.wardrobe_items enable row level security;

create policy "Wardrobe readable by owner"
  on public.wardrobe_items for select
  using (auth.uid() = user_id);

create policy "Wardrobe insertable by owner"
  on public.wardrobe_items for insert
  with check (auth.uid() = user_id);

create policy "Wardrobe updatable by owner"
  on public.wardrobe_items for update
  using (auth.uid() = user_id);

create policy "Wardrobe deletable by owner"
  on public.wardrobe_items for delete
  using (auth.uid() = user_id);
