export type SubscriptionTier = 'free' | 'basic' | 'standard' | 'hustler';

interface TierConfig {
  price_id: string;
  product_id: string;
  credits: number | 'unlimited';
  name: string;
  priceKES: number;
}

export const stripeTiers: Record<Exclude<SubscriptionTier, 'free'>, TierConfig> = {
  basic: {
    price_id: 'price_1Sw12VFKBHwNpuXdKmGw2Ekm',
    product_id: 'prod_TuVfapXCr3TfEf',
    credits: 5,
    name: 'Basic',
    priceKES: 500,
  },
  standard: {
    price_id: 'price_1SwiDmFKBHwNpuXd9Wa7EKCr',
    product_id: 'prod_TuXIxKdtDng1aG',
    credits: 10,
    name: 'Standard',
    priceKES: 1000,
  },
  hustler: {
    price_id: 'price_1Sxc9HFKBHwNpuXduOpiG4tB',
    product_id: 'prod_TvT518qrqw4Dzd',
    credits: 'unlimited',
    name: 'Hustler',
    priceKES: 1999,
  },
};

export function getTierFromProductId(productId: string): SubscriptionTier {
  for (const [tier, config] of Object.entries(stripeTiers)) {
    if (config.product_id === productId) {
      return tier as SubscriptionTier;
    }
  }
  return 'free';
}

export function getTierCredits(tier: SubscriptionTier): number {
  if (tier === 'free') return 1;
  const config = stripeTiers[tier];
  return config.credits === 'unlimited' ? 999999 : config.credits;
}
