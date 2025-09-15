-- Add visitorId column to profiles table for linking anonymous chat sessions
ALTER TABLE public.profiles 
ADD COLUMN visitor_id TEXT;