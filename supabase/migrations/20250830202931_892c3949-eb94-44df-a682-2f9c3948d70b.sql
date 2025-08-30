-- Update the INSERT policy on messages table to allow admins to insert messages into any conversation
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON messages;

CREATE POLICY "Users can create messages in their conversations" 
ON messages 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin') OR (EXISTS ( SELECT 1
   FROM conversations
  WHERE ((conversations.id = messages.conversation_id) AND (conversations.customer_id = (auth.uid())::text)))));