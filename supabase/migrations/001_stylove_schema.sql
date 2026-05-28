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

grant usage on schema public to authenticated;
grant select, insert, update on table public.profiles to authenticated;

drop policy if exists "Profiles are readable by owner" on public.profiles;
drop policy if exists "Profiles are insertable by owner" on public.profiles;
drop policy if exists "Profiles are updatable by owner" on public.profiles;

create policy "Profiles are readable by owner"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on public.profiles for update
  to authenticated
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

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_created'
      and tgrelid = 'auth.users'::regclass
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end;
$$;

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

grant select, insert, update, delete on table public.wardrobe_items to authenticated;

drop policy if exists "Wardrobe readable by owner" on public.wardrobe_items;
drop policy if exists "Wardrobe insertable by owner" on public.wardrobe_items;
drop policy if exists "Wardrobe updatable by owner" on public.wardrobe_items;
drop policy if exists "Wardrobe deletable by owner" on public.wardrobe_items;

create policy "Wardrobe readable by owner"
  on public.wardrobe_items for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Wardrobe insertable by owner"
  on public.wardrobe_items for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Wardrobe updatable by owner"
  on public.wardrobe_items for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Wardrobe deletable by owner"
  on public.wardrobe_items for delete
  to authenticated
  using (auth.uid() = user_id);
