

# Implementation Plan: Web Scraping Engine, AI Valuation, Kenya Map View & Notifications

## Overview
This plan implements four major features to complete the AI-powered arbitrage platform:
1. **Web Scraping Engine** - Firecrawl-powered data collection from Kenyan marketplaces
2. **AI Valuation Engine** - Lovable AI-powered asset analysis and pricing
3. **Kenya Interactive Map** - Visual opportunity discovery across 47 counties
4. **WhatsApp + Email Notifications** - Real-time alerts for high-value deals

---

## 1. Web Scraping Engine

### Database Schema Updates
Add tables to track scraping jobs and sources:

```text
+------------------+     +-------------------+     +------------------+
| scraping_sources |     | scraping_jobs     |     | raw_listings     |
+------------------+     +-------------------+     +------------------+
| id               |     | id                |     | id               |
| name             |     | source_id         |     | job_id           |
| platform_type    |     | status            |     | source_url       |
| base_url         |     | started_at        |     | raw_data (JSONB) |
| scrape_frequency |     | completed_at      |     | parsed_data      |
| is_active        |     | items_found       |     | processed        |
| last_scraped     |     | error_message     |     | opportunity_id   |
+------------------+     +-------------------+     +------------------+
```

### Edge Functions
Create 3 backend functions:

**a) `firecrawl-scrape` - Single URL Scraper**
- Accepts URL and extraction options
- Uses Firecrawl to extract structured data
- Returns cleaned listing data

**b) `scrape-marketplace` - Marketplace Orchestrator**
- Accepts source configuration (Cheki, BuyRentKenya, JiJi, etc.)
- Maps URLs for the marketplace using Firecrawl Map API
- Queues individual scrapes
- Stores raw data for AI processing

**c) `process-listings` - Batch Processor**
- Fetches unprocessed raw listings
- Calls AI valuation for each
- Creates/updates opportunities table
- Marks listings as processed

### Connector Setup
- Enable **Firecrawl connector** (requires user approval)
- Firecrawl API key will be injected as `FIRECRAWL_API_KEY`

### Frontend Components
- **ScrapingDashboard.tsx** - View scraping jobs, sources, and status
- **AddSourceForm.tsx** - Configure new marketplace sources
- **ManualScrapeButton.tsx** - Trigger immediate scrapes

---

## 2. AI Valuation Engine

### Edge Functions

**a) `analyze-listing` - Asset Valuation**
Uses Lovable AI (google/gemini-3-flash-preview) to:
- Extract asset details from scraped content
- Estimate true market value based on:
  - Regional pricing data (all 47 counties)
  - Asset condition assessment
  - Comparable sales analysis
- Generate confidence score (0-100%)

**b) `suggest-improvements` - ROI Analysis**
Uses Lovable AI to:
- Recommend value-adding improvements
- Estimate improvement costs by region
- Calculate ROI for each recommendation
- Return structured recommendations array

**c) `analyze-seller` - Credibility Scoring**
Uses Lovable AI to:
- Analyze seller information from listing
- Cross-reference patterns (account age, pricing consistency)
- Detect red flags (scam indicators)
- Generate credibility score (1-10)

### AI Prompt System
Structure prompts for consistent output:
```text
System: You are a Kenyan real estate and vehicle market expert...
Input: {listing_data, regional_pricing, comparable_sales}
Output: {estimated_value, confidence_score, reasoning, improvements[]}
```

### Regional Pricing Integration
- Seed `regional_pricing` table with baseline data for all 47 counties
- AI uses this data for accurate local valuations
- Prices update as more data is scraped

---

## 3. Kenya Interactive Map View

### Technology
Use **Leaflet.js** with **react-leaflet** for interactive mapping:
- Lightweight, open-source
- Works well with React
- Supports custom markers and clustering

### Database Updates
Add geographic coordinates to `kenya_counties`:
```sql
ALTER TABLE kenya_counties ADD COLUMN latitude NUMERIC;
ALTER TABLE kenya_counties ADD COLUMN longitude NUMERIC;
```

Seed with actual county center coordinates.

### Map Components

**a) `KenyaMap.tsx` - Main Map Component**
- Renders Kenya with county boundaries
- Clusters opportunities by location
- Color-coded markers by asset type
- Click marker to view opportunity details

**b) `MapFilters.tsx` - Map-Specific Filters**
- Filter by asset type (vehicle/residential/commercial)
- Filter by profit margin
- Toggle heatmap vs markers

**c) `MapSidebar.tsx` - Selected Opportunity Panel**
- Shows details when marker clicked
- Quick actions (save, contact, dismiss)
- Navigate to full opportunity view

### Map Features
- **Marker Clustering**: Groups nearby opportunities
- **Color Coding**: Blue (vehicles), Green (residential), Amber (commercial)
- **Profit Indicators**: Marker size based on profit percentage
- **County Highlighting**: Hover to see county stats
- **Responsive Design**: Works on mobile with touch gestures

---

## 4. WhatsApp + Email Notifications

### Database Updates
Add notification preferences and tracking:
```sql
ALTER TABLE profiles ADD COLUMN min_profit_threshold NUMERIC DEFAULT 20;
ALTER TABLE profiles ADD COLUMN instant_alert_enabled BOOLEAN DEFAULT true;

CREATE TABLE notification_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  notification_id UUID REFERENCES notifications(id),
  channel TEXT CHECK (channel IN ('whatsapp', 'email', 'push')),
  status TEXT,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  error_message TEXT
);
```

### WhatsApp Integration
Use **WhatsApp Business API** (Meta Cloud API):

**Edge Function: `send-whatsapp`**
- Accepts: user_id, opportunity details, message template
- Sends rich message with:
  - Asset image
  - Title and location
  - Price comparison
  - Profit percentage
  - "View Details" link button

**Message Templates**:
```text
🔥 *New High-Value Opportunity!*

*{asset_type}: {title}*
📍 {city}, {county}

Listed: KES {listed_price}
Value: KES {estimated_value}
💰 *Profit: +{profit_percentage}%*

Tap to view: {app_link}
```

### Email Notifications (Resend)
**Edge Function: `send-email`**
- Password reset, email verification (auth emails)
- Weekly digest of new opportunities
- High-value alert emails

**Email Templates**:
- Welcome email with setup guide
- Daily/weekly opportunity digest
- High-value instant alert

### Notification Triggers
**Edge Function: `trigger-notifications`**
- Called after new opportunities are processed
- Checks user preferences (regions, asset types, thresholds)
- Sends via appropriate channel based on `alert_frequency`

### In-App Notification Center
**Components:**
- `NotificationBell.tsx` - Header icon with unread count
- `NotificationDropdown.tsx` - Quick view of recent notifications
- `NotificationsPage.tsx` - Full history with filters

---

## Technical Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard  │  Map View  │  Scraping Admin  │  Notifications    │
└──────┬──────┴─────┬──────┴───────┬──────────┴────────┬──────────┘
       │            │              │                   │
       ▼            ▼              ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EDGE FUNCTIONS                                │
├─────────────┬──────────────┬─────────────────┬──────────────────┤
│ firecrawl-  │ analyze-     │ scrape-         │ send-            │
│ scrape      │ listing      │ marketplace     │ whatsapp/email   │
├─────────────┼──────────────┼─────────────────┼──────────────────┤
│ process-    │ suggest-     │ trigger-        │ send-email       │
│ listings    │ improvements │ notifications   │                  │
└──────┬──────┴──────┬───────┴────────┬────────┴─────────┬────────┘
       │             │                │                  │
       ▼             ▼                ▼                  ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐ ┌─────────────────┐
│  Firecrawl   │ │ Lovable  │ │   Supabase   │ │ WhatsApp/Resend │
│     API      │ │    AI    │ │   Database   │ │      APIs       │
└──────────────┘ └──────────┘ └──────────────┘ └─────────────────┘
```

---

## Implementation Order

### Step 1: Connect Firecrawl
- Enable Firecrawl connector
- Create `firecrawl-scrape` edge function
- Test with sample URL

### Step 2: AI Valuation Engine
- Create `analyze-listing` edge function
- Create `suggest-improvements` edge function
- Test with mock listing data

### Step 3: Full Scraping Pipeline
- Create `scrape-marketplace` edge function
- Create `process-listings` edge function
- Build scraping dashboard UI
- Seed initial marketplace sources

### Step 4: Interactive Map
- Add Leaflet dependencies
- Add coordinates to counties table
- Build `KenyaMap` component
- Add map route and navigation

### Step 5: Notifications System
- Create notification edge functions
- Build in-app notification center
- Integrate WhatsApp Business API
- Set up email templates with Resend

---

## Required Secrets & Connectors

| Secret | Source | Purpose |
|--------|--------|---------|
| `FIRECRAWL_API_KEY` | Firecrawl Connector | Web scraping |
| `LOVABLE_API_KEY` | Auto-provisioned | AI valuation |
| `WHATSAPP_ACCESS_TOKEN` | User provides | WhatsApp messaging |
| `WHATSAPP_PHONE_NUMBER_ID` | User provides | WhatsApp sender |
| `RESEND_API_KEY` | User provides | Email notifications |

---

## New Dependencies

```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "@types/leaflet": "^1.9.8",
  "react-markdown": "^9.0.1",
  "remark-gfm": "^4.0.0"
}
```

---

## Files to Create

### Edge Functions (7 functions)
- `supabase/functions/firecrawl-scrape/index.ts`
- `supabase/functions/scrape-marketplace/index.ts`
- `supabase/functions/process-listings/index.ts`
- `supabase/functions/analyze-listing/index.ts`
- `supabase/functions/suggest-improvements/index.ts`
- `supabase/functions/send-whatsapp/index.ts`
- `supabase/functions/send-email/index.ts`

### Frontend Components (10+ components)
- `src/components/map/KenyaMap.tsx`
- `src/components/map/MapMarker.tsx`
- `src/components/map/MapSidebar.tsx`
- `src/components/scraping/ScrapingDashboard.tsx`
- `src/components/scraping/SourceCard.tsx`
- `src/components/notifications/NotificationBell.tsx`
- `src/components/notifications/NotificationDropdown.tsx`
- `src/pages/MapView.tsx`
- `src/pages/ScrapingAdmin.tsx`
- `src/pages/Notifications.tsx`

### API Layer
- `src/lib/api/firecrawl.ts`
- `src/lib/api/notifications.ts`
- `src/hooks/useOpportunities.ts`
- `src/hooks/useNotifications.ts`

---

## Summary

This implementation delivers a complete AI-powered arbitrage discovery system:

- **Automated Data Collection**: Firecrawl scrapes Kenyan marketplaces continuously
- **AI-Powered Analysis**: Lovable AI values assets and suggests improvements
- **Visual Discovery**: Interactive map shows opportunities across all 47 counties
- **Instant Alerts**: WhatsApp and email notify you of high-value deals

All features integrate seamlessly with the existing dashboard and authentication system.

