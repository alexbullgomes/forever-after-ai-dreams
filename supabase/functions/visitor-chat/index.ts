import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// N8N webhook URL for AI responses - uses test endpoint
const N8N_WEBHOOK_URL = Deno.env.get('N8N_VISITOR_CHAT_WEBHOOK') 
  || "https://agcreationmkt.cloud/webhook-test/067583ff-25ca-4f0a-8f67-15d18e8a1264";

interface VisitorChatRequest {
  action: 'send_message' | 'get_conversation' | 'get_messages';
  visitor_id: string;
  content?: string;
  type?: 'text' | 'audio';
  audio_url?: string;
  visitor_name?: string;
}

interface Message {
  id: number;
  conversation_id: string;
  role: string;
  type: string;
  content: string | null;
  audio_url: string | null;
  created_at: string;
  user_name: string | null;
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
    
    const body: VisitorChatRequest = await req.json();
    const { action, visitor_id, content, type, audio_url, visitor_name } = body;

    console.log(`[visitor-chat] Action: ${action}, Visitor: ${visitor_id}`);

    // Validate visitor_id format (should be UUID-like)
    if (!visitor_id || visitor_id.length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid visitor_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'get_conversation': {
        // Find existing conversation by visitor_id
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('visitor_id', visitor_id)
          .maybeSingle();

        if (convError) {
          console.error('[visitor-chat] Error fetching conversation:', convError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to fetch conversation' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!conversation) {
          // No existing conversation
          return new Response(
            JSON.stringify({ 
              success: true, 
              conversation_id: null, 
              messages: [],
              mode: 'ai'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Fetch messages for this conversation
        const { data: messages, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true });

        if (msgError) {
          console.error('[visitor-chat] Error fetching messages:', msgError);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            conversation_id: conversation.id,
            messages: messages || [],
            mode: conversation.mode || 'ai'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'send_message': {
        if (!content && !audio_url) {
          return new Response(
            JSON.stringify({ success: false, error: 'Message content required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get or create conversation
        let conversationId: string;
        let conversationMode: string = 'ai';

        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id, mode')
          .eq('visitor_id', visitor_id)
          .maybeSingle();

        if (existingConv) {
          conversationId = existingConv.id;
          conversationMode = existingConv.mode || 'ai';
        } else {
          // Create new conversation for visitor
          const { data: newConv, error: createError } = await supabase
            .from('conversations')
            .insert({
              visitor_id: visitor_id,
              customer_id: null,
              user_name: visitor_name || 'Visitor',
              user_email: null,
              mode: 'ai',
              new_msg: 'unread'
            })
            .select()
            .single();

          if (createError) {
            console.error('[visitor-chat] Error creating conversation:', createError);
            return new Response(
              JSON.stringify({ success: false, error: 'Failed to create conversation' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          conversationId = newConv.id;
          conversationMode = 'ai';
          console.log(`[visitor-chat] Created new conversation: ${conversationId}`);
        }

        // Insert user message
        const { data: userMsg, error: insertError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: 'user',
            type: type || 'text',
            content: content || null,
            audio_url: audio_url || null,
            user_name: 'Visitor',
            new_msg: 'unread'
          })
          .select()
          .single();

        if (insertError) {
          console.error('[visitor-chat] Error inserting message:', insertError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to save message' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[visitor-chat] Saved user message: ${userMsg.id}, mode: ${conversationMode}`);

        // Update conversation new_msg status
        await supabase
          .from('conversations')
          .update({ new_msg: 'unread' })
          .eq('id', conversationId);

        // If in AI mode, forward to n8n and get response
        if (conversationMode === 'ai') {
          try {
            console.log('[visitor-chat] Forwarding to n8n...');
            
            const n8nPayload = {
              message: content,
              visitorId: visitor_id,
              conversationId: conversationId,
              messageType: type || 'text',
              audioUrl: audio_url || null,
              timestamp: new Date().toISOString()
            };

            const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(n8nPayload)
            });

            let aiResponseText = "Thank you for your message! I'm here to help you with photography and videography services.";
            
            if (n8nResponse.ok) {
              const n8nData = await n8nResponse.json();
              aiResponseText = n8nData.output || n8nData.response || n8nData.message || aiResponseText;
              console.log('[visitor-chat] Got n8n response');
            } else {
              console.error('[visitor-chat] n8n error:', n8nResponse.status);
            }

            // Insert AI response
            const { data: aiMsg, error: aiError } = await supabase
              .from('messages')
              .insert({
                conversation_id: conversationId,
                role: 'ai',
                type: 'text',
                content: aiResponseText,
                user_name: 'EVA',
                new_msg: 'unread'
              })
              .select()
              .single();

            if (aiError) {
              console.error('[visitor-chat] Error saving AI response:', aiError);
            }

            return new Response(
              JSON.stringify({ 
                success: true,
                conversation_id: conversationId,
                message_id: userMsg.id,
                ai_response: aiResponseText,
                ai_message_id: aiMsg?.id
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } catch (n8nError) {
            console.error('[visitor-chat] n8n fetch error:', n8nError);
            
            // Return success but with default response
            return new Response(
              JSON.stringify({ 
                success: true,
                conversation_id: conversationId,
                message_id: userMsg.id,
                ai_response: "Thank you for your message! Our team will get back to you soon."
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        // Human mode - just confirm message saved, no AI response
        return new Response(
          JSON.stringify({ 
            success: true,
            conversation_id: conversationId,
            message_id: userMsg.id,
            mode: 'human'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_messages': {
        // Find conversation first
        const { data: conversation } = await supabase
          .from('conversations')
          .select('id, mode')
          .eq('visitor_id', visitor_id)
          .maybeSingle();

        if (!conversation) {
          return new Response(
            JSON.stringify({ success: true, messages: [], mode: 'ai' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: messages, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('[visitor-chat] Error fetching messages:', error);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to fetch messages' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            conversation_id: conversation.id,
            messages: messages || [],
            mode: conversation.mode || 'ai'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[visitor-chat] Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
