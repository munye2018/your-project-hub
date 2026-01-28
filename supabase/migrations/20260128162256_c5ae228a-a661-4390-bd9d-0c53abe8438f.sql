-- Add geographic coordinates to kenya_counties
ALTER TABLE kenya_counties ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE kenya_counties ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Update kenya_counties with actual coordinates for all 47 counties
UPDATE kenya_counties SET latitude = -1.2921, longitude = 36.8219 WHERE code = '047'; -- Nairobi
UPDATE kenya_counties SET latitude = -4.0435, longitude = 39.6682 WHERE code = '001'; -- Mombasa
UPDATE kenya_counties SET latitude = -0.0917, longitude = 34.7680 WHERE code = '042'; -- Kisumu
UPDATE kenya_counties SET latitude = 0.5143, longitude = 35.2698 WHERE code = '027'; -- Uasin Gishu (Eldoret)
UPDATE kenya_counties SET latitude = -0.2827, longitude = 36.0662 WHERE code = '032'; -- Nakuru
UPDATE kenya_counties SET latitude = -1.5177, longitude = 37.2634 WHERE code = '022'; -- Machakos
UPDATE kenya_counties SET latitude = -3.2192, longitude = 40.1169 WHERE code = '002'; -- Kwale
UPDATE kenya_counties SET latitude = -2.2717, longitude = 40.9020 WHERE code = '003'; -- Kilifi
UPDATE kenya_counties SET latitude = -1.7480, longitude = 40.2679 WHERE code = '004'; -- Tana River
UPDATE kenya_counties SET latitude = -2.0780, longitude = 41.4532 WHERE code = '005'; -- Lamu
UPDATE kenya_counties SET latitude = -2.6286, longitude = 40.4627 WHERE code = '006'; -- Taita-Taveta
UPDATE kenya_counties SET latitude = 1.7500, longitude = 40.0667 WHERE code = '007'; -- Garissa
UPDATE kenya_counties SET latitude = 0.4612, longitude = 39.6460 WHERE code = '008'; -- Wajir
UPDATE kenya_counties SET latitude = 3.9373, longitude = 41.8569 WHERE code = '009'; -- Mandera
UPDATE kenya_counties SET latitude = 0.3556, longitude = 37.5833 WHERE code = '010'; -- Marsabit
UPDATE kenya_counties SET latitude = 1.7500, longitude = 37.9167 WHERE code = '011'; -- Isiolo
UPDATE kenya_counties SET latitude = 0.0500, longitude = 37.6500 WHERE code = '012'; -- Meru
UPDATE kenya_counties SET latitude = -0.0985, longitude = 37.6419 WHERE code = '013'; -- Tharaka-Nithi
UPDATE kenya_counties SET latitude = -0.5388, longitude = 37.3827 WHERE code = '014'; -- Embu
UPDATE kenya_counties SET latitude = -0.6817, longitude = 37.1500 WHERE code = '015'; -- Kitui
UPDATE kenya_counties SET latitude = -1.0333, longitude = 37.0833 WHERE code = '016'; -- Makueni
UPDATE kenya_counties SET latitude = -0.9667, longitude = 37.0667 WHERE code = '017'; -- Nyandarua
UPDATE kenya_counties SET latitude = -0.6167, longitude = 37.1500 WHERE code = '018'; -- Nyeri
UPDATE kenya_counties SET latitude = -0.4544, longitude = 36.9628 WHERE code = '019'; -- Kirinyaga
UPDATE kenya_counties SET latitude = -0.7167, longitude = 37.1500 WHERE code = '020'; -- Murang'a
UPDATE kenya_counties SET latitude = -1.0396, longitude = 37.0900 WHERE code = '021'; -- Kiambu
UPDATE kenya_counties SET latitude = 2.5000, longitude = 36.0000 WHERE code = '023'; -- Turkana
UPDATE kenya_counties SET latitude = 1.7500, longitude = 35.5000 WHERE code = '024'; -- West Pokot
UPDATE kenya_counties SET latitude = 1.0333, longitude = 35.0000 WHERE code = '025'; -- Samburu
UPDATE kenya_counties SET latitude = 0.5167, longitude = 35.3000 WHERE code = '026'; -- Trans-Nzoia
UPDATE kenya_counties SET latitude = 0.5167, longitude = 35.2833 WHERE code = '028'; -- Elgeyo-Marakwet
UPDATE kenya_counties SET latitude = 0.5000, longitude = 35.9500 WHERE code = '029'; -- Nandi
UPDATE kenya_counties SET latitude = 0.0833, longitude = 35.5000 WHERE code = '030'; -- Baringo
UPDATE kenya_counties SET latitude = 0.0500, longitude = 36.0833 WHERE code = '031'; -- Laikipia
UPDATE kenya_counties SET latitude = -0.9167, longitude = 35.5000 WHERE code = '033'; -- Narok
UPDATE kenya_counties SET latitude = -0.3667, longitude = 35.7333 WHERE code = '034'; -- Kajiado
UPDATE kenya_counties SET latitude = -0.7000, longitude = 35.1000 WHERE code = '035'; -- Kericho
UPDATE kenya_counties SET latitude = -0.5000, longitude = 35.0000 WHERE code = '036'; -- Bomet
UPDATE kenya_counties SET latitude = -0.3500, longitude = 34.7500 WHERE code = '037'; -- Kakamega
UPDATE kenya_counties SET latitude = -0.3333, longitude = 34.4833 WHERE code = '038'; -- Vihiga
UPDATE kenya_counties SET latitude = 0.4500, longitude = 34.1167 WHERE code = '039'; -- Bungoma
UPDATE kenya_counties SET latitude = 0.5667, longitude = 34.5500 WHERE code = '040'; -- Busia
UPDATE kenya_counties SET latitude = -0.6817, longitude = 34.7667 WHERE code = '041'; -- Siaya
UPDATE kenya_counties SET latitude = -0.5000, longitude = 34.4500 WHERE code = '043'; -- Homa Bay
UPDATE kenya_counties SET latitude = -1.0667, longitude = 34.6000 WHERE code = '044'; -- Migori
UPDATE kenya_counties SET latitude = -0.6833, longitude = 34.7667 WHERE code = '045'; -- Kisii
UPDATE kenya_counties SET latitude = -0.8167, longitude = 34.8833 WHERE code = '046'; -- Nyamira

-- Create scraping_sources table
CREATE TABLE public.scraping_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  platform_type TEXT NOT NULL CHECK (platform_type IN ('vehicle', 'residential', 'commercial', 'general')),
  base_url TEXT NOT NULL,
  scrape_frequency TEXT NOT NULL DEFAULT 'daily' CHECK (scrape_frequency IN ('hourly', 'daily', 'weekly')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scraping_jobs table
CREATE TABLE public.scraping_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES public.scraping_sources(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  items_found INTEGER DEFAULT 0,
  items_processed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create raw_listings table
CREATE TABLE public.raw_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.scraping_jobs(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  raw_data JSONB NOT NULL,
  parsed_data JSONB,
  processed BOOLEAN NOT NULL DEFAULT false,
  opportunity_id UUID REFERENCES public.opportunities(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.scraping_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin users can manage scraping (check role in profiles)
CREATE POLICY "Admins can manage scraping sources"
ON public.scraping_sources
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can manage scraping jobs"
ON public.scraping_jobs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can manage raw listings"
ON public.raw_listings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow authenticated users to read scraping sources (for dashboard stats)
CREATE POLICY "Authenticated users can view scraping sources"
ON public.scraping_sources
FOR SELECT
USING (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX idx_scraping_jobs_source_id ON public.scraping_jobs(source_id);
CREATE INDEX idx_scraping_jobs_status ON public.scraping_jobs(status);
CREATE INDEX idx_raw_listings_job_id ON public.raw_listings(job_id);
CREATE INDEX idx_raw_listings_processed ON public.raw_listings(processed);
CREATE INDEX idx_kenya_counties_coords ON public.kenya_counties(latitude, longitude);

-- Add updated_at trigger for scraping_sources
CREATE TRIGGER update_scraping_sources_updated_at
BEFORE UPDATE ON public.scraping_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial scraping sources for Kenyan marketplaces
INSERT INTO public.scraping_sources (name, platform_type, base_url, scrape_frequency, config) VALUES
('Cheki Kenya', 'vehicle', 'https://www.cheki.co.ke', 'daily', '{"search_paths": ["/cars-for-sale", "/motorbikes-for-sale"]}'),
('BuyRentKenya', 'residential', 'https://www.buyrentkenya.com', 'daily', '{"search_paths": ["/houses-for-sale", "/apartments-for-sale"]}'),
('JiJi Kenya', 'general', 'https://jiji.co.ke', 'daily', '{"search_paths": ["/cars", "/houses-apartments-for-sale"]}'),
('Property24 Kenya', 'residential', 'https://www.property24.co.ke', 'daily', '{"search_paths": ["/for-sale"]}'),
('PigiaMe', 'general', 'https://www.pigiame.co.ke', 'weekly', '{"search_paths": ["/cars", "/property"]}');