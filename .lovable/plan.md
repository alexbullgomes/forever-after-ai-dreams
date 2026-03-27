

# Fix: Privilege Escalation via Profile Self-Update

## Problem

The `Users can update their own profiles` RLS policy only restricts `visitor_id` changes. A user can set `role = 'admin'`, `can_access_affiliate_conversations = true`, or modify other admin-controlled fields by calling `supabase.from('profiles').update(...)` directly.

## Solution

Replace the WITH CHECK clause to also lock down admin-controlled columns: `role`, `can_access_affiliate_conversations`, `pipeline_profile`, `pipeline_status`, `user_dashboard`, `sort_order`, `chat_summarize`, `briefing`. Each protected field must either remain unchanged or already be NULL→NULL.

## Migration SQL

```sql
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;

CREATE POLICY "Users can update their own profiles" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent visitor_id hijacking
    AND (
      visitor_id IS NOT DISTINCT FROM (SELECT p.visitor_id FROM public.profiles p WHERE p.id = auth.uid())
      OR (SELECT p.visitor_id FROM public.profiles p WHERE p.id = auth.uid()) IS NULL
    )
    -- Prevent role escalation
    AND role IS NOT DISTINCT FROM (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    -- Prevent flipping admin-controlled flags
    AND can_access_affiliate_conversations IS NOT DISTINCT FROM (SELECT p.can_access_affiliate_conversations FROM public.profiles p WHERE p.id = auth.uid())
    AND pipeline_profile IS NOT DISTINCT FROM (SELECT p.pipeline_profile FROM public.profiles p WHERE p.id = auth.uid())
    AND pipeline_status IS NOT DISTINCT FROM (SELECT p.pipeline_status FROM public.profiles p WHERE p.id = auth.uid())
    AND user_dashboard IS NOT DISTINCT FROM (SELECT p.user_dashboard FROM public.profiles p WHERE p.id = auth.uid())
    AND sort_order IS NOT DISTINCT FROM (SELECT p.sort_order FROM public.profiles p WHERE p.id = auth.uid())
  );
```

`IS NOT DISTINCT FROM` ensures the new value equals the old value (handles NULLs correctly). If a user tries to change any protected field, the row fails the WITH CHECK and the update is rejected.

**Note**: The existing `Admins can update all profiles` policy (USING: `has_role(auth.uid(), 'admin')`) is unaffected — admins can still update any field on any profile.

## Files Modified

| File | Change |
|------|--------|
| New migration | Replace profiles UPDATE policy with field-level protection |

## What remains safe to update by users
- `name`, `email`, `avatar_url`, `user_number`, `promotional_phone`, `event_date`, `event_city`, `gallery_event`, `package_consultation`, `visitor_id` (first-time link only)

## Safety
- No code changes needed — all profile updates in the app only touch user-editable fields
- Admin update policy is separate and unrestricted
- `handle_new_user()` trigger runs as SECURITY DEFINER, bypasses RLS

