import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTierFromProductId, stripeTiers, type SubscriptionTier } from '@/config/stripe';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionState {
  subscribed: boolean;
  tier: SubscriptionTier;
  subscriptionEnd: string | null;
  loading: boolean;
}

export function useSubscription(userId: string | undefined) {
  const { toast } = useToast();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    tier: 'free',
    subscriptionEnd: null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!userId) {
      setState({ subscribed: false, tier: 'free', subscriptionEnd: null, loading: false });
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setState({ subscribed: false, tier: 'free', subscriptionEnd: null, loading: false });
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      const tier = data?.product_id ? getTierFromProductId(data.product_id) : 'free';
      setState({
        subscribed: data?.subscribed ?? false,
        tier,
        subscriptionEnd: data?.subscription_end ?? null,
        loading: false,
      });
    } catch (err) {
      console.error('Error checking subscription:', err);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [userId]);

  useEffect(() => {
    checkSubscription();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const checkout = async (tier: Exclude<SubscriptionTier, 'free'>) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to subscribe",
          variant: "destructive",
        });
        return;
      }

      const priceId = stripeTiers[tier].price_id;
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { price_id: priceId },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Error creating checkout:', err);
      toast({
        title: "Checkout failed",
        description: err instanceof Error ? err.message : "Failed to create checkout session",
        variant: "destructive",
      });
    }
  };

  const openPortal = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to manage subscription",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Error opening portal:', err);
      toast({
        title: "Portal unavailable",
        description: err instanceof Error ? err.message : "Failed to open billing portal",
        variant: "destructive",
      });
    }
  };

  return {
    ...state,
    checkSubscription,
    checkout,
    openPortal,
  };
}
