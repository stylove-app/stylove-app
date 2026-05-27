-- Detailed wardrobe item type + engine category alignment (idempotent)
-- Does NOT delete or reset wardrobe_items data.

-- ---------------------------------------------------------------------------
-- 1. Add item_type column
-- ---------------------------------------------------------------------------
alter table public.wardrobe_items
  add column if not exists item_type text;

-- ---------------------------------------------------------------------------
-- 2. Backfill item_type from legacy or current category
-- ---------------------------------------------------------------------------
update public.wardrobe_items
set item_type = case category
  when 'dresses' then 'elbise'
  when 'dress' then 'elbise'
  when 'blazers' then 'ceket'
  when 'outerwear' then 'ceket'
  when 'shoes' then 'ayakkabi'
  when 'bags' then 'canta'
  when 'bag' then 'canta'
  when 'accessories' then 'aksesuar'
  when 'accessory' then 'aksesuar'
  when 'jewelry' then 'saat'
  when 'upper' then 'gomlek'
  when 'bottom' then 'pantolon'
  else coalesce(item_type, 'aksesuar')
end
where item_type is null or trim(item_type) = '';

-- ---------------------------------------------------------------------------
-- 3. Migrate legacy broad categories to engine categories
-- ---------------------------------------------------------------------------
update public.wardrobe_items
set category = case category
  when 'dresses' then 'dress'
  when 'blazers' then 'outerwear'
  when 'bags' then 'bag'
  when 'accessories' then 'accessory'
  when 'jewelry' then 'accessory'
  else category
end
where category in ('dresses', 'blazers', 'bags', 'accessories', 'jewelry');

-- ---------------------------------------------------------------------------
-- 4. Refresh PostgREST schema cache (fixes PGRST204 after manual SQL)
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';
