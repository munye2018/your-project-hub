
# Adding Kenyan Auctioneer Sources & MVP Launch Preparation

## Overview
This plan covers adding reputable Kenyan auctioneer websites as scraping sources (excellent for below-market-value deals), and identifies the remaining items needed before launching the MVP with payment acceptance.

---

## Part 1: Kenyan Auctioneer Sources

### Trusted Auctioneers to Add

Research shows these are the most reputable auctioneers in Kenya with active online presence:

| Auctioneer | Website | Platform Type | Notes |
|------------|---------|---------------|-------|
| **Garam Investments** | garamauctions.co.ke | Vehicles, Property | Licensed by LSK, regular government/bank auctions |
| **Boni & Co Auctioneers** | boniandco.co.ke | General | Established firm, court-appointed auctioneer |
| **Imperial Auctioneers** | imperialauctioneers.co.ke | Vehicles, Property | Bank repossessions specialist |
| **Sohani & Co** | sohaniandco.co.ke | General | Court and bank auctions |
| **Nyandarua Auctioneers** | nyandaruaauctioneers.co.ke | Vehicles | Specializes in vehicle auctions |

### Database Changes

Add new scraping sources with appropriate configuration:

```sql
INSERT INTO scraping_sources (name, platform_type, base_url, config, scrape_frequency, is_active)
VALUES 
  ('Garam Auctions', 'auction', 'https://garamauctions.co.ke', 
   '{"search_paths": ["/vehicles", "/properties", "/auctions"]}', 'daily', true),
  ('Boni & Co Auctioneers', 'auction', 'https://boniandco.co.ke',
   '{"search_paths": ["/auctions", "/upcoming"]}', 'daily', true),
  ('Imperial Auctioneers', 'auction', 'https://imperialauctioneers.co.ke',
   '{"search_paths": ["/vehicles", "/property"]}', 'daily', true),
  ('Sohani & Co', 'auction', 'https://sohaniandco.co.ke',
   '{"search_paths": ["/auctions"]}', 'weekly', true),
  ('Nyandarua Auctioneers', 'auction', 'https://nyandaruaauctioneers.co.ke',
   '{"search_paths": ["/auctions", "/vehicles"]}', 'daily', true);
```

### Code Changes

**Update `scrape-marketplace` edge function** to better handle auction URLs:
- Add auction-specific URL patterns: `/auction`, `/lot`, `/bid`, `/hammer`
- Tag opportunities with `source_platform` including "Auction:" prefix for easy filtering

**Update `ScrapingDashboard.tsx`** to:
- Add Gavel icon for auction platform type
- Display auction sources distinctly (maybe with a special badge)

**Update `process-listings` AI prompt** to:
- Understand auction terminology (reserve price, starting bid, hammer price)
- Estimate the likely hammer price based on typical auction discounts (15-40% below retail)
- Factor in buyer's premium (typically 5-10% on top)

---

## Part 2: MVP Launch Checklist

### Already Completed
| Feature | Status |
|---------|--------|
| User authentication (signup/login) | Done |
| Dashboard with opportunity cards | Done |
| Map view with Kenya counties | Done |
| Credit-based reveal system | Done |
| Subscription tiers defined (Free/Basic/Standard/Hustler) | Done |
| Sound effects for notifications | Done |
| Push notifications (service worker) | Done |
| Web scraping engine with admin panel | Done |
| AI-powered listing analysis | Done |
| Security hardening (RLS, SSRF protection) | Done |

### Still Needed for MVP Launch

#### 1. Payment Integration (Critical)
The `UpgradeModal` currently shows `alert("Payment integration coming soon!")`. Need to:
- Enable Stripe integration
- Create products for each tier (Basic: KES 500, Standard: KES 900, Hustler: KES 1,999)
- Implement subscription checkout flow
- Add webhook to update `user_credits.subscription_tier` on successful payment
- Handle subscription cancellation and downgrades

#### 2. Settings Page (High Priority)
No settings page currently exists. Users need to:
- Toggle sound notifications on/off
- Enable/disable push notifications
- Update profile information
- View/manage their subscription
- See billing history

#### 3. Email Verification Flow (High Priority)
- Email confirmation is set up, but need a nice UI for "Check your email" state
- Resend verification email functionality
- Proper redirect after email verification

#### 4. Real Data Instead of Mock Data (High Priority)
The `Dashboard.tsx` currently uses `mockOpportunities` array. Need to:
- Connect to the actual `opportunities` table in the database
- Add real-time subscription for new opportunities
- Show loading states while fetching

#### 5. Terms of Service & Privacy Policy Pages
Required for any payment-enabled application.

#### 6. Landing Page (Marketing)
The current Index page just redirects to Dashboard. A proper landing page would help with:
- Explaining the product value
- Showing pricing tiers
- Social proof / testimonials
- Call-to-action to sign up

#### 7. Monthly Credit Reset (Automation)
The database has `credits_used_this_month` but no scheduled job to reset it monthly. Options:
- Supabase scheduled function (pg_cron)
- External cron service

---

## Implementation Order

### Phase 1: Auctioneer Sources (This Plan)
1. Add auctioneer sources to database
2. Update scraper to handle auction URLs
3. Update AI prompt for auction terminology
4. Add auction icon to ScrapingDashboard

### Phase 2: Payment Integration (Next Priority)
1. Enable Stripe integration
2. Create subscription products
3. Build checkout flow
4. Implement webhooks

### Phase 3: Polish for Launch
1. Settings page
2. Replace mock data with real data
3. Email verification improvements
4. Landing page
5. Legal pages

---

## Technical Details

### New platform_type for Auctions

Add "auction" to the platform type options. The scraper will use the same flow but with enhanced URL filtering:

```typescript
// Enhanced listing URL patterns for auctions
const auctionPatterns = [
  '/lot', '/auction', '/bid', '/sale', '/hammer',
  '/vehicle', '/property', '/item'
];
```

### AI Prompt Enhancement for Auctions

The process-listings function will be updated to include:

```text
For AUCTION listings:
- The listed_price is typically the starting bid or reserve price
- Estimate final hammer price at 60-85% of retail market value
- Add buyer's premium (typically 5-10%) to your cost calculations
- Note: Auction items often require immediate payment and collection
```

### ScrapingDashboard Icon Update

Add to `platformIcons`:
```typescript
import { Gavel } from 'lucide-react';

const platformIcons = {
  vehicle: Car,
  residential: Home,
  commercial: Building2,
  general: Globe,
  auction: Gavel,  // New
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| Database migration | Add 5 auctioneer sources |
| `supabase/functions/scrape-marketplace/index.ts` | Add auction URL patterns |
| `supabase/functions/process-listings/index.ts` | Enhance AI prompt for auction analysis |
| `src/components/scraping/ScrapingDashboard.tsx` | Add Gavel icon for auction type |

---

## After This Implementation

Once the auctioneer sources are added:
1. Test scraping the auction sites to verify they work
2. Process a batch of listings with AI to validate quality
3. Proceed to Stripe integration for payment acceptance

The MVP will be ready for initial users once payment integration is complete. A landing page and settings are nice-to-have but can come in a fast follow-up iteration.
