-- Update RLS policies to allow admin access to all conversations and messages

-- Drop existing policies for conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;

-- Create new policy for conversations that allows admins to see all, users to see their own
CREATE POLICY "Users can view conversations based on role" 
ON public.conversations 
FOR SELECT 
USING (
  -- Admins can see all conversations
  public.has_role(auth.uid(), 'admin') 
  OR 
  -- Regular users can only see their own conversations
  ((auth.uid())::text = customer_id)
);

-- Drop existing policies for messages
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;

-- Create new policy for messages that allows admins to see all, users to see their own
CREATE POLICY "Users can view messages based on role" 
ON public.messages 
FOR SELECT 
USING (
  -- Admins can see all messages
  public.has_role(auth.uid(), 'admin') 
  OR 
  -- Regular users can only see messages from their own conversations
  (EXISTS ( 
    SELECT 1
    FROM conversations
    WHERE ((conversations.id = messages.conversation_id) AND (conversations.customer_id = (auth.uid())::text))
  ))
);