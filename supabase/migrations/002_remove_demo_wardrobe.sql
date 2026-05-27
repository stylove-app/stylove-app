-- Remove sample/demo wardrobe rows and block them from being inserted again.
-- Run in Supabase SQL Editor after 001_stylove_schema.sql.

delete from public.wardrobe_items
where image_uri like '%images.unsplash.com%'
   or lower(trim(name)) in (
     lower('Silk Evening Dress'),
     lower('Tailored Blazer'),
     lower('Leather Pumps'),
     lower('Structured Tote'),
     lower('Gold Cuff')
   );

alter table public.wardrobe_items
  drop constraint if exists wardrobe_items_no_demo_samples;

alter table public.wardrobe_items
  add constraint wardrobe_items_no_demo_samples
  check (
    image_uri not like '%images.unsplash.com%'
    and lower(trim(name)) not in (
      lower('Silk Evening Dress'),
      lower('Tailored Blazer'),
      lower('Leather Pumps'),
      lower('Structured Tote'),
      lower('Gold Cuff')
    )
  );
