

# Homepage Gallery: Manual Highlight Curation System

## Current State

- `gallery_cards` table already has a `featured` boolean column
- Frontend "Highlights" tab (filter `all`) shows **all published cards** with no filtering — `featured` is ignored
- Category tabs filter by `category` field (`Photo & Videos`, `Weddings`)
- Admin form has `featured` toggle but it only shows a badge in the list — no functional impact on homepage
- Categories available: `Photo & Videos`, `Weddings`, `video` (admin dropdown)

## What Changes

### 1. Frontend Filtering (Portfolio.tsx)

Update filter logic so:
- **Highlights tab** → only cards where `featured === true` (already fetched, just filter)
- **Category tabs** → all published cards matching category (unchanged for existing, add new tabs)

Update the default filter tabs to: Highlights, Photo & Videos, Weddings, Video (or match the user's requested: Highlights, Weddings, Business, Family — will use whatever categories exist in the data)

The `filters` array comes from `content?.filters` (admin-configurable via site_settings). Default fallback will be updated to include the new categories.

### 2. Admin Form (GalleryCardForm.tsx)

- Rename the existing `featured` toggle label from "Featured" to **"Featured in Highlights"**
- Add helper text: "When enabled, this card appears in the Highlights tab on the homepage"
- Add new category options: `Business`, `Family` to the category dropdown (alongside existing `Photo & Videos`, `Weddings`)

### 3. Admin List (GalleryCardsAdmin.tsx)

- Update the "Featured" badge/toggle label to "Highlights" for clarity
- No structural changes needed — toggle already works

### 4. No Database Migration Needed

The `featured` boolean column already exists with `DEFAULT false`. No schema change required.

## Files Modified

| File | Change |
|------|--------|
| `src/components/Portfolio.tsx` | Highlights tab filters by `featured === true`; update default filter tabs |
| `src/components/admin/GalleryCardForm.tsx` | Rename featured label, add Business/Family categories |
| `src/pages/GalleryCardsAdmin.tsx` | Update "Featured" label to "Featured in Highlights" |

## Safety

- No database changes
- No changes to other gallery tables, booking, chat, or campaigns
- Media priority logic untouched
- Published logic unchanged — `is_published` still controls visibility
- Existing cards with `featured = false` will simply not appear in Highlights tab (admin can toggle them on)
- Category tabs continue showing all published cards in that category regardless of featured status

