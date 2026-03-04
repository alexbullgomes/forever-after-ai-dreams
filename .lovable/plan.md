

# Campaign Visibility Mode — Implementation Plan

## Current Architecture

The campaign system uses a single `is_active` boolean to control visibility. Three consumers query campaigns:

| Consumer | File | Filter |
|----------|------|--------|
| Active Campaigns (Services page) | `useActiveCampaigns.ts` | `is_active = true` |
| Promotional Footer (Homepage) | `PromotionalFooter.tsx` | `is_active = true` AND `promotional_footer_enabled = true` |
| Campaign Landing Page | `usePromotionalCampaign.ts` | `slug = :slug`, then checks `is_active` in code (line 105) |

The admin form (`PromotionalCampaignForm.tsx`) and admin list (`PromotionalCampaigns.tsx`) toggle `is_active` directly.

## Plan

### 1. Database Migration

Add a `visibility_mode` text column to `promotional_campaigns`:

```sql
ALTER TABLE promotional_campaigns
  ADD COLUMN visibility_mode text NOT NULL DEFAULT 'public';

-- Backfill: active campaigns → 'public', inactive → 'inactive'
UPDATE promotional_campaigns
  SET visibility_mode = CASE WHEN is_active = true THEN 'public' ELSE 'inactive' END;
```

No new table, no enum (text is simpler to extend). The existing `is_active` column is kept for backward compatibility but will be derived from `visibility_mode` going forward.

### 2. Keep `is_active` in Sync

To avoid breaking any edge functions or RLS policies that reference `is_active`, add a trigger that syncs it:

```sql
CREATE OR REPLACE FUNCTION sync_campaign_is_active()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.is_active := (NEW.visibility_mode IN ('public', 'unlisted'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_campaign_is_active
  BEFORE INSERT OR UPDATE ON promotional_campaigns
  FOR EACH ROW EXECUTE FUNCTION sync_campaign_is_active();
```

This means `is_active = true` for both `public` and `unlisted` (they're both "live" campaigns). Only `inactive` sets `is_active = false`.

### 3. Update Queries (3 files)

**`useActiveCampaigns.ts`** — Services page listing:
- Add `.eq('visibility_mode', 'public')` to only show public campaigns.

**`PromotionalFooter.tsx`** — Homepage footer:
- Add `.eq('visibility_mode', 'public')` so unlisted campaigns don't rotate in the footer.

**`usePromotionalCampaign.ts`** — Landing page by slug:
- Change the `is_active` check (line 105) to check `visibility_mode !== 'inactive'` instead. This allows both `public` and `unlisted` campaigns to render via direct URL, while `inactive` shows "Campaign not found".

### 4. Admin UI (2 files)

**`PromotionalCampaignForm.tsx`**:
- Add a "Campaign Visibility" dropdown in the Banner/General tab with three options: Public, Unlisted, Inactive.
- Remove or hide the standalone `is_active` toggle (the trigger handles it).
- Add `visibility_mode` to the form state and save payload.

**`PromotionalCampaigns.tsx`** (admin list):
- Update the Status badge to show "Public" (green), "Unlisted" (yellow/amber), or "Inactive" (gray).
- Replace the "Activate/Deactivate" button with a quick visibility toggle dropdown or cycle button.

### 5. Files Changed

| File | Change |
|------|--------|
| Migration SQL | Add column + backfill + sync trigger |
| `src/hooks/useActiveCampaigns.ts` | Add `.eq('visibility_mode', 'public')` |
| `src/components/PromotionalFooter.tsx` | Add `.eq('visibility_mode', 'public')` |
| `src/hooks/usePromotionalCampaign.ts` | Replace `is_active` check with `visibility_mode` check |
| `src/components/admin/PromotionalCampaignForm.tsx` | Add visibility dropdown, include in save |
| `src/pages/PromotionalCampaigns.tsx` | Update status badge + action button |

### 6. Safety

- Existing campaigns default to `public` (active) or `inactive` via backfill — no visibility change.
- `is_active` stays synced via trigger — edge functions and RLS are unaffected.
- No routing changes, no layout changes, no new tables.
- Fully backward compatible.

