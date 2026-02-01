import { Coins, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCredits } from '@/hooks/useCredits';
import { cn } from '@/lib/utils';

interface CreditsBadgeProps {
  onUpgradeClick?: () => void;
  className?: string;
}

export function CreditsBadge({ onUpgradeClick, className }: CreditsBadgeProps) {
  const { credits, loading } = useCredits();

  if (loading || !credits) {
    return null;
  }

  const isUnlimited = credits.subscription_tier === 'hustler';
  const isLow = !isUnlimited && credits.credits_remaining <= 1;
  const isEmpty = !isUnlimited && credits.credits_remaining === 0;

  const tierLabels: Record<string, string> = {
    free: 'Free',
    basic: 'Basic',
    standard: 'Standard',
    hustler: 'Hustler',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'gap-1.5 h-8 px-2',
              isEmpty && 'text-destructive hover:text-destructive',
              isLow && !isEmpty && 'text-warning hover:text-warning',
              className
            )}
            onClick={onUpgradeClick}
          >
            {isUnlimited ? (
              <>
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">Unlimited</span>
              </>
            ) : (
              <>
                <Coins className="h-4 w-4" />
                <span className="text-xs font-medium">{credits.credits_remaining}</span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-center">
          <p className="font-medium">{tierLabels[credits.subscription_tier]} Plan</p>
          {isUnlimited ? (
            <p className="text-xs text-muted-foreground">Unlimited reveals</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {credits.credits_remaining} reveal{credits.credits_remaining !== 1 ? 's' : ''} remaining
            </p>
          )}
          {isEmpty && (
            <p className="text-xs text-primary mt-1">Click to upgrade</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
