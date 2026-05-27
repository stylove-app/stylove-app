alter table public.wardrobe_items
  add column if not exists original_image_uri text;

update public.wardrobe_items
set original_image_uri = image_uri
where original_image_uri is null;
