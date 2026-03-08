import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

async function verifyAdminUser(req: Request): Promise<{ userId: string } | { error: string; status: number }> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return { error: 'Missing or invalid authorization header', status: 401 };
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: 'Unauthorized', status: 401 };
  const userId = user.id;
  const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin', { _user_id: userId });
  if (roleError) return { error: 'Failed to verify user role', status: 500 };
  if (!isAdmin) return { error: 'Admin access required', status: 403 };
  return { userId };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { batch_size = 10 } = await req.json();

    console.log('Process listings initiated by admin user:', authResult.userId);

    const { data: rawListings, error: fetchError } = await supabase
      .from('raw_listings')
      .select('*')
      .eq('processed', false)
      .limit(batch_size);

    if (fetchError) throw new Error(`Failed to fetch raw listings: ${fetchError.message}`);

    if (!rawListings || rawListings.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No unprocessed listings found', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${rawListings.length} listings`);

    const { data: regionalPricing } = await supabase
      .from('regional_pricing')
      .select('county, asset_type, average_price, min_price, max_price');

    let processed = 0;
    const results: { listing_id: string; opportunity_id: string; title: string }[] = [];

    for (const listing of rawListings) {
      try {
        // Scrape with markdown + screenshot metadata to get images
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: listing.source_url,
            formats: ['markdown', 'links'],
            onlyMainContent: true,
            location: { country: 'KE', languages: ['en', 'sw'] },
          }),
        });

        const scrapeData = await scrapeResponse.json();
        if (!scrapeData.success) {
          console.error(`Failed to scrape ${listing.source_url}:`, scrapeData.error);
          continue;
        }

        const pageContent = scrapeData.data?.markdown || scrapeData.markdown || '';
        const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};
        const pageLinks = scrapeData.data?.links || scrapeData.links || [];

        // Extract og:image from metadata as fallback
        const ogImage = metadata.ogImage || metadata['og:image'] || metadata.image || null;

        // Find image URLs from page links (common image extensions)
        const imageLinksFromPage = pageLinks.filter((link: string) =>
          /\.(jpg|jpeg|png|webp|avif)/i.test(link) &&
          !/logo|icon|favicon|avatar|placeholder|banner|sprite/i.test(link)
        );

        let analysisResult = null;
        const isAuction = listing.raw_data?.platform_type === 'auction' ||
          listing.source_url?.toLowerCase().includes('auction');

        if (lovableApiKey) {
          const auctionGuidance = isAuction ? `
AUCTION LISTING GUIDELINES:
- This is an AUCTION listing - the listed_price is typically the starting bid or reserve price
- Estimate the likely hammer price at 60-85% of retail market value
- Factor in buyer's premium (typically 5-10%) in your cost calculations` : '';

          const aiPrompt = `You are a Kenyan real estate and vehicle market expert. Analyze this listing and extract structured data.
${auctionGuidance}

LISTING CONTENT:
${pageContent.slice(0, 4000)}

IMAGE URLs FOUND ON PAGE:
${imageLinksFromPage.slice(0, 10).join('\n')}

OG:IMAGE: ${ogImage || 'none'}

REGIONAL PRICING DATA (for reference):
${JSON.stringify(regionalPricing?.slice(0, 20) || [], null, 2)}

Extract and return a JSON object with these fields:
{
  "asset_type": "vehicle" | "residential" | "commercial",
  "title": "listing title",
  "description": "brief description",
  "listed_price": number in KES${isAuction ? ' (starting bid or reserve price)' : ''},
  "estimated_value": number in KES (your estimate of true market value),
  "county": "county name",
  "city": "city/town name or null",
  "seller_name": "seller name or null",
  "seller_contact": "phone/email or null",
  "ai_confidence_score": 0-100,
  "image_url": "the BEST primary photo URL of the actual item from the page (not a logo/icon/placeholder). Pick from the IMAGE URLs or OG:IMAGE above. Return null if none found.",
  "improvement_recommendations": [
    {"item": "improvement name", "description": "what to do", "estimated_cost": number, "potential_value_add": number, "priority": "low"|"medium"|"high"}
  ]${isAuction ? `,
  "auction_details": {
    "starting_bid": number or null,
    "reserve_price": number or null,
    "estimated_hammer_price": number,
    "buyers_premium_percent": 5-10
  }` : ''}
}

If you cannot extract the price, use 0. If location is unclear, default to "Nairobi".
Return ONLY the JSON object, no other text.`;

          try {
            const aiResponse = await fetch('https://api.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${lovableApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [{ role: 'user', content: aiPrompt }],
                response_format: { type: 'json_object' },
              }),
            });

            const aiData = await aiResponse.json();
            const aiContent = aiData.choices?.[0]?.message?.content;
            if (aiContent) analysisResult = JSON.parse(aiContent);
          } catch (aiError) {
            console.error('AI analysis error:', aiError);
          }
        }

        // Determine image: AI-extracted > og:image > first page image > null
        const imageUrl = analysisResult?.image_url || ogImage || imageLinksFromPage[0] || null;

        const listedPrice = analysisResult?.listed_price || 0;
        const estimatedValue = analysisResult?.estimated_value || listedPrice;

        let effectiveCost = listedPrice;
        if (isAuction && analysisResult?.auction_details) {
          const buyersPremium = (analysisResult.auction_details.buyers_premium_percent || 7) / 100;
          effectiveCost = listedPrice * (1 + buyersPremium);
        }

        const profitPotential = estimatedValue - effectiveCost;
        const profitPercentage = effectiveCost > 0 ? ((profitPotential / effectiveCost) * 100) : 0;
        const improvements = analysisResult?.improvement_recommendations || [];
        const improvementCost = improvements.reduce(
          (sum: number, rec: { estimated_cost?: number }) => sum + (rec.estimated_cost || 0), 0
        );

        const opportunity = {
          asset_type: analysisResult?.asset_type || listing.raw_data?.platform_type || 'residential',
          title: analysisResult?.title || metadata.title || 'Untitled Listing',
          description: analysisResult?.description || pageContent.slice(0, 500),
          listed_price: listedPrice,
          estimated_value: estimatedValue,
          profit_potential: profitPotential,
          profit_percentage: profitPercentage,
          county: analysisResult?.county || 'Nairobi',
          city: analysisResult?.city || null,
          seller_name: analysisResult?.seller_name || null,
          seller_contact: analysisResult?.seller_contact || null,
          source_url: listing.source_url,
          source_platform: isAuction ? `Auction: ${listing.raw_data?.source || 'Unknown'}` : (listing.raw_data?.source || 'Unknown'),
          ai_confidence_score: analysisResult?.ai_confidence_score || 50,
          improvement_recommendations: improvements,
          improvement_cost_estimate: improvementCost,
          net_profit_potential: profitPotential - improvementCost,
          image_url: imageUrl,
          status: 'new',
          scraped_at: new Date().toISOString(),
        };

        const { data: newOpportunity, error: insertError } = await supabase
          .from('opportunities')
          .insert(opportunity)
          .select()
          .single();

        if (insertError) { console.error('Error inserting opportunity:', insertError); continue; }

        await supabase
          .from('raw_listings')
          .update({ processed: true, parsed_data: analysisResult, opportunity_id: newOpportunity.id })
          .eq('id', listing.id);

        await supabase.rpc('increment_job_processed', { p_job_id: listing.job_id });

        processed++;
        results.push({ listing_id: listing.id, opportunity_id: newOpportunity.id, title: opportunity.title });
      } catch (listingError) {
        console.error(`Error processing listing ${listing.id}:`, listingError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in process-listings:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
