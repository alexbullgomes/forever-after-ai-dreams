
Root cause
- The save button in `src/components/admin/settings/ChatConfigEditor.tsx` uses `supabase.from('site_settings').upsert(...)`.
- Supabase upsert still goes through the `INSERT` RLS path, even when the `chat_config` row already exists.
- The current `site_settings` INSERT policy was added as:
  `public.has_role(auth.uid(), 'admin'::app_role)`
- That overload reads `public.user_roles`, but this database does not have a `public.user_roles` table.
- Confirmed by the actual browser error: `42P01: relation "public.user_roles" does not exist`.
- `chat_config` already exists, so the issue is no longer seeding; it is the broken INSERT policy itself.
- That is why the page opens for your admin user but saving fails: frontend admin access uses `profiles.role` (`useRole`), while this new RLS policy checks a different, broken role path.

Safest fix
- Add one follow-up database migration only.
- Do not touch chat architecture, message flow, realtime, n8n, or the `site_settings` schema.
- Replace the broken INSERT policy with the same admin check already used elsewhere in this project: `public.check_user_role_only(auth.uid()) = 'admin'`.
- Align the UPDATE policy to the same check for consistency and to avoid mixed role logic.

Migration to add
```sql
DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;

CREATE POLICY "Admins can insert site settings"
ON public.site_settings
FOR INSERT
TO authenticated
WITH CHECK (public.check_user_role_only(auth.uid()) = 'admin');

CREATE POLICY "Admins can update site settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (public.check_user_role_only(auth.uid()) = 'admin')
WITH CHECK (public.check_user_role_only(auth.uid()) = 'admin');
```

Implementation steps
1. Create a new migration file under `supabase/migrations/` (do not edit the already-applied migration).
2. Drop the current broken `site_settings` INSERT/UPDATE policies.
3. Recreate both policies using `check_user_role_only(auth.uid()) = 'admin'`.
4. Retest save in Project Settings → Chat.

Affected files
- `supabase/migrations/<new_timestamp>_fix_site_settings_policy_role_check.sql`

Why this is the safest approach
- Fixes the exact failing RLS path.
- Keeps `ChatConfigEditor` unchanged.
- Preserves all existing chat functionality.
- Avoids unnecessary frontend changes and avoids introducing a new role system just for this bug.

Validation
- Admin can save Chat Configuration successfully.
- Existing `chat_config` row continues to update normally.
- Other `site_settings` saves still work.
- Non-admins still cannot insert/update `site_settings`.
- No regression to chat rendering, webhooks, realtime, or admin navigation.

Not part of this fix
- No new tables
- No changes to `messages`, `conversations`, edge functions, or n8n
- No changes to chat UI behavior
