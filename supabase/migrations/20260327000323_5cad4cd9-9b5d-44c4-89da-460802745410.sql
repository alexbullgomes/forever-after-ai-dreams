
CREATE OR REPLACE FUNCTION public.get_own_profile_protected_fields(_user_id uuid)
RETURNS TABLE(
  visitor_id text,
  role text,
  can_access_affiliate_conversations boolean,
  pipeline_profile text,
  pipeline_status text,
  user_dashboard boolean,
  sort_order integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.visitor_id, p.role, p.can_access_affiliate_conversations,
         p.pipeline_profile, p.pipeline_status, p.user_dashboard, p.sort_order
  FROM public.profiles p
  WHERE p.id = _user_id
  LIMIT 1;
$$;

DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;

CREATE POLICY "Users can update their own profiles" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      visitor_id IS NOT DISTINCT FROM (SELECT f.visitor_id FROM public.get_own_profile_protected_fields(auth.uid()) f)
      OR (SELECT f.visitor_id FROM public.get_own_profile_protected_fields(auth.uid()) f) IS NULL
    )
    AND role IS NOT DISTINCT FROM (SELECT f.role FROM public.get_own_profile_protected_fields(auth.uid()) f)
    AND can_access_affiliate_conversations IS NOT DISTINCT FROM (SELECT f.can_access_affiliate_conversations FROM public.get_own_profile_protected_fields(auth.uid()) f)
    AND pipeline_profile IS NOT DISTINCT FROM (SELECT f.pipeline_profile FROM public.get_own_profile_protected_fields(auth.uid()) f)
    AND pipeline_status IS NOT DISTINCT FROM (SELECT f.pipeline_status FROM public.get_own_profile_protected_fields(auth.uid()) f)
    AND user_dashboard IS NOT DISTINCT FROM (SELECT f.user_dashboard FROM public.get_own_profile_protected_fields(auth.uid()) f)
    AND sort_order IS NOT DISTINCT FROM (SELECT f.sort_order FROM public.get_own_profile_protected_fields(auth.uid()) f)
  );
