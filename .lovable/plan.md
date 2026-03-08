

# Connect Dashboard to Real Database Data

## Overview
Replace all mock data in `Dashboard.tsx` with live queries to the `opportunities_public` view and `kenya_counties` table. Compute stats dynamically from the fetched data.

## Changes

### 1. Fetch real opportunities from `opportunities_public`
**File: `src/pages/Dashboard.tsx`**

- Remove `mockOpportunities` and `mockStats` constants
- Add `useEffect` + `useState` (or a React Query hook) to fetch from `opportunities_public` view
- Query: `supabase.from('opportunities_public').select('*')` — this view already strips sensitive data via RLS
- Map the response to the `Opportunity` type (handle nulls for `profit_potential`, `net_profit_potential`, etc.)
- Add loading and empty states

### 2. Fetch counties from `kenya_counties` for distance calc
- Replace hardcoded `COUNTY_COORDS` with data from `kenya_counties` table (which has `latitude`/`longitude`)
- Query: `supabase.from('kenya_counties').select('name, latitude, longitude')`
- Build the coords lookup dynamically
- Also use county names for the filter dropdown instead of the hardcoded list

### 3. Compute stats dynamically
- Calculate `totalOpportunities`, `totalPotentialProfit`, `newListingsToday`, `averageProfitMargin` from the fetched opportunities array
- `newListingsToday`: filter where `created_at` is today
- `averageProfitMargin`: average of `profit_percentage`
- No separate query needed — derive from the already-fetched data

### 4. Wire up saved opportunities
- On mount, fetch `saved_opportunities` for the current user to populate `savedIds`
- `handleSave`: insert/delete from `saved_opportunities` table instead of just local state
- `handleDismiss`: optionally update opportunity status or just hide locally

### Files Summary

| File | Action |
|------|--------|
| `src/pages/Dashboard.tsx` | Replace mock data with Supabase queries, dynamic stats, real saved state |

