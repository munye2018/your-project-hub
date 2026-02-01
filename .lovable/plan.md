
# Sound Effects, Push Notifications & Credit-Based Reveal System

## Overview
This plan covers three major features:
1. **Sound Effects** - Play audio alerts when high-value deals arrive
2. **Browser Push Notifications** - Alert users even when the app is in the background
3. **Credit-Based Reveal System** - Hide seller details behind a credit wall with subscription tiers

---

## What Will Be Built

### 1. Sound Effects for High-Value Deals
- Play a pleasant notification sound when new opportunities arrive
- Different sounds for regular deals vs. high-value deals (40%+ profit)
- User preference to enable/disable sounds
- Volume control in settings

### 2. Browser Push Notifications
- Service Worker registration for background notifications
- Permission request flow with clear explanation
- Push notifications when app is in background/closed
- Click-to-open functionality that navigates to the deal
- Integration with existing notification system

### 3. Credit-Based Reveal System

**Subscription Tiers:**
| Tier | Monthly Reveals | Price |
|------|-----------------|-------|
| Free | 1 | Free |
| Basic | 5 | TBD |
| Standard | 10 | TBD |
| Hustler | Unlimited | TBD |

**Hidden Information (until revealed):**
- Seller name
- Seller contact
- Direct link to listing (source_url)

**Visible to All Users:**
- Property/vehicle details and photos
- Location (county, city)
- Listed price, estimated value, profit potential
- AI confidence score

---

## User Experience Flow

```text
NEW USER JOURNEY:
1. User signs up (Free tier by default)
   |
2. User browses opportunities - sees all details EXCEPT:
   - Seller name (shows "Hidden")
   - Seller contact (shows "Reveal to Contact")
   - Source URL (button says "Reveal Listing")
   |
3. User clicks "Reveal" button
   |
4. System checks: Do they have credits?
   |
   +-- YES --> Deduct 1 credit, show details, record reveal
   |
   +-- NO --> Show upgrade modal with tier options
```

```text
NOTIFICATION FLOW:
1. High-value deal scraped (40%+ profit)
   |
2. Backend creates notification + triggers push
   |
3. If app in foreground:
   - Play sound effect
   - Show in-app notification badge
   |
4. If app in background:
   - Browser push notification appears
   - Click opens app and navigates to deal
```

---

## Database Changes

### New Tables

**user_credits**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| credits_remaining | integer | Current credit balance |
| credits_used_this_month | integer | Monthly usage counter |
| subscription_tier | text | 'free', 'basic', 'standard', 'hustler' |
| subscription_started_at | timestamp | When current period began |
| created_at | timestamp | Record creation |
| updated_at | timestamp | Last modified |

**opportunity_reveals**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Who revealed |
| opportunity_id | uuid | What was revealed |
| revealed_at | timestamp | When revealed |
| credits_spent | integer | Always 1 for now |

**push_subscriptions**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| endpoint | text | Push service endpoint |
| p256dh | text | Public key |
| auth | text | Auth secret |
| created_at | timestamp | When subscribed |

### Modified Tables

**profiles** - Add columns:
- `sound_enabled` (boolean, default true)
- `push_enabled` (boolean, default false)

---

## Files to Create

### Sound Effects
| File | Purpose |
|------|---------|
| `public/sounds/notification.mp3` | Standard notification sound |
| `public/sounds/high-value.mp3` | Premium deal alert sound |
| `src/hooks/useNotificationSound.ts` | Hook to play sounds on notification |

### Push Notifications
| File | Purpose |
|------|---------|
| `public/sw.js` | Service Worker for push handling |
| `src/lib/pushNotifications.ts` | Push subscription management |
| `supabase/functions/send-push/index.ts` | Edge function to send push notifications |

### Credit System
| File | Purpose |
|------|---------|
| `src/hooks/useCredits.ts` | Credit balance and reveal logic |
| `src/components/credits/RevealButton.tsx` | Button that handles reveal flow |
| `src/components/credits/UpgradeModal.tsx` | Modal showing subscription options |
| `src/components/credits/CreditsBadge.tsx` | Shows remaining credits in UI |
| `supabase/functions/reveal-opportunity/index.ts` | Secure credit deduction |

### Modified Files
| File | Changes |
|------|---------|
| `src/components/dashboard/OpportunityCard.tsx` | Hide seller info, add reveal button |
| `src/components/map/MapSidebar.tsx` | Hide source URL, add reveal button |
| `src/hooks/useNotifications.ts` | Integrate sound playback |
| `src/main.tsx` | Register service worker |
| `src/components/layout/Navbar.tsx` | Add credits badge |

---

## Implementation Steps

### Step 1: Database Setup
- Create `user_credits` table with default values based on tier
- Create `opportunity_reveals` table to track what users have revealed
- Create `push_subscriptions` table for storing push endpoints
- Add `sound_enabled` and `push_enabled` to profiles
- Create database function to auto-create credits row on user signup
- Create RLS policies for all new tables

### Step 2: Credit System Hook
Build `useCredits.ts`:
- Fetch user's credit balance and tier
- Check if specific opportunity is already revealed
- `revealOpportunity(id)` function that calls edge function
- Real-time subscription to credit changes
- Return: `credits`, `tier`, `isRevealed(id)`, `canReveal`, `revealOpportunity`

### Step 3: Reveal Edge Function
Create `reveal-opportunity`:
- Verify user authentication
- Check if already revealed (idempotent)
- Check if user has credits (or unlimited tier)
- Deduct credit and record reveal
- Return opportunity details

### Step 4: Update Opportunity Display
Modify `OpportunityCard.tsx`:
- Check if opportunity is revealed for current user
- If not revealed: show blurred/hidden seller info
- Replace "Contact" button with "Reveal" button
- On reveal: call credit hook, update UI

Modify `MapSidebar.tsx`:
- Same logic for source URL reveal
- "View Listing" becomes "Reveal Listing"

### Step 5: Sound Effects
- Add MP3 files to public folder (will use free notification sounds)
- Create `useNotificationSound.ts` hook
- Integrate with `useNotifications.ts` realtime subscription
- Respect user's sound preference from profile

### Step 6: Service Worker & Push
- Create `public/sw.js` with push event handler
- Create `pushNotifications.ts` for subscription management
- Add permission request UI in settings
- Create `send-push` edge function
- Integrate with notification trigger in database

### Step 7: UI Polish
- Add `CreditsBadge` to Navbar showing "X credits remaining"
- Create `UpgradeModal` with tier comparison
- Add sound/push toggles to user settings

---

## Technical Details

### Credit Tier Logic
```text
get_monthly_limit(tier):
  free     -> 1
  basic    -> 5
  standard -> 10
  hustler  -> unlimited (999999)
```

### Monthly Credit Reset
A scheduled database function will run monthly to:
1. Reset `credits_used_this_month` to 0
2. Set `credits_remaining` to tier limit
3. Update `subscription_started_at`

### Push Notification Flow
```text
1. User enables push -> Browser asks permission
2. Permission granted -> Generate subscription
3. Send subscription to backend -> Store in push_subscriptions
4. High-value deal created -> DB trigger calls send-push function
5. send-push iterates eligible users -> Sends via Web Push API
```

### Security Considerations
- Reveal logic runs on edge function (server-side) to prevent credit bypass
- RLS ensures users can only see their own credits and reveals
- Opportunity data without reveal returns masked values from API
- Push subscription only works for authenticated users

---

## Verification Points

After implementation:
1. Sound plays when new high-value notification arrives
2. Push notification appears when app is in background
3. Clicking push opens app and shows the deal
4. Seller details are hidden until revealed
5. Reveal button deducts 1 credit
6. Once revealed, opportunity stays revealed permanently
7. Credits badge updates in real-time
8. Users cannot reveal more than their tier allows
9. Upgrade modal shows when out of credits

---

## Future Considerations (Not in this build)
- Stripe payment integration for tier upgrades
- Credit purchase as one-time packs
- Admin panel to manually add credits
- Analytics on reveal conversion rates
