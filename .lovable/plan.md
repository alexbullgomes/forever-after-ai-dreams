## Audit

**DB fields (`gallery_cards`)**: All needed columns already exist — `thumbnail_url`, `thumb_image_url`, `thumb_webm_url`, `thumb_mp4_url`, plus legacy `video_url`/`video_mp4_url`. **No schema changes needed.**

**Edit modal (`src/components/admin/GalleryCardForm.tsx`)**: Already exposes separate inputs for `thumb_webm_url`, `thumb_mp4_url`, `thumb_image_url` and renders a working preview. The legacy "Thumbnail Image" upload only writes to `thumbnail_url`. There is no unified "paste any URL" helper.

**Admin list (`src/pages/GalleryCardsAdmin.tsx`, `SortableCardItem`)**: Renders ONLY `<img src={card.thumbnail_url} />`. If a card has just `thumb_mp4_url` (or any of the modern thumb fields) and no `thumbnail_url`, the row shows a broken/empty image — this is the visible bug.

**Public render (`src/components/Portfolio.tsx` + `VideoThumbnail`)**: Already follows the correct priority (webm → mp4 → image → fallback). Working correctly.

## Root Cause

The admin list preview only reads `thumbnail_url` and ignores `thumb_mp4_url` / `thumb_webm_url` / `thumb_image_url`. Cards that use the modern video-thumbnail fields appear empty in the dashboard, even though they render fine on the public site.

## Plan

1. **`src/utils/galleryThumbnail.ts` (new)** — small helper:
   - `resolveCardThumbnail(card)` returns `{ webm, mp4, image }` with priority `thumb_*` → legacy (`thumbnail_url`).
   - `classifyMediaUrl(url)` returns `'mp4' | 'webm' | 'image' | 'unknown'` based on extension.
   - `isAllowedPublicMediaUrl(url)` warns (not blocks) if not under `https://supabasestudio.agcreationmkt.cloud/storage/v1/object/public/`.

2. **`src/pages/GalleryCardsAdmin.tsx` (`SortableCardItem`)** — replace the `<img>` block with a 64×64 preview that:
   - Uses `<video muted loop playsInline preload="metadata">` with webm + mp4 sources when available (autoplay on hover only to keep list light).
   - Falls back to `<img>` using `thumb_image_url` → `thumbnail_url`.
   - Falls back to existing `ImageIcon` placeholder when nothing is set.
   - On `<video>` `onError`, swaps to image fallback.

3. **`src/components/admin/GalleryCardForm.tsx`** — add a new "Thumbnail / Preview Media URL" smart input ABOVE the existing advanced fields (existing fields kept intact for power users):
   - Helper text: *"Paste a public Supabase local storage URL. Supports MP4, WebM, WebP, JPG, PNG."*
   - On paste/blur, classify by extension and write into `thumb_mp4_url`, `thumb_webm_url`, or `thumb_image_url` accordingly (clearing any conflicting field of the same kind only).
   - Soft-warn (yellow text, not blocking) if URL is not on the local Supabase host.
   - Existing per-format inputs stay visible and editable.
   - Existing legacy "Thumbnail Image" upload stays as-is for backward compatibility.

4. **No changes** to: `Portfolio.tsx`, `VideoThumbnail`, `useGalleryCards`, RLS, schema, public rendering priority, drag-and-drop, filters, published/featured toggles.

## Files Touched

- `src/utils/galleryThumbnail.ts` (new)
- `src/pages/GalleryCardsAdmin.tsx` (preview swap inside `SortableCardItem`)
- `src/components/admin/GalleryCardForm.tsx` (add unified URL field, keep existing fields)

## Risks & Mitigations

- **Autoplay in long lists could be heavy** → only play on hover, `preload="metadata"`, mute, no audio decode.
- **Existing cards with only `thumbnail_url`** → still display via image fallback path; behavior unchanged on public site.
- **Pasted non-Supabase URLs** → soft warning only; not blocked, so legacy data keeps working.
- **No DB migration** → zero risk of data loss; all writes go to existing columns.

## QA Checklist (post-implementation)

- Admin list shows animated MP4 preview on hover for video-only cards.
- Image-only cards still display the static thumbnail.
- Cards with no media show clean placeholder (no broken-image icon).
- Edit modal: pasting `…/Wedding_short_2.mp4` populates `thumb_mp4_url` automatically; existing fields remain editable.
- Public homepage Portfolio renders unchanged.
- Published / Featured toggles, drag-and-drop, filters, and gallery type selector all still work.