import { useState } from 'react';
import { Eye, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCredits } from '@/hooks/useCredits';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { UpgradeModal } from './UpgradeModal';

interface RevealButtonProps {
  opportunityId: string;
  onRevealed?: () => void;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export function RevealButton({
  opportunityId,
  onRevealed,
  variant = 'default',
  size = 'sm',
  className,
  children,
}: RevealButtonProps) {
  const { isRevealed, canReveal, revealOpportunity, revealing, credits } = useCredits();
  const { toast } = useToast();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const revealed = isRevealed(opportunityId);

  const handleReveal = async () => {
    if (revealed) return;

    if (!canReveal()) {
      setShowUpgrade(true);
      return;
    }

    const result = await revealOpportunity(opportunityId);

    if (result.success) {
      toast({
        title: 'Details revealed!',
        description: 'You can now see the seller information.',
      });
      onRevealed?.();
    } else {
      if (result.error?.includes('upgrade')) {
        setShowUpgrade(true);
      } else {
        toast({
          title: 'Failed to reveal',
          description: result.error || 'Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  if (revealed) {
    return null; // Don't show button if already revealed
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn('gap-1.5', className)}
        onClick={handleReveal}
        disabled={revealing}
      >
        {revealing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : canReveal() ? (
          <Eye className="h-4 w-4" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
        {children || (canReveal() ? 'Reveal' : 'Upgrade to Reveal')}
      </Button>

      <UpgradeModal
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        currentTier={credits?.subscription_tier || 'free'}
      />
    </>
  );
}
