import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('Received admin message webhook:', body)

    // Extract data from the webhook payload
    const {
      type,
      conversation_id,
      customer_id,
      user_email,
      message,
      timestamp
    } = body

    if (type !== 'admin_message') {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Forward to n8n webhook
    const n8nWebhookUrl = 'https://webhook.n8n.lovable.app/webhook/e0d2da47-edb2-4b59-8ae1-2dbe6e6a1e9a'
    
    const n8nPayload = {
      type: 'admin_response',
      conversation_id,
      customer_id,
      user_email,
      admin_message: message,
      timestamp,
      source: 'admin_inbox'
    }

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload)
    })

    if (!n8nResponse.ok) {
      console.error('Failed to send to n8n:', await n8nResponse.text())
      throw new Error('Failed to forward to n8n')
    }

    console.log('Successfully forwarded admin message to n8n')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin message forwarded to n8n successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in admin message webhook:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})