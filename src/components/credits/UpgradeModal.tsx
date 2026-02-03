import { Check, Sparkles, Zap, Crown, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SubscriptionTier } from '@/types/opportunity';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier: SubscriptionTier;
}

interface TierInfo {
  name: string;
  tier: SubscriptionTier;
  reveals: string;
  price: string;
  priceNote?: string;
  icon: React.ReactNode;
  features: string[];
  popular?: boolean;
}

const tiers: TierInfo[] = [
  {
    name: 'Free',
    tier: 'free',
    reveals: '1',
    price: 'KES 0',
    priceNote: 'forever',
    icon: <Star className="h-5 w-5" />,
    features: [
      '1 reveal per month',
      'Browse all opportunities',
      'Basic notifications',
    ],
  },
  {
    name: 'Basic',
    tier: 'basic',
    reveals: '5',
    price: 'KES 500',
    priceNote: '/month',
    icon: <Zap className="h-5 w-5" />,
    features: [
      '5 reveals per month',
      'Browse all opportunities',
      'Email notifications',
      'Priority support',
    ],
  },
  {
    name: 'Standard',
    tier: 'standard',
    reveals: '10',
    price: 'KES 1,000',
    priceNote: '/month',
    icon: <Crown className="h-5 w-5" />,
    features: [
      '10 reveals per month',
      'Browse all opportunities',
      'Push notifications',
      'Priority support',
      'Early access to deals',
    ],
    popular: true,
  },
  {
    name: 'Hustler',
    tier: 'hustler',
    reveals: 'Unlimited',
    price: 'KES 1,999',
    priceNote: '/month',
    icon: <Sparkles className="h-5 w-5" />,
    features: [
      'Unlimited reveals',
      'Browse all opportunities',
      'All notification channels',
      'VIP support',
      'First access to premium deals',
      'Market insights & analytics',
    ],
  },
];

export function UpgradeModal({ open, onOpenChange, currentTier }: UpgradeModalProps) {
  const handleSelectPlan = (tier: SubscriptionTier) => {
    // TODO: Integrate with Stripe or other payment processor
    console.log('Selected plan:', tier);
    // For now, just show a message
    alert(`Payment integration coming soon! Selected: ${tier} plan`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription className="text-center">
            Get more reveals to unlock seller details and close more deals
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {tiers.map((tierInfo) => {
            const isCurrent = tierInfo.tier === currentTier;
            const isDowngrade = getTierRank(tierInfo.tier) < getTierRank(currentTier);

            return (
              <div
                key={tierInfo.tier}
                className={cn(
                  'relative rounded-xl border p-5 flex flex-col',
                  tierInfo.popular && 'border-primary shadow-lg ring-1 ring-primary',
                  isCurrent && 'bg-muted/50'
                )}
              >
                {tierInfo.popular && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    tierInfo.tier === 'hustler' && 'bg-primary/10 text-primary',
                    tierInfo.tier === 'standard' && 'bg-amber-500/10 text-amber-500',
                    tierInfo.tier === 'basic' && 'bg-blue-500/10 text-blue-500',
                    tierInfo.tier === 'free' && 'bg-muted text-muted-foreground',
                  )}>
                    {tierInfo.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{tierInfo.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {tierInfo.reveals} reveals/mo
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-bold">{tierInfo.price}</span>
                  {tierInfo.priceNote && (
                    <span className="text-sm text-muted-foreground">
                      {tierInfo.priceNote}
                    </span>
                  )}
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {tierInfo.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={tierInfo.popular ? 'default' : 'outline'}
                  className="w-full"
                  disabled={isCurrent || isDowngrade}
                  onClick={() => handleSelectPlan(tierInfo.tier)}
                >
                  {isCurrent ? 'Current Plan' : isDowngrade ? 'Downgrade' : 'Select Plan'}
                </Button>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          All plans include a 7-day money-back guarantee. Cancel anytime.
        </p>
      </DialogContent>
    </Dialog>
  );
}

function getTierRank(tier: SubscriptionTier): number {
  const ranks: Record<SubscriptionTier, number> = {
    free: 0,
    basic: 1,
    standard: 2,
    hustler: 3,
  };
  return ranks[tier];
}
