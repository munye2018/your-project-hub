import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Dynamic CORS headers based on origin
function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowedOrigins = [
    'https://lovable.dev',
    'https://id-preview--b7d68dc6-0210-462a-a84a-aa5eade466a0.lovable.app',
  ];
  const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
  const isAllowed = allowedOrigins.includes(origin) || isLocalhost || origin.endsWith('.lovable.app');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
}

interface ScrapingSource {
  id: string;
  name: string;
  platform_type: string;
  base_url: string;
  config: { search_paths?: string[] };
}

async function verifyAdminUser(req: Request): Promise<{ userId: string } | { error: string; status: number }> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Missing or invalid authorization header', status: 401 };
  }
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: 'Unauthorized', status: 401 };
  }
  const userId = user.id;
  const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin', { _user_id: userId });
  if (roleError) return { error: 'Failed to verify user role', status: 500 };
  if (!isAdmin) return { error: 'Admin access required', status: 403 };
  return { userId };
}

// Strict filter: only keep URLs that look like individual listing pages, not category/search pages
function isIndividualListingUrl(url: string): boolean {
  const lower = url.toLowerCase();

  // --- Exclude non-listing pages ---
  const excludePatterns = [
    '/about', '/contact', '/privacy', '/terms', '/faq', '/help',
    '/login', '/register', '/signup', '/account', '/profile',
    '/category/', '/categories/', '/search', '/filter',
    '/tag/', '/tags/', '/blog/', '/news/', '/press/',
    '?page=', '&page=', '?sort=', '&sort=', '?order=', '&order=',
    '/sitemap', '/feed', '/rss',
  ];
  if (excludePatterns.some(p => lower.includes(p))) return false;

  // --- Exclude category index pages (URLs ending with broad terms) ---
  const categoryEndings = [
    '/cars', '/vehicles', '/properties', '/houses', '/apartments',
    '/listings', '/results', '/auctions', '/lots', '/sales',
    '/commercial', '/residential', '/land', '/plots',
    '/for-sale', '/for-rent', '/to-let',
  ];
  // Check if the path ends with a category term (with or without trailing slash)
  const pathOnly = lower.split('?')[0].replace(/\/$/, '');
  if (categoryEndings.some(ending => pathOnly.endsWith(ending))) return false;

  // --- Require an individual item identifier ---
  // Must have a numeric ID segment or a slug-with-ID pattern in the URL
  const hasNumericId = /\/\d{3,}/.test(url); // At least 3 digits to avoid matching year-like segments
  const hasSlugWithId = /\/[a-z0-9-]+-\d{3,}/i.test(url); // e.g. /toyota-land-cruiser-12345
  const hasItemPath = /\/(listing|item|lot|property|car|vehicle|ad|detail|view|product)\/[^/]+/i.test(url);

  return hasNumericId || hasSlugWithId || hasItemPath;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await verifyAdminUser(req);
    if ('error' in authResult) {
      return new Response(
        JSON.stringify({ success: false, error: authResult.error }),
        { status: authResult.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { source_id, limit = 50 } = await req.json();

    console.log('Scrape marketplace initiated by admin user:', authResult.userId);

    let query = supabase.from('scraping_sources').select('*').eq('is_active', true);
    if (source_id) query = query.eq('id', source_id);

    const { data: sources, error: sourcesError } = await query;
    if (sourcesError) throw new Error('Failed to fetch scraping sources');

    if (!sources || sources.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active sources found', jobs: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jobs = [];

    for (const source of sources as ScrapingSource[]) {
      console.log(`Processing source: ${source.name}`);

      const { data: job, error: jobError } = await supabase
        .from('scraping_jobs')
        .insert({ source_id: source.id, status: 'running', started_at: new Date().toISOString() })
        .select()
        .single();

      if (jobError) { console.error('Error creating job:', jobError); continue; }

      try {
        const searchPaths = source.config?.search_paths || [''];
        const allUrls: string[] = [];

        for (const path of searchPaths) {
          const mapUrl = `${source.base_url}${path}`;
          console.log(`Mapping: ${mapUrl}`);

          const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: mapUrl, limit: Math.min(limit, 100), includeSubdomains: false }),
          });

          const mapData = await mapResponse.json();
          if (mapData.success && mapData.links) {
            allUrls.push(...mapData.links.slice(0, limit));
          }
        }

        // Apply strict individual-listing filter
        const listingUrls = allUrls.filter(isIndividualListingUrl).slice(0, limit);

        console.log(`Found ${listingUrls.length} individual listings (filtered from ${allUrls.length} URLs) for ${source.name}`);

        if (listingUrls.length > 0) {
          const rawListings = listingUrls.map(url => ({
            job_id: job.id,
            source_url: url,
            raw_data: { url, source: source.name, platform_type: source.platform_type },
            processed: false,
          }));

          const { error: insertError } = await supabase.from('raw_listings').insert(rawListings);
          if (insertError) console.error('Error inserting raw listings:', insertError);
        }

        await supabase
          .from('scraping_jobs')
          .update({ status: 'completed', completed_at: new Date().toISOString(), items_found: listingUrls.length })
          .eq('id', job.id);

        await supabase
          .from('scraping_sources')
          .update({ last_scraped_at: new Date().toISOString() })
          .eq('id', source.id);

        jobs.push({ job_id: job.id, source: source.name, urls_found: listingUrls.length, status: 'completed' });
      } catch (scrapeError) {
        console.error(`Error scraping ${source.name}:`, scrapeError);
        await supabase
          .from('scraping_jobs')
          .update({ status: 'failed', completed_at: new Date().toISOString(), error_message: scrapeError instanceof Error ? scrapeError.message : 'Unknown error' })
          .eq('id', job.id);
        jobs.push({ job_id: job.id, source: source.name, status: 'failed', error: scrapeError instanceof Error ? scrapeError.message : 'Unknown error' });
      }
    }

    return new Response(
      JSON.stringify({ success: true, jobs }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scrape-marketplace:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
