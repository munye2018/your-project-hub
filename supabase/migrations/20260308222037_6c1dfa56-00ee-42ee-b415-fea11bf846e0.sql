ALTER TABLE public.profiles 
  ADD COLUMN budget_min numeric DEFAULT 0,
  ADD COLUMN budget_max numeric DEFAULT NULL,
  ADD COLUMN onboarding_completed boolean DEFAULT false,
  ADD COLUMN user_latitude numeric DEFAULT NULL,
  ADD COLUMN user_longitude numeric DEFAULT NULL,
  ADD COLUMN search_radius_km integer DEFAULT 50;