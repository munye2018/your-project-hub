-- First, drop the existing platform_type check constraint
ALTER TABLE scraping_sources DROP CONSTRAINT IF EXISTS scraping_sources_platform_type_check;

-- Add new constraint that includes 'auction' type
ALTER TABLE scraping_sources ADD CONSTRAINT scraping_sources_platform_type_check 
  CHECK (platform_type IN ('vehicle', 'residential', 'commercial', 'general', 'auction'));

-- Add 5 reputable Kenyan auctioneer sources
INSERT INTO scraping_sources (name, platform_type, base_url, config, scrape_frequency, is_active)
VALUES 
  ('Garam Auctions', 'auction', 'https://garamauctions.co.ke', 
   '{"search_paths": ["/vehicles", "/properties", "/auctions"]}', 'daily', true),
  ('Boni & Co Auctioneers', 'auction', 'https://boniandco.co.ke',
   '{"search_paths": ["/auctions", "/upcoming"]}', 'daily', true),
  ('Imperial Auctioneers', 'auction', 'https://imperialauctioneers.co.ke',
   '{"search_paths": ["/vehicles", "/property"]}', 'daily', true),
  ('Sohani & Co', 'auction', 'https://sohaniandco.co.ke',
   '{"search_paths": ["/auctions"]}', 'weekly', true),
  ('Nyandarua Auctioneers', 'auction', 'https://nyandaruaauctioneers.co.ke',
   '{"search_paths": ["/auctions", "/vehicles"]}', 'daily', true);