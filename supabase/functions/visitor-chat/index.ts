import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VisitorChatRequest {
  action: 'send_message' | 'get_conversation' | 'get_messages';
  visitor_id: string;
  content?: string;
  type?: 'text' | 'audio';
  audio_url?: string;
  audio_data?: string; // Base64 encoded audio for upload
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

// Upload visitor audio to Supabase Storage
async function uploadVisitorAudio(
  supabase: any,
  visitorId: string,
  audioData: string
): Promise<string | null> {
  try {
    console.log('[visitor-chat] Uploading audio for visitor:', visitorId);
    
    // Handle data URL format: data:audio/webm;codecs=opus;base64,XXXXX
    // or data:audio/webm;base64,XXXXX
    let base64Content = audioData;
    
    // Find the base64 marker and extract content after it
    const base64Marker = ';base64,';
    const markerIndex = audioData.indexOf(base64Marker);
    
    if (markerIndex !== -1) {
      base64Content = audioData.substring(markerIndex + base64Marker.length);
    } else if (audioData.startsWith('data:')) {
      // Fallback: try comma separator
      const commaIndex = audioData.indexOf(',');
      if (commaIndex !== -1) {
        base64Content = audioData.substring(commaIndex + 1);
      }
    }
    
    console.log('[visitor-chat] Base64 content length:', base64Content.length);
    
    // Decode base64 to binary
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Generate unique file path
    const timestamp = Date.now();
    const filePath = `visitor-${visitorId}/${timestamp}.webm`;
    
    // Upload to storage using service role (bypasses RLS)
    const { error: uploadError } = await supabase.storage
      .from('chat-audios')
      .upload(filePath, bytes, {
        contentType: 'audio/webm',
        upsert: false
      });
    
    if (uploadError) {
      console.error('[visitor-chat] Audio upload error:', uploadError);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('chat-audios')
      .getPublicUrl(filePath);
    
    console.log('[visitor-chat] Audio uploaded successfully:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('[visitor-chat] Error uploading audio:', error);
    return null;
  }
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
    const { action, visitor_id, content, type, audio_url, audio_data, visitor_name } = body;

    console.log(`[visitor-chat] Action: ${action}, Visitor: ${visitor_id}, Type: ${type || 'text'}`);

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
        if (!content && !audio_url && !audio_data) {
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

        // Handle audio upload if audio_data is provided
        let finalAudioUrl: string | null = audio_url || null;
        if (audio_data && type === 'audio') {
          console.log('[visitor-chat] Processing audio upload...');
          finalAudioUrl = await uploadVisitorAudio(supabase, visitor_id, audio_data);
          if (!finalAudioUrl) {
            console.error('[visitor-chat] Failed to upload audio, continuing with null URL');
          }
        }

        // Insert user message - Database trigger will emit webhook to n8n
        const { data: userMsg, error: insertError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: 'user',
            type: type || 'text',
            content: content || null,
            audio_url: finalAudioUrl,
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

        console.log(`[visitor-chat] Saved user message: ${userMsg.id}, mode: ${conversationMode}, audio_url: ${finalAudioUrl || 'none'}`);
        console.log('[visitor-chat] Database trigger will handle webhook emission to n8n');

        // Update conversation new_msg status
        await supabase
          .from('conversations')
          .update({ new_msg: 'unread' })
          .eq('id', conversationId);

        // Return immediately - database trigger handles webhook, n8n will call chat-webhook-callback for AI response
        return new Response(
          JSON.stringify({ 
            success: true,
            conversation_id: conversationId,
            message_id: userMsg.id,
            audio_url: finalAudioUrl,
            mode: conversationMode
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
