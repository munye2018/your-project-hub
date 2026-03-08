

# Fix Scraper: Filter Category Pages, Extract Real Images, Confirm Kenya Focus

## Context
The project is already Kenya-focused (KES currency, Kenyan counties, Kenyan marketplaces). No geographic revert needed. The issues are:
1. The scraper does not filter out category/listing index pages -- it accepts broad URL patterns like `/car`, `/property` which match category pages, not individual items
2. The `process-listings` function does not extract the actual listing image from the scraped page
3. The dashboard mock data uses Unsplash stock photos instead of real scraped images

---

## Changes

### 1. Improve URL filtering in `scrape-marketplace` edge function

**File: `supabase/functions/scrape-marketplace/index.ts`**

Replace the current URL filter logic to be stricter about individual listing pages:
- Exclude category/index pages by pattern (e.g. URLs ending in `/cars`, `/properties`, `/vehicles`, pages with query params like `?page=`, `/category/`, `/search/`)
- Require URLs to have a specific item identifier pattern (numeric ID, slug with ID, etc.)
- Add explicit exclusions for pagination, sort, and filter URLs

### 2. Extract real listing images in `process-listings` edge function

**File: `supabase/functions/process-listings/index.ts`**

- Change scrape format from `['markdown']` to `['markdown', 'links']` (or use the JSON extraction format) to capture image URLs from the page
- Update the AI prompt to also extract `image_url` -- the primary listing photo from the actual page content
- When inserting the opportunity, include the extracted `image_url` field
- Add fallback: if AI can't find an image, check scraped metadata for `og:image`

### 3. Remove stock images from mock data

**File: `src/pages/Dashboard.tsx`**

- Replace Unsplash URLs in mock data with `null` so the placeholder icon shows instead of fake stock photos
- This ensures no misleading images appear until real scraped data populates the dashboard

---

## Files Summary

| File | Action |
|------|--------|
| `supabase/functions/scrape-marketplace/index.ts` | Tighten URL filters to exclude category pages |
| `supabase/functions/process-listings/index.ts` | Extract real `image_url` from scraped content |
| `src/pages/Dashboard.tsx` | Remove stock photo URLs from mock data |

