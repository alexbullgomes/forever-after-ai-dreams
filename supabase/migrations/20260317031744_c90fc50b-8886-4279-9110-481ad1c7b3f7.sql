
-- Step 1: Add metadata JSONB column to messages
ALTER TABLE messages ADD COLUMN metadata jsonb DEFAULT NULL;

-- Step 2: Add attribution columns to conversations
ALTER TABLE conversations
  ADD COLUMN page_path text DEFAULT NULL,
  ADD COLUMN page_type text DEFAULT NULL,
  ADD COLUMN campaign_slug text DEFAULT NULL,
  ADD COLUMN referral_code text DEFAULT NULL;

-- Step 3: Add affiliate conversations toggle to profiles
ALTER TABLE profiles
  ADD COLUMN can_access_affiliate_conversations boolean NOT NULL DEFAULT false;

-- Step 4: Update emit_message_webhook trigger to include metadata in payload
CREATE OR REPLACE FUNCTION public.emit_message_webhook()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  conv_record RECORD;
  source_type TEXT;
  v_user_id UUID;
  v_visitor_id TEXT;
  webhook_url TEXT := 'https://agcreationmkt.cloud/webhook/79834679-8b0e-4dfb-9fbe-408593849da1';
  payload JSONB;
BEGIN
  -- Only emit for user messages (not AI/human responses)
  IF NEW.role != 'user' THEN
    RETURN NEW;
  END IF;

  -- Get conversation details for mode only
  SELECT id, mode, customer_id
  INTO conv_record
  FROM conversations 
  WHERE id = NEW.conversation_id;

  IF conv_record IS NULL THEN
    RAISE NOTICE '[emit_message_webhook] No conversation found for message %', NEW.id;
    RETURN NEW;
  END IF;

  -- Determine source type - use visitor_id from message row directly
  IF NEW.visitor_id IS NOT NULL THEN
    source_type := 'visitor';
    v_user_id := NULL;
    v_visitor_id := NEW.visitor_id;
  ELSIF conv_record.customer_id IS NOT NULL THEN
    source_type := 'authenticated';
    v_user_id := conv_record.customer_id::UUID;
    v_visitor_id := NULL;
  ELSE
    -- Fallback: check conversations.visitor_id for legacy messages
    SELECT visitor_id INTO v_visitor_id 
    FROM conversations 
    WHERE id = NEW.conversation_id;
    
    source_type := CASE WHEN v_visitor_id IS NOT NULL THEN 'visitor' ELSE 'unknown' END;
    v_user_id := NULL;
  END IF;

  -- Build unified payload with visitor_id directly from message
  payload := jsonb_build_object(
    'source', source_type,
    'message', jsonb_build_object(
      'id', NEW.id,
      'conversation_id', NEW.conversation_id,
      'visitor_id', NEW.visitor_id,
      'role', NEW.role,
      'type', NEW.type,
      'content', NEW.content,
      'audio_url', NEW.audio_url,
      'created_at', NEW.created_at,
      'user_name', NEW.user_name,
      'user_email', NEW.user_email,
      'metadata', NEW.metadata
    ),
    'user_id', v_user_id,
    'visitor_id', v_visitor_id,
    'conversation', jsonb_build_object(
      'id', conv_record.id,
      'mode', conv_record.mode
    )
  );

  -- Send async webhook via pg_net (fire and forget)
  PERFORM net.http_post(
    url := webhook_url,
    body := payload,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );

  RAISE NOTICE '[emit_message_webhook] Webhook sent for message % (source: %, visitor_id: %)', NEW.id, source_type, COALESCE(v_visitor_id, 'null');

  RETURN NEW;
END;
$function$;
