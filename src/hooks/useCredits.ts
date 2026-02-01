import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { UserCredits, SubscriptionTier } from '@/types/opportunity';

const TIER_LIMITS: Record<SubscriptionTier, number> = {
  free: 1,
  basic: 5,
  standard: 10,
  hustler: 999999,
};

export function useCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [revealedOpportunities, setRevealedOpportunities] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);

  // Fetch user credits and revealed opportunities
  const fetchCredits = useCallback(async () => {
    if (!user?.id) {
      setCredits(null);
      setRevealedOpportunities(new Set());
      setLoading(false);
      return;
    }

    try {
      // Fetch credits
      const { data: creditsData, error: creditsError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (creditsError) {
        console.error('Error fetching credits:', creditsError);
      }

      // If no credits row exists yet, create one
      if (!creditsData) {
        const { data: newCredits, error: insertError } = await supabase
          .from('user_credits')
          .insert({ user_id: user.id, credits_remaining: 1, subscription_tier: 'free' })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating credits:', insertError);
        } else {
          setCredits(newCredits as UserCredits);
        }
      } else {
        setCredits(creditsData as UserCredits);
      }

      // Fetch revealed opportunities
      const { data: revealsData, error: revealsError } = await supabase
        .from('opportunity_reveals')
        .select('opportunity_id')
        .eq('user_id', user.id);

      if (revealsError) {
        console.error('Error fetching reveals:', revealsError);
      } else {
        setRevealedOpportunities(new Set(revealsData?.map(r => r.opportunity_id) || []));
      }
    } catch (error) {
      console.error('Error in fetchCredits:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Check if a specific opportunity is revealed
  const isRevealed = useCallback((opportunityId: string): boolean => {
    if (!user?.id) return false;
    // Hustler tier has unlimited reveals - they see everything
    if (credits?.subscription_tier === 'hustler') return true;
    return revealedOpportunities.has(opportunityId);
  }, [user?.id, credits?.subscription_tier, revealedOpportunities]);

  // Check if user can reveal (has credits)
  const canReveal = useCallback((): boolean => {
    if (!credits) return false;
    if (credits.subscription_tier === 'hustler') return true;
    return credits.credits_remaining > 0;
  }, [credits]);

  // Get tier limit
  const getTierLimit = useCallback((tier: SubscriptionTier): number => {
    return TIER_LIMITS[tier];
  }, []);

  // Reveal an opportunity
  const revealOpportunity = useCallback(async (opportunityId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id || !credits) {
      return { success: false, error: 'Not authenticated' };
    }

    // Already revealed
    if (isRevealed(opportunityId)) {
      return { success: true };
    }

    // Check credits
    if (!canReveal()) {
      return { success: false, error: 'No credits remaining. Please upgrade your plan.' };
    }

    setRevealing(true);

    try {
      // Insert reveal record
      const { error: revealError } = await supabase
        .from('opportunity_reveals')
        .insert({
          user_id: user.id,
          opportunity_id: opportunityId,
          credits_spent: 1,
        });

      if (revealError) {
        // Check if it's a duplicate - that's okay
        if (revealError.code === '23505') {
          setRevealedOpportunities(prev => new Set([...prev, opportunityId]));
          return { success: true };
        }
        console.error('Error creating reveal:', revealError);
        return { success: false, error: 'Failed to reveal opportunity' };
      }

      // Deduct credit (only for non-hustler tiers)
      if (credits.subscription_tier !== 'hustler') {
        const { error: updateError } = await supabase
          .from('user_credits')
          .update({
            credits_remaining: credits.credits_remaining - 1,
            credits_used_this_month: credits.credits_used_this_month + 1,
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating credits:', updateError);
        }
      }

      // Update local state
      setRevealedOpportunities(prev => new Set([...prev, opportunityId]));
      setCredits(prev => prev ? {
        ...prev,
        credits_remaining: prev.subscription_tier === 'hustler' ? prev.credits_remaining : prev.credits_remaining - 1,
        credits_used_this_month: prev.subscription_tier === 'hustler' ? prev.credits_used_this_month : prev.credits_used_this_month + 1,
      } : null);

      return { success: true };
    } catch (error) {
      console.error('Error in revealOpportunity:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setRevealing(false);
    }
  }, [user?.id, credits, isRevealed, canReveal]);

  return {
    credits,
    loading,
    revealing,
    isRevealed,
    canReveal,
    getTierLimit,
    revealOpportunity,
    refetch: fetchCredits,
  };
}
