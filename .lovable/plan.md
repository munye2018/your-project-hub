

# Categorized Browse, Budget Onboarding, and Location-Based Search

## Overview
Three features: (1) organize opportunities into searchable categories, (2) add a post-signup onboarding flow for budget selection, (3) allow optional location sharing with a distance limit for nearby results.

---

## 1. Database Changes

Add columns to `profiles` table:
```sql
ALTER TABLE profiles 
  ADD COLUMN budget_min numeric DEFAULT 0,
  ADD COLUMN budget_max numeric DEFAULT NULL,
  ADD COLUMN onboarding_completed boolean DEFAULT false,
  ADD COLUMN user_latitude numeric DEFAULT NULL,
  ADD COLUMN user_longitude numeric DEFAULT NULL,
  ADD COLUMN search_radius_km integer DEFAULT 50;
```

---

## 2. Onboarding Flow

**New file: `src/pages/Onboarding.tsx`**

Multi-step wizard shown after signup (when `profile.onboarding_completed` is false):

- **Step 1 -- Budget Range**: Select from predefined ranges (e.g., Under KES 1M, 1-5M, 5-15M, 15-50M, 50M+) or set custom min/max with sliders.
- **Step 2 -- Asset Categories**: Pick interested asset types (vehicles, residential, commercial) -- reuses existing `preferred_asset_types` on profile.
- **Step 3 -- Location (optional)**: Toggle to share location via browser Geolocation API. If enabled, show a slider for max search radius (10-200 km). Show a small map preview of their location.
- On completion: update profile with budget, location, radius, and set `onboarding_completed = true`. Redirect to dashboard.

**Modify `src/pages/Index.tsx`**: After auth check, if `profile.onboarding_completed === false`, redirect to `/onboarding` instead of showing Dashboard.

**Modify `src/App.tsx`**: Add `/onboarding` route.

---

## 3. Categorized Browsing with Search

**Modify `src/pages/Dashboard.tsx`**:

Replace the current flat tabs with a category-first layout:
- Add a prominent search bar at the top with type-ahead filtering across title, description, county, and asset type.
- Group opportunities by `asset_type` into collapsible category sections (Vehicles, Residential, Commercial), each showing a count badge.
- Within each category, show a horizontal scrollable row of cards or a grid depending on screen size.
- Existing `FilterBar` remains but is enhanced with a budget range filter that defaults to the user's onboarding budget.

**Modify `src/components/dashboard/FilterBar.tsx`**:
- Add budget range filter (min/max price inputs or slider) that filters by `listed_price`.
- Add location distance filter (if user shared location) showing "Within X km" slider.

---

## 4. Budget-Filtered Dashboard

**Modify `src/pages/Dashboard.tsx`**:
- On load, read `profile.budget_min` and `profile.budget_max` to set default price filters.
- Filter `listed_price` within budget range.
- Show a banner if no results match budget: "No opportunities in your budget. Adjust filters?"

---

## 5. Location-Based Filtering

**Modify `src/pages/Dashboard.tsx`**:
- If user has `user_latitude`/`user_longitude` set, calculate distance to each opportunity's county center (using `kenya_counties` lat/lng).
- Filter by `search_radius_km`.
- Add a "Near You" tab/section at the top showing closest opportunities first.

**Utility function** in `src/lib/utils.ts`:
- `haversineDistance(lat1, lon1, lat2, lon2)` -- returns km between two coordinates.

---

## 6. Update Types

**Modify `src/types/opportunity.ts`**:
- Add `budget_min`, `budget_max`, `onboarding_completed`, `user_latitude`, `user_longitude`, `search_radius_km` to `UserProfile`.
- Add `budgetMin`, `budgetMax`, `maxDistanceKm` to `FilterOptions`.

---

## Files Summary

| File | Action |
|------|--------|
| `profiles` table | Migration: add 5 columns |
| `src/pages/Onboarding.tsx` | Create |
| `src/pages/Index.tsx` | Modify (redirect if not onboarded) |
| `src/pages/Dashboard.tsx` | Modify (categorized layout, budget/location defaults) |
| `src/components/dashboard/FilterBar.tsx` | Modify (budget + distance filters) |
| `src/types/opportunity.ts` | Modify (new profile/filter fields) |
| `src/lib/utils.ts` | Modify (add haversine function) |
| `src/App.tsx` | Modify (add /onboarding route) |

