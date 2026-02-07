import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

// Restrict CORS to specific origins for security
const ALLOWED_ORIGINS = [
  'https://everafter.lovable.app',
  'https://everafter-studio.lovable.app',
  'https://hmdnronxajctsrlgrhey.lovableproject.com',
  'https://everafterca.com',
  'https://www.everafterca.com',
];

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && (
    ALLOWED_ORIGINS.includes(origin) || 
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.endsWith('.lovable.app') ||
    origin.endsWith('.lovableproject.com')
  );
  
  return {
    ...corsHeaders,
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
  };
}

// Webhook URL mapping - stored securely in environment variables
// Fallback to hardcoded for initial deployment, then remove after secrets are set
const WEBHOOK_URLS: Record<string, string | undefined> = {
  homepage_chat: Deno.env.get('N8N_HOMEPAGE_CHAT_WEBHOOK') || 'https://agcreationmkt.cloud/webhook/067583ff-25ca-4f0a-8f67-15d18e8a1264',
  auth_events: Deno.env.get('N8N_AUTH_EVENTS_WEBHOOK') || 'https://agcreationmkt.cloud/webhook/3d243bf4-c682-4903-a4b7-08bb9ef98b04',
  quiz_completion: Deno.env.get('N8N_QUIZ_WEBHOOK') || 'https://agcreationmkt.cloud/webhook/2807df9e-fe4b-4ee0-a4c0-e357960d1c31',
  consultation_form: Deno.env.get('N8N_QUIZ_CONSULTATION_WEBHOOK') || 'https://agcreationmkt.cloud/webhook/36fb4d39-8ebe-4ab6-b781-c7d8b73cc9cb',
  gallery_lead: Deno.env.get('N8N_GALLERY_LEAD_WEBHOOK') || 'https://agcreationmkt.cloud/webhook/dc84492f-9c06-423a-b4fe-84a7e36f801f',
  contact_form: Deno.env.get('N8N_CONTACT_WEBHOOK') || 'https://agcreationmkt.cloud/webhook/8f035739-6773-4408-933c-233326195f92',
  ai_summary: Deno.env.get('N8N_AI_SUMMARY_WEBHOOK') || 'https://agcreationmkt.cloud/webhook/edc35eb2-12c7-4d57-ab83-5d7d2b2b8f42',
  visitor_summary: Deno.env.get('N8N_VISITOR_SUMMARY_WEBHOOK') || 'https://agcreationmkt.cloud/webhook/c3927752-91fc-4737-ade9-eed13cb77928',
  gallery_view: Deno.env.get('N8N_GALLERY_VIEW_WEBHOOK') || 'https://agcreationmkt.cloud/webhook/8e26e595-d079-4d4b-8c15-a31824f98aed',
  promotional_popup: Deno.env.get('N8N_PROMOTIONAL_POPUP_WEBHOOK') || 'https://agcreationmkt.cloud/webhook/0fe48135-df84-4d58-8998-11a3aafb23b7',
  ai_chat_input: Deno.env.get('N8N_AI_CHAT_INPUT_WEBHOOK') || 'https://automation.agcreationmkt.com/webhook/79834679-8b0e-4dfb-9fbe-408593849da1',
  gallery_consultation: Deno.env.get('N8N_GALLERY_CONSULTATION_WEBHOOK') || 'https://agcreationmkt.cloud/webhook/d69e4e06-c9d0-49cc-98fe-2f3a4d08c2d3',
};

// Rate limiting configuration per webhook type
const RATE_LIMITS: Record<string, { max: number; window: number }> = {
  homepage_chat: { max: 20, window: 60 * 60 * 1000 }, // 20/hour
  auth_events: { max: 10, window: 60 * 60 * 1000 }, // 10/hour
  quiz_completion: { max: 5, window: 60 * 60 * 1000 }, // 5/hour
  consultation_form: { max: 10, window: 60 * 60 * 1000 }, // 10/hour
  gallery_lead: { max: 10, window: 60 * 60 * 1000 }, // 10/hour
  contact_form: { max: 10, window: 60 * 60 * 1000 }, // 10/hour
  ai_summary: { max: 10, window: 60 * 60 * 1000 }, // 10/hour (admin only)
  visitor_summary: { max: 10, window: 60 * 60 * 1000 }, // 10/hour (admin only)
  gallery_view: { max: 30, window: 60 * 60 * 1000 }, // 30/hour
  promotional_popup: { max: 5, window: 60 * 60 * 1000 }, // 5/hour
  ai_chat_input: { max: 20, window: 60 * 60 * 1000 }, // 20/hour
  gallery_consultation: { max: 10, window: 60 * 60 * 1000 }, // 10/hour
};

// Webhook types that require admin authentication
const ADMIN_ONLY_WEBHOOKS = ['ai_summary', 'visitor_summary'];

// Simple in-memory rate limiting (resets on function restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string, webhookType: string): boolean {
  const now = Date.now();
  const key = `${webhookType}:${identifier}`;
  const limits = RATE_LIMITS[webhookType] || { max: 10, window: 60 * 60 * 1000 };
  
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + limits.window });
    return true;
  }
  
  if (record.count >= limits.max) {
    return false;
  }
  
  record.count++;
  return true;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const headers = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  console.log('[webhook-proxy] Received request');

  try {
    // Parse request body
    const body = await req.json();
    const webhookType = body.webhook_type || req.headers.get('x-webhook-type');
    const payload = body.payload || body;

    if (!webhookType) {
      console.log('[webhook-proxy] Missing webhook_type');
      return new Response(JSON.stringify({ error: 'Missing webhook_type' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Get webhook URL
    const webhookUrl = WEBHOOK_URLS[webhookType];
    if (!webhookUrl) {
      console.log('[webhook-proxy] Unknown webhook type:', webhookType);
      return new Response(JSON.stringify({ error: 'Unknown webhook type' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client for auth validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('authorization');
    
    let rateLimitId: string;
    let userId: string | null = null;
    let isAdmin = false;

    if (authHeader?.startsWith('Bearer ')) {
      // Authenticated request - validate token and use user ID for rate limiting
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const token = authHeader.replace('Bearer ', '');
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error || !data.user) {
        console.log('[webhook-proxy] Invalid auth token');
        // For non-admin webhooks, continue with IP-based rate limiting
        if (ADMIN_ONLY_WEBHOOKS.includes(webhookType)) {
          return new Response(JSON.stringify({ error: 'Authentication required' }), {
            status: 401,
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }
      } else {
        userId = data.user.id;
        rateLimitId = `user:${userId}`;
        
        // Check if user is admin for admin-only webhooks
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();
        
        isAdmin = profileData?.role === 'admin';
        console.log('[webhook-proxy] Authenticated user:', userId, 'isAdmin:', isAdmin);
      }
    }

    // For unauthenticated requests or failed auth, use IP
    if (!userId) {
      const clientIP = req.headers.get('x-forwarded-for') || 
                       req.headers.get('x-real-ip') || 
                       'unknown';
      rateLimitId = `ip:${clientIP}`;
      console.log('[webhook-proxy] Anonymous request from:', clientIP);
    }

    // Check admin requirement
    if (ADMIN_ONLY_WEBHOOKS.includes(webhookType) && !isAdmin) {
      console.log('[webhook-proxy] Admin access required for:', webhookType);
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Check rate limit
    if (!checkRateLimit(rateLimitId!, webhookType)) {
      console.log('[webhook-proxy] Rate limit exceeded for:', rateLimitId, webhookType);
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
        status: 429,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Basic payload validation
    if (!payload || typeof payload !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid payload format' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    console.log('[webhook-proxy] Forwarding to:', webhookType);

    // Forward to n8n webhook (server-to-server, bypasses CORS)
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('[webhook-proxy] Webhook response status:', response.status);

    // Try to parse as JSON, otherwise return as-is
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText || 'Request processed' };
    }

    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[webhook-proxy] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
