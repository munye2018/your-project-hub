import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ScrapingSource {
  id: string;
  name: string;
  platform_type: string;
  base_url: string;
  config: {
    search_paths?: string[];
  };
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

  const token = authHeader.replace('Bearer ', '');
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  
  if (claimsError || !claimsData?.claims) {
    console.error('Auth verification failed:', claimsError);
    return { error: 'Unauthorized', status: 401 };
  }

  const userId = claimsData.claims.sub as string;
  
  // Check if user has admin role using the is_admin function
  const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin', { _user_id: userId });
  
  if (roleError) {
    console.error('Role check failed:', roleError);
    return { error: 'Failed to verify user role', status: 500 };
  }

  if (!isAdmin) {
    return { error: 'Admin access required', status: 403 };
  }

  return { userId };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication and admin role
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

    // Get source configuration
    let query = supabase.from('scraping_sources').select('*').eq('is_active', true);
    if (source_id) {
      query = query.eq('id', source_id);
    }

    const { data: sources, error: sourcesError } = await query;
    if (sourcesError) {
      console.error('Error fetching sources:', sourcesError);
      throw new Error('Failed to fetch scraping sources');
    }

    if (!sources || sources.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active sources found', jobs: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jobs = [];

    for (const source of sources as ScrapingSource[]) {
      console.log(`Processing source: ${source.name}`);

      // Create a new scraping job
      const { data: job, error: jobError } = await supabase
        .from('scraping_jobs')
        .insert({
          source_id: source.id,
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (jobError) {
        console.error('Error creating job:', jobError);
        continue;
      }

      try {
        // Map the marketplace to discover URLs
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
            body: JSON.stringify({
              url: mapUrl,
              limit: Math.min(limit, 100),
              includeSubdomains: false,
            }),
          });

          const mapData = await mapResponse.json();
          if (mapData.success && mapData.links) {
            allUrls.push(...mapData.links.slice(0, limit));
          }
        }

        // Filter to likely listing URLs (not home, about, contact pages)
        const listingUrls = allUrls.filter(url => {
          const lower = url.toLowerCase();
          // Exclude common non-listing pages
          if (lower.includes('/about') || 
              lower.includes('/contact') || 
              lower.includes('/privacy') ||
              lower.includes('/terms') ||
              lower.includes('/faq') ||
              lower.includes('/help') ||
              lower.includes('/login') ||
              lower.includes('/register')) {
            return false;
          }
          // Include marketplace and auction listing patterns
          return lower.includes('/listing') || 
                 lower.includes('/property') || 
                 lower.includes('/car') ||
                 lower.includes('/vehicle') ||
                 lower.includes('/house') ||
                 lower.includes('/apartment') ||
                 // Auction-specific patterns
                 lower.includes('/lot') ||
                 lower.includes('/auction') ||
                 lower.includes('/bid') ||
                 lower.includes('/sale') ||
                 lower.includes('/hammer') ||
                 lower.includes('/item') ||
                 /\/\d+/.test(url); // URLs with IDs
        }).slice(0, limit);

        console.log(`Found ${listingUrls.length} potential listings for ${source.name}`);

        // Store raw listings for processing
        if (listingUrls.length > 0) {
          const rawListings = listingUrls.map(url => ({
            job_id: job.id,
            source_url: url,
            raw_data: { url, source: source.name, platform_type: source.platform_type },
            processed: false,
          }));

          const { error: insertError } = await supabase
            .from('raw_listings')
            .insert(rawListings);

          if (insertError) {
            console.error('Error inserting raw listings:', insertError);
          }
        }

        // Update job status
        await supabase
          .from('scraping_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            items_found: listingUrls.length,
          })
          .eq('id', job.id);

        // Update source last_scraped_at
        await supabase
          .from('scraping_sources')
          .update({ last_scraped_at: new Date().toISOString() })
          .eq('id', source.id);

        jobs.push({
          job_id: job.id,
          source: source.name,
          urls_found: listingUrls.length,
          status: 'completed',
        });

      } catch (scrapeError) {
        console.error(`Error scraping ${source.name}:`, scrapeError);
        
        await supabase
          .from('scraping_jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: scrapeError instanceof Error ? scrapeError.message : 'Unknown error',
          })
          .eq('id', job.id);

        jobs.push({
          job_id: job.id,
          source: source.name,
          status: 'failed',
          error: scrapeError instanceof Error ? scrapeError.message : 'Unknown error',
        });
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
