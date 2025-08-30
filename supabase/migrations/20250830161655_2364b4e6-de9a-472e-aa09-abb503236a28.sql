-- First, clean up any existing duplicate conversations
-- Keep only the most recent conversation for each customer_id
WITH duplicates AS (
  SELECT 
    customer_id,
    array_agg(id ORDER BY created_at DESC) as conversation_ids
  FROM conversations
  GROUP BY customer_id
  HAVING count(*) > 1
),
to_delete AS (
  SELECT unnest(conversation_ids[2:]) as id
  FROM duplicates
)
DELETE FROM conversations 
WHERE id IN (SELECT id FROM to_delete);

-- Add unique constraint on customer_id to prevent future duplicates
ALTER TABLE conversations 
ADD CONSTRAINT conversations_customer_id_unique UNIQUE (customer_id);

-- Create index on customer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);