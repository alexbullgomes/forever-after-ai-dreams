-- Add visitor_id column to conversations table (nullable)
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS visitor_id TEXT;

-- Make customer_id nullable (currently NOT NULL) - first drop the not null constraint
ALTER TABLE public.conversations 
ALTER COLUMN customer_id DROP NOT NULL;

-- Add check constraint: exactly one of customer_id or visitor_id must be set
-- First drop if exists to avoid error
ALTER TABLE public.conversations 
DROP CONSTRAINT IF EXISTS conversations_owner_check;

ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_owner_check 
CHECK (
  (customer_id IS NOT NULL AND visitor_id IS NULL) OR 
  (customer_id IS NULL AND visitor_id IS NOT NULL)
);

-- Create index for visitor_id lookups
CREATE INDEX IF NOT EXISTS idx_conversations_visitor_id ON public.conversations(visitor_id) 
WHERE visitor_id IS NOT NULL;

-- Drop existing restrictive policies for conversations that block anon access
DROP POLICY IF EXISTS "Deny unauthenticated access to conversations" ON public.conversations;