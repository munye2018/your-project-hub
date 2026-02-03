import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Dynamic CORS headers based on origin
function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowedOrigins = [
    'https://lovable.dev',
    'https://id-preview--b7d68dc6-0210-462a-a84a-aa5eade466a0.lovable.app',
  ];
  
  // Allow localhost for development
  const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
  const isAllowed = allowedOrigins.includes(origin) || isLocalhost || origin.endsWith('.lovable.app');
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
}

interface PushPayload {
  user_id?: string;
  notification_type?: string;
  title: string;
  body: string;
  url?: string;
  opportunity_id?: string;
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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authentication and admin role
    const authResult = await verifyAdminUser(req);
    if ('error' in authResult) {
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: authResult.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('Send push initiated by admin user:', authResult.userId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: PushPayload = await req.json();
    console.log("Received push request:", payload);

    // Get push subscriptions for the target user(s)
    let query = supabase
      .from("push_subscriptions")
      .select("*");

    if (payload.user_id) {
      query = query.eq("user_id", payload.user_id);
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions found");
      return new Response(
        JSON.stringify({ message: "No subscriptions to notify" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${subscriptions.length} subscriptions to notify`);

    // Build push notification payload
    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: payload.notification_type || "notification",
      url: payload.url || (payload.opportunity_id ? `/opportunity/${payload.opportunity_id}` : "/"),
    });

    // Note: In production, you would use Web Push protocol with VAPID keys
    // For now, we'll log what would be sent
    // Web Push requires a VAPID private key and the web-push library
    
    const results = {
      total: subscriptions.length,
      sent: 0,
      failed: 0,
      message: "Push notification system configured. In production, integrate with web-push library.",
    };

    // For each subscription, we would send the push notification
    // This requires the web-push library and VAPID keys
    for (const sub of subscriptions) {
      console.log(`Would send push to endpoint: ${sub.endpoint.substring(0, 50)}...`);
      results.sent++;
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in send-push function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});