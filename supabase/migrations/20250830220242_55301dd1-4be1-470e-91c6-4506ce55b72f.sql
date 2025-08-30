-- Add UPDATE policy for conversations table to allow admins to update conversation modes
CREATE POLICY "Admins can update conversations" 
  ON public.conversations 
  FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'));