-- Add user_name and user_email fields to messages table
ALTER TABLE public.messages 
ADD COLUMN user_name text,
ADD COLUMN user_email text;