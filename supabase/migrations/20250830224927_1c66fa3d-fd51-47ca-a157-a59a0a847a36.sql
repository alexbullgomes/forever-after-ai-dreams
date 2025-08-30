-- Add new_msg column to messages table to track read/unread status
ALTER TABLE public.messages 
ADD COLUMN new_msg text DEFAULT 'unread' CHECK (new_msg IN ('read', 'unread'));

-- Add new_msg column to conversations table to track conversation read/unread status
ALTER TABLE public.conversations 
ADD COLUMN new_msg text DEFAULT 'read' CHECK (new_msg IN ('read', 'unread'));

-- Create function to update conversation status when new message is added
CREATE OR REPLACE FUNCTION update_conversation_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the conversation's new_msg status to 'unread' when a new message is added
  UPDATE public.conversations 
  SET new_msg = 'unread'
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update conversation status on new messages
CREATE TRIGGER trigger_update_conversation_on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_new_message();

-- Update RLS policies to allow admins to update new_msg status
CREATE POLICY "Admins can update message status" 
  ON public.messages 
  FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'));

-- Add policy for conversations new_msg updates (admins can mark as read)
CREATE POLICY "Admins can update conversation read status" 
  ON public.conversations 
  FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'));