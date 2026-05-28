-- Block sample/demo wardrobe rows from being inserted again.
-- Run in Supabase SQL Editor after 001_stylove_schema.sql.
-- Production-safe reruns must not delete existing live data.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'wardrobe_items_no_demo_samples'
      and conrelid = 'public.wardrobe_items'::regclass
  ) then
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
      ) not valid;
  end if;
end;
$$;
