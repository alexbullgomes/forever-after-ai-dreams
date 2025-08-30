-- Update the has_role function to work with the profiles table
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = _role
  )
$function$;

-- Update RLS policies to use the corrected function with text type instead of app_role enum

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view conversations based on role" ON conversations;
DROP POLICY IF EXISTS "Users can view messages based on role" ON messages;

-- Recreate policies with correct role type
CREATE POLICY "Users can view conversations based on role" 
ON conversations 
FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR (auth.uid())::text = customer_id);

CREATE POLICY "Users can view messages based on role" 
ON messages 
FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR (EXISTS ( SELECT 1
   FROM conversations
  WHERE ((conversations.id = messages.conversation_id) AND (conversations.customer_id = (auth.uid())::text)))));