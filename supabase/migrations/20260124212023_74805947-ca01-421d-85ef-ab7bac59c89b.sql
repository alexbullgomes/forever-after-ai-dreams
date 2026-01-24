-- Enable pg_net extension for async HTTP calls (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to emit unified webhook on message insert
CREATE OR REPLACE FUNCTION public.emit_message_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- Get conversation details
  SELECT id, mode, customer_id, visitor_id 
  INTO conv_record
  FROM conversations 
  WHERE id = NEW.conversation_id;

  IF conv_record IS NULL THEN
    RAISE NOTICE '[emit_message_webhook] No conversation found for message %', NEW.id;
    RETURN NEW;
  END IF;

  -- Determine source type and IDs
  IF conv_record.customer_id IS NOT NULL THEN
    source_type := 'authenticated';
    v_user_id := conv_record.customer_id::UUID;
    v_visitor_id := NULL;
  ELSE
    source_type := 'visitor';
    v_user_id := NULL;
    v_visitor_id := conv_record.visitor_id;
  END IF;

  -- Build unified payload mirroring messages table schema
  payload := jsonb_build_object(
    'source', source_type,
    'message', jsonb_build_object(
      'id', NEW.id,
      'conversation_id', NEW.conversation_id,
      'role', NEW.role,
      'type', NEW.type,
      'content', NEW.content,
      'audio_url', NEW.audio_url,
      'created_at', NEW.created_at,
      'user_name', NEW.user_name,
      'user_email', NEW.user_email
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

  RAISE NOTICE '[emit_message_webhook] Webhook sent for message % (source: %)', NEW.id, source_type;

  RETURN NEW;
END;
$$;

-- Create trigger on messages table
DROP TRIGGER IF EXISTS trigger_emit_message_webhook ON messages;
CREATE TRIGGER trigger_emit_message_webhook
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION emit_message_webhook();