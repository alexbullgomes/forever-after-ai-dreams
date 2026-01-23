-- Drop the existing check constraint on messages.type
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_type_check;

-- Add a new check constraint that includes 'card' as a valid type
ALTER TABLE public.messages ADD CONSTRAINT messages_type_check 
  CHECK (type IN ('text', 'audio', 'card'));