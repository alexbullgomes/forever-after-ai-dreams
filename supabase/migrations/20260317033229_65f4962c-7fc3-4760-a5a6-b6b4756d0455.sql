-- RLS policies for affiliate conversation access

-- 1. Conversations SELECT: Affiliates can view conversations matching their referral_code
CREATE POLICY "Affiliates can view their referral conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  referral_code IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.affiliates a
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE a.user_id = auth.uid()
      AND a.referral_code = conversations.referral_code
      AND a.is_active = true
      AND p.can_access_affiliate_conversations = true
  )
);

-- 2. Messages SELECT: Affiliates can read messages in their referral conversations
CREATE POLICY "Affiliates can view messages in referral conversations"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.affiliates a ON a.referral_code = c.referral_code
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE c.id = messages.conversation_id
      AND a.user_id = auth.uid()
      AND a.is_active = true
      AND p.can_access_affiliate_conversations = true
  )
);

-- 3. Messages INSERT: Affiliates can respond in their referral conversations
CREATE POLICY "Affiliates can respond in referral conversations"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.affiliates a ON a.referral_code = c.referral_code
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE c.id = conversation_id
      AND a.user_id = auth.uid()
      AND a.is_active = true
      AND p.can_access_affiliate_conversations = true
  )
);