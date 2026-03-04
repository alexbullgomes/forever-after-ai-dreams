

# Chat Admin Campaign Selector — Support Public + Unlisted Campaigns

## Problem
The `EntityPickerModal` uses `useActiveCampaigns()` which filters by `visibility_mode = 'public'`. Unlisted campaigns are excluded, preventing admins from sending them via chat.

## Plan

### 1. Create a dedicated hook for admin campaign fetching
Rather than modifying `useActiveCampaigns` (which correctly filters public-only for the Services page), create a small dedicated query inside `EntityPickerModal` or a new hook `useAdminCampaigns` that fetches campaigns where `visibility_mode IN ('public', 'unlisted')`.

**Simplest approach**: Add an optional `includeUnlisted` param to `useActiveCampaigns`, or just inline a separate query in the modal. I'll go with adding an `options` parameter to `useActiveCampaigns` to keep it DRY — `useActiveCampaigns({ includeUnlisted: true })`.

**Changes to `src/hooks/useActiveCampaigns.ts`:**
- Add optional `options?: { includeUnlisted?: boolean }` parameter
- When `includeUnlisted` is true, use `.in('visibility_mode', ['public', 'unlisted'])` instead of `.eq('visibility_mode', 'public')`
- Add `visibility_mode` to the select and to the `ActiveCampaign` interface

### 2. Update `EntityPickerModal` to use `includeUnlisted: true`
- Call `useActiveCampaigns({ includeUnlisted: true })`

### 3. Add visibility badge to `CampaignListItem`
- Accept `visibilityMode` from the campaign data
- Show a small badge: "Listed" (green) for public, "Unlisted" (amber) for unlisted
- Add a tooltip on the unlisted badge: "Hidden from Services page. Accessible via direct link."

### Files Changed
| File | Change |
|------|--------|
| `src/hooks/useActiveCampaigns.ts` | Add `includeUnlisted` option, add `visibilityMode` to interface & select |
| `src/components/chat/EntityPickerModal.tsx` | Pass `{ includeUnlisted: true }`, add badge to `CampaignListItem` |

No changes to Services page, PromotionalFooter, routing, or campaign logic.

