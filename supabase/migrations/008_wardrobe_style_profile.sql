-- Idempotent: detailed women’s style profile per wardrobe item (JSON).
ALTER TABLE public.wardrobe_items
  ADD COLUMN IF NOT EXISTS style_profile jsonb;

COMMENT ON COLUMN public.wardrobe_items.style_profile IS
  'Women’s style profile: slot, color, formality, useCases, isOnePiece, etc.';
