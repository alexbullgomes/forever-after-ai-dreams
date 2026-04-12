

# Fix: Chat Configuration Save Failing

## Root Cause
The `site_settings` table has no RLS **INSERT** policy. Only `SELECT` (public) and `UPDATE` (admin) policies exist. The `ChatConfigEditor` uses `upsert`, which tries to INSERT a new row for the `chat_config` key (it doesn't exist in the table yet). RLS blocks the insert silently, causing the "Failed to save" error.

## Solution (Two-Part)

### 1. Database Migration: Add INSERT policy for admins
```sql
CREATE POLICY "Admins can insert site settings"
ON public.site_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
```

### 2. Seed the `chat_config` row (optional safety net)
Insert a default row so future saves only need UPDATE:
```sql
INSERT INTO public.site_settings (key, value)
VALUES ('chat_config', '{}')
ON CONFLICT (key) DO NOTHING;
```

## Files Changed
- One SQL migration only. No frontend code changes needed.

## Safety
- No impact on existing settings (brand_colors, homepage content, etc.)
- The INSERT policy is admin-only, matching the existing UPDATE policy
- Existing functionality untouched

