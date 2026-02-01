-- Create user_credits table for subscription tiers and credit management
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  credits_remaining INTEGER NOT NULL DEFAULT 1,
  credits_used_this_month INTEGER NOT NULL DEFAULT 0,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'standard', 'hustler')),
  subscription_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create opportunity_reveals table to track which opportunities users have revealed
CREATE TABLE public.opportunity_reveals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  revealed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  credits_spent INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id, opportunity_id)
);

-- Create push_subscriptions table for browser push notifications
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Add sound_enabled and push_enabled columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT false;

-- Enable RLS on all new tables
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_reveals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_credits
CREATE POLICY "Users can view their own credits"
ON public.user_credits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
ON public.user_credits FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for opportunity_reveals
CREATE POLICY "Users can view their own reveals"
ON public.opportunity_reveals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reveals"
ON public.opportunity_reveals FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for push_subscriptions
CREATE POLICY "Users can view their own push subscriptions"
ON public.push_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own push subscriptions"
ON public.push_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions"
ON public.push_subscriptions FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster credit lookups
CREATE INDEX idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX idx_opportunity_reveals_user_id ON public.opportunity_reveals(user_id);
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- Function to auto-create credits row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, credits_remaining, subscription_tier)
  VALUES (NEW.id, 1, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create credits on profile creation
CREATE TRIGGER on_profile_created_add_credits
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();

-- Function to get monthly credit limit based on tier
CREATE OR REPLACE FUNCTION public.get_tier_credit_limit(tier TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE tier
    WHEN 'free' THEN 1
    WHEN 'basic' THEN 5
    WHEN 'standard' THEN 10
    WHEN 'hustler' THEN 999999
    ELSE 1
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Updated timestamp trigger for user_credits
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for push_subscriptions (needed for push notification triggers)
ALTER PUBLICATION supabase_realtime ADD TABLE public.push_subscriptions;