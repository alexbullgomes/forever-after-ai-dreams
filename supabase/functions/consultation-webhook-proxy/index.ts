import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

// Restrict CORS to specific origins for security
const ALLOWED_ORIGINS = [
  'https://everafter.lovable.app',
  'https://hmdnronxajctsrlgrhey.lovableproject.com',
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '', // Set dynamically based on request origin
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function getCorsHeaders(origin: string | null): Record<string, string> {
  // Check if origin is in allowed list, or allow localhost for development
  const isAllowed = origin && (
    ALLOWED_ORIGINS.includes(origin) || 
    origin.includes('localhost') ||
    origin.includes('127.0.0.1')
  );
  
  return {
    ...corsHeaders,
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
  };
}

const WEBHOOK_URL = 'https://agcreationmkt.cloud/webhook/bb88400e-5a7e-47a4-89a1-d8f7171f3238';

// Simple in-memory rate limiting (resets on function restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
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

  console.log('[consultation-webhook-proxy] Received request');

  try {
    // Initialize Supabase client for auth validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const authHeader = req.headers.get('authorization');
    
    // Determine rate limit identifier
    let rateLimitId: string;
    
    if (authHeader?.startsWith('Bearer ')) {
      // Authenticated request - validate token and use user ID for rate limiting
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const token = authHeader.replace('Bearer ', '');
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error || !data.user) {
        console.log('[consultation-webhook-proxy] Invalid auth token');
        return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
          status: 401,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }
      
      rateLimitId = `user:${data.user.id}`;
      console.log('[consultation-webhook-proxy] Authenticated user:', data.user.id);
    } else {
      // Unauthenticated request - use IP for rate limiting (more restrictive)
      const clientIP = req.headers.get('x-forwarded-for') || 
                       req.headers.get('x-real-ip') || 
                       'unknown';
      rateLimitId = `ip:${clientIP}`;
      console.log('[consultation-webhook-proxy] Anonymous request from:', clientIP);
    }
    
    // Check rate limit
    if (!checkRateLimit(rateLimitId)) {
      console.log('[consultation-webhook-proxy] Rate limit exceeded for:', rateLimitId);
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
        status: 429,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const payload = await req.json();
    
    // Basic payload validation
    if (!payload || typeof payload !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid payload format' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('[consultation-webhook-proxy] Payload received:', JSON.stringify(payload));

    // Forward to n8n webhook (server-to-server, bypasses CORS)
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('[consultation-webhook-proxy] Webhook response status:', response.status);
    console.log('[consultation-webhook-proxy] Webhook response:', responseText);

    // Try to parse as JSON, otherwise return as-is
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText || 'Submission received' };
    }

    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[consultation-webhook-proxy] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
