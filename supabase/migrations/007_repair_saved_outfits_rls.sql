-- Repair saved outfits persistence infrastructure.
-- Idempotent and additive only: does not reset or delete data.

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

alter table public.saved_outfits
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists title text,
  add column if not exists occasion text,
  add column if not exists category text,
  add column if not exists outfit_json jsonb not null default '{}'::jsonb,
  add column if not exists favorite boolean default false,
  add column if not exists created_at timestamptz default now();

alter table public.saved_outfits
  alter column outfit_json set default '{}'::jsonb;

create index if not exists saved_outfits_user_id_created_at_idx
  on public.saved_outfits (user_id, created_at desc);

alter table public.saved_outfits enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.saved_outfits to authenticated;

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
