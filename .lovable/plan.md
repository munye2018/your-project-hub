

# Fix Scraping Flow for End-to-End Testing

## Issues Found

1. **`getClaims()` does not exist** in Supabase JS v2. Both `scrape-marketplace` and `process-listings` use `supabase.auth.getClaims(token)` which will throw a runtime error. Should use `supabase.auth.getUser()` instead.

2. **No admin users exist** -- the `user_roles` table is empty, so every request is rejected with "Admin access required". You need to sign up, then manually insert an admin role for your user.

3. **`scraping_jobs` foreign key** -- `source_id` references nothing according to the schema, but inserts reference `scraping_sources.id`. This likely works but should be verified.

## Plan

### 1. Fix auth in both edge functions
**Files:** `supabase/functions/scrape-marketplace/index.ts`, `supabase/functions/process-listings/index.ts`

Replace the broken `getClaims` call with `getUser()`:
```typescript
const { data: { user }, error: userError } = await supabase.auth.getUser();
if (userError || !user) return { error: 'Unauthorized', status: 401 };
const userId = user.id;
```

### 2. Add admin role for existing user
Run a migration to insert an admin role. First need to identify your user_id from the profiles table, or create a migration that makes the first registered user an admin.

**Migration SQL:**
```sql
-- Make the first registered user an admin (if one exists)
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'
FROM public.profiles
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;
```

### 3. Verify Firecrawl connector is linked
The `FIRECRAWL_API_KEY` secret exists. No action needed.

### Files Summary

| File | Action |
|------|--------|
| `supabase/functions/scrape-marketplace/index.ts` | Fix `getClaims` → `getUser()` |
| `supabase/functions/process-listings/index.ts` | Fix `getClaims` → `getUser()` |
| Database migration | Insert admin role for first user |

