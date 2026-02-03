
# Update Standard Tier Price to KES 1,000

## Overview
Change the Standard subscription tier price from KES 900 to KES 1,000.

---

## Changes Required

### 1. Update UpgradeModal.tsx
Update the price display for the Standard tier:

| Location | Current Value | New Value |
|----------|---------------|-----------|
| Line 63 | `'KES 900'` | `'KES 1,000'` |

### 2. Create Standard Stripe Product
When implementing the Stripe integration, the Standard tier product will be created with:
- **Price**: 100,000 cents (KES 1,000)
- **Currency**: KES
- **Interval**: Monthly

---

## Summary
This is a simple pricing update that affects:
- The UI display in the upgrade modal
- The Stripe product price (to be created)

The Basic tier stays at KES 500 and the Hustler tier stays at KES 1,999.
