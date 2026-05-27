# remove-wardrobe-background

Server-side wardrobe background removal via [remove.bg](https://www.remove.bg/api).

## Deploy

```bash
supabase secrets set REMOVE_BG_API_KEY=your_remove_bg_api_key
supabase functions deploy remove-wardrobe-background
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically in production.

## Flow

1. App uploads the original JPEG to `wardrobe-originals/{userId}/{itemId}.jpg`
2. App inserts `wardrobe_items` with `processing_status = 'processing'`
3. App invokes this function with `{ itemId }` and the user's JWT
4. Function downloads the original, calls remove.bg, uploads PNG to `wardrobe-cleaned/{userId}/{itemId}.png`
5. Function updates `cleaned_image_uri`, `image_uri`, and `processing_status = 'done'`

On failure, `processing_status = 'failed'` and the app keeps showing the original image.
