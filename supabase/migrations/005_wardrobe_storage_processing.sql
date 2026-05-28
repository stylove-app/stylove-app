-- Wardrobe storage + processing columns (idempotent, safe to re-run)
-- Does NOT delete or reset wardrobe_items data.

-- ---------------------------------------------------------------------------
-- 1. Columns on wardrobe_items (add only if missing)
-- ---------------------------------------------------------------------------
alter table public.wardrobe_items
  add column if not exists original_image_uri text;

alter table public.wardrobe_items
  add column if not exists cleaned_image_uri text;

alter table public.wardrobe_items
  add column if not exists processing_status text;

alter table public.wardrobe_items
  add column if not exists processing_error text;

-- Default for new rows when column was just added without default
alter table public.wardrobe_items
  alter column processing_status set default 'pending';

-- Backfill existing rows (non-destructive)
update public.wardrobe_items
set original_image_uri = coalesce(original_image_uri, image_uri)
where original_image_uri is null;

update public.wardrobe_items
set processing_status = coalesce(processing_status, 'pending')
where processing_status is null;

update public.wardrobe_items
set processing_status = 'done'
where processing_status in ('pending', 'processing')
  and cleaned_image_uri is not null
  and cleaned_image_uri <> '';

update public.wardrobe_items
set processing_status = 'done'
where processing_status = 'pending'
  and (cleaned_image_uri is null or cleaned_image_uri = '')
  and image_uri is not null
  and image_uri <> '';

-- Status constraint (idempotent, preserves existing rows)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'wardrobe_items_processing_status_check'
      and conrelid = 'public.wardrobe_items'::regclass
  ) then
    alter table public.wardrobe_items
      add constraint wardrobe_items_processing_status_check
      check (processing_status in ('pending', 'processing', 'done', 'failed')) not valid;
  end if;
end;
$$;

create index if not exists wardrobe_items_processing_status_idx
  on public.wardrobe_items (user_id, processing_status);

-- ---------------------------------------------------------------------------
-- 2. Storage buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'wardrobe-originals',
    'wardrobe-originals',
    true,
    15728640,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'wardrobe-cleaned',
    'wardrobe-cleaned',
    true,
    15728640,
    array['image/png']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- 3. Storage policies (drop + recreate = safe to re-run)
-- ---------------------------------------------------------------------------
drop policy if exists "Wardrobe originals upload own folder" on storage.objects;
drop policy if exists "Wardrobe originals read own folder" on storage.objects;
drop policy if exists "Wardrobe originals delete own folder" on storage.objects;
drop policy if exists "Wardrobe cleaned read own folder" on storage.objects;
drop policy if exists "Wardrobe cleaned delete own folder" on storage.objects;

create policy "Wardrobe originals upload own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'wardrobe-originals'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Wardrobe originals read own folder"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'wardrobe-originals'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Wardrobe originals delete own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'wardrobe-originals'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Wardrobe cleaned read own folder"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'wardrobe-cleaned'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Wardrobe cleaned delete own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'wardrobe-cleaned'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
