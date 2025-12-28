import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate that the user is an admin
async function validateAdminUser(supabase: any, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin'
    });
    
    if (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error('Error in validateAdminUser:', error);
    return false;
  }
}

// Simple rate limiting using in-memory store (resets on function restart)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Create service client for database operations
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT and get user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError?.message || 'No user found');
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check rate limit using user ID
    if (!checkRateLimit(user.id)) {
      console.warn(`Rate limit exceeded for user: ${user.id}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate admin role using the has_role function
    const isAdmin = await validateAdminUser(supabaseService, user.id);
    
    if (!isAdmin) {
      console.error(`Unauthorized access attempt by user: ${user.id}`);
      return new Response(
        JSON.stringify({ error: 'Admin privileges required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { 
      conversation_id, 
      content, 
      audio_url = null, 
      type = 'text',
      user_name = null,
      user_email = null 
    } = await req.json();

    console.log('Received chat response from admin:', { 
      admin_id: user.id,
      conversation_id, 
      content: content?.substring(0, 50) + '...', 
      type 
    });

    // Validate required fields
    if (!conversation_id || !content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: conversation_id and content' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate conversation_id format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversation_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid conversation_id format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate content length
    if (typeof content !== 'string' || content.length > 10000) {
      return new Response(
        JSON.stringify({ error: 'Content must be a string with max 10000 characters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the conversation mode to determine the role
    const { data: conversation, error: convError } = await supabaseService
      .from('conversations')
      .select('mode')
      .eq('id', conversation_id)
      .single();

    if (convError) {
      console.error('Error fetching conversation:', convError);
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const role = conversation.mode || 'ai';

    // Insert the AI/human response message
    const { data: message, error: insertError } = await supabaseService
      .from('messages')
      .insert({
        conversation_id,
        user_id: null,
        role: role,
        type,
        content,
        audio_url,
        user_name,
        user_email
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting message:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to insert message' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Successfully inserted message by admin:', { 
      admin_id: user.id, 
      message_id: message.id, 
      role 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: message.id,
        role: role 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error in chat-response function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
