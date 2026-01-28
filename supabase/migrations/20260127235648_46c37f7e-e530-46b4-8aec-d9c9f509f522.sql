-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  preferred_regions TEXT[] DEFAULT '{}',
  preferred_asset_types TEXT[] DEFAULT '{}',
  alert_frequency TEXT DEFAULT 'instant' CHECK (alert_frequency IN ('instant', 'daily', 'weekly')),
  whatsapp_number TEXT,
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create opportunities table
CREATE TABLE public.opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('vehicle', 'residential', 'commercial')),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  listed_price NUMERIC NOT NULL,
  estimated_value NUMERIC NOT NULL,
  profit_potential NUMERIC GENERATED ALWAYS AS (estimated_value - listed_price) STORED,
  profit_percentage NUMERIC GENERATED ALWAYS AS (
    CASE WHEN listed_price > 0 THEN ((estimated_value - listed_price) / listed_price * 100) ELSE 0 END
  ) STORED,
  county TEXT NOT NULL,
  city TEXT,
  district TEXT,
  seller_name TEXT,
  seller_contact TEXT,
  seller_credibility_score NUMERIC CHECK (seller_credibility_score >= 0 AND seller_credibility_score <= 10),
  source_url TEXT,
  source_platform TEXT,
  improvement_recommendations JSONB DEFAULT '[]',
  improvement_cost_estimate NUMERIC DEFAULT 0,
  net_profit_potential NUMERIC GENERATED ALWAYS AS (estimated_value - listed_price - COALESCE(improvement_cost_estimate, 0)) STORED,
  ai_confidence_score NUMERIC CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 100),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'negotiating', 'closed', 'dismissed')),
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create saved_opportunities table for user bookmarks
CREATE TABLE public.saved_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, opportunity_id)
);

-- Create regional_pricing table for valuation data
CREATE TABLE public.regional_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  county TEXT NOT NULL,
  city TEXT,
  district TEXT,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('vehicle', 'residential', 'commercial')),
  asset_category TEXT,
  average_price NUMERIC NOT NULL,
  min_price NUMERIC,
  max_price NUMERIC,
  sample_size INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('new_opportunity', 'price_drop', 'high_value', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kenya_counties reference table
CREATE TABLE public.kenya_counties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  capital TEXT,
  population INTEGER,
  area_km2 NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kenya_counties ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Opportunities policies (all authenticated users can view)
CREATE POLICY "Authenticated users can view opportunities" ON public.opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage opportunities" ON public.opportunities FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Saved opportunities policies
CREATE POLICY "Users can view their saved opportunities" ON public.saved_opportunities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save opportunities" ON public.saved_opportunities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove saved opportunities" ON public.saved_opportunities FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their saved opportunities" ON public.saved_opportunities FOR UPDATE USING (auth.uid() = user_id);

-- Regional pricing policies (all authenticated users can view)
CREATE POLICY "Authenticated users can view regional pricing" ON public.regional_pricing FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage regional pricing" ON public.regional_pricing FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Kenya counties policies (public read)
CREATE POLICY "Anyone can view Kenya counties" ON public.kenya_counties FOR SELECT USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert Kenya counties data
INSERT INTO public.kenya_counties (name, code, capital) VALUES
('Mombasa', '001', 'Mombasa'),
('Kwale', '002', 'Kwale'),
('Kilifi', '003', 'Kilifi'),
('Tana River', '004', 'Hola'),
('Lamu', '005', 'Lamu'),
('Taita-Taveta', '006', 'Voi'),
('Garissa', '007', 'Garissa'),
('Wajir', '008', 'Wajir'),
('Mandera', '009', 'Mandera'),
('Marsabit', '010', 'Marsabit'),
('Isiolo', '011', 'Isiolo'),
('Meru', '012', 'Meru'),
('Tharaka-Nithi', '013', 'Chuka'),
('Embu', '014', 'Embu'),
('Kitui', '015', 'Kitui'),
('Machakos', '016', 'Machakos'),
('Makueni', '017', 'Wote'),
('Nyandarua', '018', 'Ol Kalou'),
('Nyeri', '019', 'Nyeri'),
('Kirinyaga', '020', 'Kerugoya'),
('Muranga', '021', 'Muranga'),
('Kiambu', '022', 'Kiambu'),
('Turkana', '023', 'Lodwar'),
('West Pokot', '024', 'Kapenguria'),
('Samburu', '025', 'Maralal'),
('Trans-Nzoia', '026', 'Kitale'),
('Uasin Gishu', '027', 'Eldoret'),
('Elgeyo-Marakwet', '028', 'Iten'),
('Nandi', '029', 'Kapsabet'),
('Baringo', '030', 'Kabarnet'),
('Laikipia', '031', 'Nanyuki'),
('Nakuru', '032', 'Nakuru'),
('Narok', '033', 'Narok'),
('Kajiado', '034', 'Kajiado'),
('Kericho', '035', 'Kericho'),
('Bomet', '036', 'Bomet'),
('Kakamega', '037', 'Kakamega'),
('Vihiga', '038', 'Vihiga'),
('Bungoma', '039', 'Bungoma'),
('Busia', '040', 'Busia'),
('Siaya', '041', 'Siaya'),
('Kisumu', '042', 'Kisumu'),
('Homa Bay', '043', 'Homa Bay'),
('Migori', '044', 'Migori'),
('Kisii', '045', 'Kisii'),
('Nyamira', '046', 'Nyamira'),
('Nairobi', '047', 'Nairobi');