-- Add chat_summarize column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN chat_summarize text;