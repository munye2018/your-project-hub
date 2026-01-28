import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Get unprocessed raw listings
    const { data: rawListings, error: fetchError } = await supabase
      .from('raw_listings')
      .select('*')
      .eq('processed', false)
      .limit(batch_size);

    if (fetchError) {
      throw new Error(`Failed to fetch raw listings: ${fetchError.message}`);
    }

    if (!rawListings || rawListings.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No unprocessed listings found', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${rawListings.length} listings`);

    // Get regional pricing for AI context
    const { data: regionalPricing } = await supabase
      .from('regional_pricing')
      .select('county, asset_type, average_price, min_price, max_price');

    let processed = 0;
    const results = [];

    for (const listing of rawListings) {
      try {
        // Scrape the actual listing page
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: listing.source_url,
            formats: ['markdown'],
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

        // Use AI to analyze the listing
        let analysisResult = null;
        
        if (lovableApiKey) {
          const aiPrompt = `You are a Kenyan real estate and vehicle market expert. Analyze this listing and extract structured data.

LISTING CONTENT:
${pageContent.slice(0, 4000)}

REGIONAL PRICING DATA (for reference):
${JSON.stringify(regionalPricing?.slice(0, 20) || [], null, 2)}

Extract and return a JSON object with these fields:
{
  "asset_type": "vehicle" | "residential" | "commercial",
  "title": "listing title",
  "description": "brief description",
  "listed_price": number in KES,
  "estimated_value": number in KES (your estimate of true market value),
  "county": "county name",
  "city": "city/town name or null",
  "seller_name": "seller name or null",
  "seller_contact": "phone/email or null",
  "ai_confidence_score": 0-100,
  "improvement_recommendations": [
    {"item": "improvement name", "description": "what to do", "estimated_cost": number, "potential_value_add": number, "priority": "low"|"medium"|"high"}
  ]
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
            
            if (aiContent) {
              analysisResult = JSON.parse(aiContent);
            }
          } catch (aiError) {
            console.error('AI analysis error:', aiError);
          }
        }

        // Create opportunity from analysis or use basic extraction
        const listedPrice = analysisResult?.listed_price || 0;
        const estimatedValue = analysisResult?.estimated_value || listedPrice;
        const profitPotential = estimatedValue - listedPrice;
        const profitPercentage = listedPrice > 0 ? ((profitPotential / listedPrice) * 100) : 0;
        const improvements = analysisResult?.improvement_recommendations || [];
        const improvementCost = improvements.reduce(
          (sum: number, rec: { estimated_cost?: number }) => sum + (rec.estimated_cost || 0), 
          0
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
          source_platform: listing.raw_data?.source || 'Unknown',
          ai_confidence_score: analysisResult?.ai_confidence_score || 50,
          improvement_recommendations: improvements,
          improvement_cost_estimate: improvementCost,
          net_profit_potential: profitPotential - improvementCost,
          status: 'new',
          scraped_at: new Date().toISOString(),
        };

        // Insert opportunity
        const { data: newOpportunity, error: insertError } = await supabase
          .from('opportunities')
          .insert(opportunity)
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting opportunity:', insertError);
          continue;
        }

        // Update raw listing as processed
        await supabase
          .from('raw_listings')
          .update({
            processed: true,
            parsed_data: analysisResult,
            opportunity_id: newOpportunity.id,
          })
          .eq('id', listing.id);

        // Update job items_processed count
        await supabase.rpc('increment_job_processed', { job_id: listing.job_id });

        processed++;
        results.push({
          listing_id: listing.id,
          opportunity_id: newOpportunity.id,
          title: opportunity.title,
        });

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
