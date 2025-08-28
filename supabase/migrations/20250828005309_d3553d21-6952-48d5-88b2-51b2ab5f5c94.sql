-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  public_code TEXT UNIQUE,
  customer_id TEXT NOT NULL,
  mode TEXT DEFAULT 'ai',
  taken_by TEXT,
  taken_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'ai', 'human')),
  type TEXT NOT NULL CHECK (type IN ('text', 'audio')),
  content TEXT,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING (auth.uid()::text = customer_id);

CREATE POLICY "Users can create their own conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid()::text = customer_id);

-- RLS policies for messages
CREATE POLICY "Users can view messages from their conversations" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.customer_id = auth.uid()::text
  )
);

CREATE POLICY "Users can create messages in their conversations" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.customer_id = auth.uid()::text
  )
);

-- Create storage bucket for chat audios
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-audios', 'chat-audios', true);

-- Storage policies for chat audios
CREATE POLICY "Anyone can view chat audio files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chat-audios');

CREATE POLICY "Authenticated users can upload chat audio files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'chat-audios' AND auth.role() = 'authenticated');

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;