
# Stripe Subscription Integration Plan

## Overview
Create the Hustler tier Stripe product and implement a complete Stripe checkout flow with subscription verification and management.

---

## Phase 1: Create Hustler Stripe Product

Create the final subscription tier in Stripe:

| Tier | Product Name | Price (KES) | Stripe Amount (cents) | Features |
|------|--------------|-------------|----------------------|----------|
| Hustler | Hustler | 1,999/mo | 199900 | Unlimited reveals |

---

## Phase 2: Stripe Products Configuration

Create a tier configuration file to map Stripe products to app tiers:

**File: `src/config/stripe.ts`**

```text
+-- Tier mapping object
|   +-- basic: { price_id, product_id, credits: 5 }
|   +-- standard: { price_id, product_id, credits: 10 }
|   +-- hustler: { price_id, product_id, credits: unlimited }
```

This centralizes all Stripe product IDs and tier information.

---

## Phase 3: Backend Functions

### 3.1 Create Checkout Function
**File: `supabase/functions/create-checkout/index.ts`**

Creates a Stripe checkout session for authenticated users:
- Accepts `price_id` parameter
- Looks up or creates Stripe customer by email
- Creates checkout session with success/cancel URLs
- Returns session URL for redirect

### 3.2 Subscription Verification Function
**File: `supabase/functions/check-subscription/index.ts`**

Verifies user subscription status from Stripe:
- Queries Stripe by user email
- Returns subscription status, product ID, and end date
- Used on login, page load, and periodically

### 3.3 Customer Portal Function
**File: `supabase/functions/customer-portal/index.ts`**

Enables subscription management:
- Creates Stripe billing portal session
- Allows users to cancel, upgrade, or manage payment methods

---

## Phase 4: Frontend Integration

### 4.1 Subscription Hook
**File: `src/hooks/useSubscription.ts`**

New hook to manage subscription state:
- Calls `check-subscription` on auth changes
- Tracks subscribed status, tier, and end date
- Auto-refreshes every 60 seconds
- Provides `checkout()` and `openPortal()` methods

### 4.2 Update AuthContext
**File: `src/hooks/useAuth.tsx`**

Add subscription state to auth context:
- Store subscription tier from Stripe
- Sync with `user_credits` table on subscription changes
- Make subscription info available app-wide

### 4.3 Update UpgradeModal
**File: `src/components/credits/UpgradeModal.tsx`**

Connect to Stripe checkout:
- Replace placeholder `handleSelectPlan` with real checkout
- Add loading state during checkout creation
- Handle errors gracefully
- Show "Manage Subscription" button for subscribed users

### 4.4 Subscription Success Page
**File: `src/pages/SubscriptionSuccess.tsx`**

Handle post-checkout redirect:
- Show success message
- Trigger subscription verification
- Update local credit state
- Redirect to dashboard

---

## Phase 5: Database Sync

When subscription changes are detected:
1. Update `user_credits.subscription_tier` based on Stripe product
2. Reset `credits_remaining` to tier limit
3. Update `subscription_started_at` timestamp

---

## Config File Update

**File: `supabase/config.toml`**

Add new functions:
```text
[functions.create-checkout]
verify_jwt = false

[functions.check-subscription]
verify_jwt = false

[functions.customer-portal]
verify_jwt = false
```

---

## Subscription Flow Diagram

```text
User clicks "Select Plan"
         |
         v
UpgradeModal calls create-checkout
         |
         v
Edge function creates Stripe session
         |
         v
User redirected to Stripe Checkout
         |
         v
User completes payment
         |
         v
Redirected to /subscription-success
         |
         v
check-subscription called
         |
         v
user_credits table updated
         |
         v
Credits badge shows new tier
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/config/stripe.ts` | Create |
| `supabase/functions/create-checkout/index.ts` | Create |
| `supabase/functions/check-subscription/index.ts` | Create |
| `supabase/functions/customer-portal/index.ts` | Create |
| `src/hooks/useSubscription.ts` | Create |
| `src/pages/SubscriptionSuccess.tsx` | Create |
| `src/components/credits/UpgradeModal.tsx` | Modify |
| `src/hooks/useAuth.tsx` | Modify |
| `src/App.tsx` | Modify (add route) |
| `supabase/config.toml` | Modify |

---

## Technical Notes

- STRIPE_SECRET_KEY is already configured in backend secrets
- All edge functions use CORS headers for browser compatibility
- JWT validation happens in code (verify_jwt = false in config)
- Checkout opens in new tab by default for better UX
- Customer Portal requires activation in Stripe Dashboard first
