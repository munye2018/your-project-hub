import { supabase } from '@/integrations/supabase/client';

type FirecrawlResponse<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

type ScrapeOptions = {
  formats?: ('markdown' | 'html' | 'rawHtml' | 'links' | 'screenshot')[];
  onlyMainContent?: boolean;
  waitFor?: number;
};

type MapOptions = {
  search?: string;
  limit?: number;
  includeSubdomains?: boolean;
};

export const firecrawlApi = {
  // Scrape a single URL
  async scrape(url: string, options?: ScrapeOptions): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
      body: { url, options },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  // Map a website to discover all URLs
  async map(url: string, options?: MapOptions): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-map', {
      body: { url, options },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  // Trigger marketplace scraping
  async scrapeMarketplace(sourceId?: string, limit?: number): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('scrape-marketplace', {
      body: { source_id: sourceId, limit },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  // Process raw listings with AI
  async processListings(batchSize?: number): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('process-listings', {
      body: { batch_size: batchSize },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },
};
