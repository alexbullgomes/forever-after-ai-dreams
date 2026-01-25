import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Chat Webhook Callback Edge Function
 * 
 * This endpoint is called by n8n to insert AI responses back into the messages table.
 * It's the return path after the database trigger sends a message to n8n for processing.
 * 
 * Flow:
 * 1. User sends message → Frontend inserts into messages table
 * 2. Database trigger (emit_message_webhook) sends payload to n8n
 * 3. n8n processes message, generates AI response
 * 4. n8n calls this endpoint to insert AI response
 * 5. Real-time subscription notifies frontend of new message
 */

interface WebhookCallbackRequest {
  conversation_id: string;
  content: string;
  type?: 'text' | 'audio' | 'card';
  user_name?: string;
  audio_url?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body: WebhookCallbackRequest = await req.json();
    const { 
      conversation_id, 
      content, 
      type = 'text', 
      user_name = 'EVA',
      audio_url 
    } = body;

    console.log(`[chat-webhook-callback] Received callback for conversation: ${conversation_id}`);

    // Validate required fields
    if (!conversation_id) {
      console.error('[chat-webhook-callback] Missing conversation_id');
      return new Response(
        JSON.stringify({ success: false, error: 'conversation_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!content && !audio_url) {
      console.error('[chat-webhook-callback] Missing content or audio_url');
      return new Response(
        JSON.stringify({ success: false, error: 'content or audio_url is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify conversation exists
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, mode')
      .eq('id', conversation_id)
      .maybeSingle();

    if (convError) {
      console.error('[chat-webhook-callback] Error fetching conversation:', convError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to verify conversation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!conversation) {
      console.error('[chat-webhook-callback] Conversation not found:', conversation_id);
      return new Response(
        JSON.stringify({ success: false, error: 'Conversation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert AI response message
    const { data: aiMessage, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation_id,
        role: 'ai',
        type: type,
        content: content || null,
        audio_url: audio_url || null,
        user_name: user_name,
        new_msg: 'unread'
      })
      .select()
      .single();

    if (insertError) {
      console.error('[chat-webhook-callback] Error inserting AI message:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[chat-webhook-callback] AI response saved with id: ${aiMessage.id}`);

    // Update conversation new_msg status to notify frontend
    await supabase
      .from('conversations')
      .update({ new_msg: 'unread' })
      .eq('id', conversation_id);

    // Broadcast the message to the conversation channel
    // This enables real-time updates for visitors who can't use postgres_changes due to RLS
    console.log(`[chat-webhook-callback] Broadcasting message to channel: chat:${conversation_id}`);
    try {
      const broadcastChannel = supabase.channel(`chat:${conversation_id}`);
      
      const subscribePromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Subscribe timeout')), 5000);
        broadcastChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            resolve();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(timeout);
            reject(new Error(`Subscribe failed: ${status}`));
          }
        });
      });
      
      await subscribePromise;
      
      await broadcastChannel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: {
          id: aiMessage.id,
          conversation_id: conversation_id,
          role: 'ai',
          type: type,
          content: content || null,
          audio_url: audio_url || null,
          user_name: user_name,
          created_at: aiMessage.created_at
        }
      });
      
      console.log(`[chat-webhook-callback] Broadcast sent successfully`);
      await supabase.removeChannel(broadcastChannel);
    } catch (broadcastError) {
      // Log but don't fail - the message is already saved
      console.error('[chat-webhook-callback] Broadcast error (non-fatal):', broadcastError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: aiMessage.id,
        conversation_id: conversation_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[chat-webhook-callback] Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
