import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      conversation_id, 
      content, 
      audio_url = null, 
      type = 'text',
      user_name = null,
      user_email = null 
    } = await req.json();

    console.log('Received chat response:', { conversation_id, content, type });

    if (!conversation_id || !content) {
      throw new Error('Missing required fields: conversation_id and content');
    }

    // Get the conversation mode to determine the role
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('mode')
      .eq('id', conversation_id)
      .single();

    if (convError) {
      console.error('Error fetching conversation:', convError);
      throw new Error('Failed to fetch conversation mode');
    }

    const role = 'ai'; // Always use 'ai' for responses

    // Insert the AI/human response message
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        user_id: null, // AI/human responses don't have a user_id
        role: role, // Use the conversation mode as the role
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
      throw new Error('Failed to insert message');
    }

    console.log('Successfully inserted message with role:', role);

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
  } catch (error) {
    console.error('Error in chat-response function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});