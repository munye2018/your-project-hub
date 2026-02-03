-- Fix the opportunities table to properly protect seller information
-- The view opportunities_public already masks seller info based on reveals
-- But we need to ensure the base table policy is used correctly

-- Drop the existing view and recreate with proper security
DROP VIEW IF EXISTS public.opportunities_public;

-- Create a secure function to check if user has revealed an opportunity
CREATE OR REPLACE FUNCTION public.user_has_revealed_opportunity(_user_id uuid, _opportunity_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.opportunity_reveals
    WHERE user_id = _user_id
      AND opportunity_id = _opportunity_id
  )
$$;

-- Create the opportunities_public view with proper security
-- This view masks sensitive seller info unless the user has revealed the opportunity
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
    WHEN public.user_has_revealed_opportunity(auth.uid(), id) THEN seller_name
    ELSE NULL
  END as seller_name,
  CASE 
    WHEN public.user_has_revealed_opportunity(auth.uid(), id) THEN seller_contact
    ELSE NULL
  END as seller_contact,
  CASE 
    WHEN public.user_has_revealed_opportunity(auth.uid(), id) THEN source_url
    ELSE NULL
  END as source_url
FROM public.opportunities;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.opportunities_public TO authenticated;

-- Now update the base table policy to be more restrictive
-- Admins can still see everything, but regular users should use the view
DROP POLICY IF EXISTS "Authenticated users can view non-sensitive opportunity data" ON public.opportunities;

-- Create policy that only allows admins to directly query the base table
-- Regular users must use the opportunities_public view
CREATE POLICY "Only admins can directly access opportunities"
  ON public.opportunities FOR SELECT
  USING (
    public.is_admin(auth.uid())
  );