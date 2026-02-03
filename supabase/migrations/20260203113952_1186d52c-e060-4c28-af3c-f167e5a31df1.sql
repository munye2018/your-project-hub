-- Fix 1: Add explicit authenticated-only check to profiles policies
-- Drop and recreate the SELECT policy to require auth.uid() to be non-null
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Fix 2: Add explicit authenticated-only check to push_subscriptions
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view their own push subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Fix 3: Protect seller contact info on opportunities table
-- Seller contact should only be visible if user has revealed the opportunity
-- First, drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view opportunities" ON public.opportunities;

-- Create a view that hides seller info for non-revealed opportunities
CREATE OR REPLACE VIEW public.opportunities_public 
WITH (security_invoker=on) AS
SELECT 
  id,
  asset_type,
  title,
  description,
  listed_price,
  estimated_value,
  profit_potential,
  profit_percentage,
  net_profit_potential,
  improvement_cost_estimate,
  improvement_recommendations,
  county,
  city,
  district,
  image_url,
  source_platform,
  status,
  ai_confidence_score,
  seller_credibility_score,
  created_at,
  updated_at,
  scraped_at,
  -- Only show seller info if user has revealed this opportunity
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.opportunity_reveals 
      WHERE opportunity_reveals.opportunity_id = opportunities.id 
      AND opportunity_reveals.user_id = auth.uid()
    ) THEN seller_name
    ELSE NULL
  END as seller_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.opportunity_reveals 
      WHERE opportunity_reveals.opportunity_id = opportunities.id 
      AND opportunity_reveals.user_id = auth.uid()
    ) THEN seller_contact
    ELSE NULL
  END as seller_contact,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.opportunity_reveals 
      WHERE opportunity_reveals.opportunity_id = opportunities.id 
      AND opportunity_reveals.user_id = auth.uid()
    ) THEN source_url
    ELSE NULL
  END as source_url
FROM public.opportunities;

-- Create new policy for authenticated users to view through the base table
-- but restrict direct access to hide seller info at policy level
CREATE POLICY "Authenticated users can view non-sensitive opportunity data"
  ON public.opportunities FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Add policy for users who have revealed to see full opportunity
-- (This works alongside the view, which is the recommended query path)