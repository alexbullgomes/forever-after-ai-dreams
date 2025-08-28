-- Add user_name and user_email fields to conversations table
ALTER TABLE public.conversations 
ADD COLUMN user_name text,
ADD COLUMN user_email text;