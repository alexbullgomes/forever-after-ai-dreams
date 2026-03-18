

# Product Thumbnail Refactor Plan

## Current State

- **Products table** has `image_url`, `video_url`, `media_type` — no `thumb_*` columns
- **ProductForm** (`src/components/admin/ProductForm.tsx`) has two URL fields: "Image URL" and "Video URL (optional)"
- **ProductMediaHero** renders video if `video_url` is a .mp4/.webm, otherwise falls back to `image_url`
- **6 consumer locations** reference `product.image_url` / `product.video_url`:
  - `ProductsSection.tsx` (3D cards on services page)
  - `CampaignProductsSection.tsx` (campaign landing pages)
  - `ProductsAdmin.tsx` (admin list thumbnail)
  - `CampaignProductsTab.tsx` (campaign product picker)
  - `EntityPickerModal.tsx` (chat card product picker)
  - `useProducts.ts` (Product type definition)

The user's screenshot is from the **GalleryCardForm** (which already has the thumb_image_url / thumb_mp4_url / thumb_webm_url pattern). The goal is to bring this same pattern to **Products**.

---

## Implementation Plan

### Step 1 — Database Migration

Add three nullable columns to `products`:

```sql
ALTER TABLE products
  ADD COLUMN thumb_image_url text DEFAULT NULL,
  ADD COLUMN thumb_mp4_url text DEFAULT NULL,
  ADD COLUMN thumb_webm_url text DEFAULT NULL;
```

No existing columns removed. Fully backward-compatible.

### Step 2 — Create `getProductThumbnail()` utility

New file: `src/utils/productThumbnail.ts`

```typescript
export function getProductThumbnail(product: {
  thumb_image_url?: string | null;
  thumb_mp4_url?: string | null;
  thumb_webm_url?: string | null;
  image_url?: string | null;
  video_url?: string | null;
}): { imageUrl: string; videoUrl?: string } {
  // Priority: thumb fields → legacy fields → placeholder
  const imageUrl = product.thumb_image_url || product.image_url || "/placeholder.svg";
  // Mobile-first: prefer MP4 over WebM
  const videoUrl = product.thumb_mp4_url || product.thumb_webm_url || product.video_url || undefined;
  return { imageUrl, videoUrl };
}

const SUPABASE_LOCAL_BASE = "https://supabasestudio.agcreationmkt.cloud/storage/v1/object/public/";
export function isSupabaseLocalUrl(url: string): boolean {
  return url.startsWith(SUPABASE_LOCAL_BASE);
}
```

### Step 3 — Update Product type in `useProducts.ts`

Add `thumb_image_url`, `thumb_mp4_url`, `thumb_webm_url` (all `string | null`) to the `Product` interface. Also add them to the `duplicateProduct` method.

### Step 4 — Refactor ProductForm

Replace the current "Image URL" + "Video URL" fields with a unified "Product Media" section matching the gallery card pattern:

- **Video WEBM URL** input (`thumb_webm_url`)
- **Video MP4 URL** input (`thumb_mp4_url`)
- **Image URL** input (`thumb_image_url`)
- **Live preview** (video or image, same as GalleryCardForm lines 443-468)
- **URL warning** — amber text if URL doesn't start with Supabase Local base URL (non-blocking)
- Keep `image_url` and `video_url` as hidden/auto-mapped internally (set `image_url = thumb_image_url` and `video_url = thumb_mp4_url || thumb_webm_url` on save for backward compatibility)

Remove the old standalone "Image URL" and "Video URL" form fields.

### Step 5 — Update admin list view thumbnail

In `ProductsAdmin.tsx` `SortableRow`, replace the current `product.image_url` thumbnail with the `getProductThumbnail()` helper, rendering video if available.

### Step 6 — Update all consumer components

Use `getProductThumbnail()` in:

| File | Current | New |
|------|---------|-----|
| `ProductsSection.tsx` L89-90 | `product.image_url`, `product.video_url` | `getProductThumbnail(product)` |
| `CampaignProductsSection.tsx` L225-226 | same | same helper |
| `CampaignProductsTab.tsx` L85-88, L315-318 | `product.image_url` | `getProductThumbnail(product).imageUrl` |
| `EntityPickerModal.tsx` L67, L274 | `product.image_url` | `getProductThumbnail(product).imageUrl` |

### Step 7 — Validation

In ProductForm's zod schema, add a custom `.refine()` that checks at least one of `thumb_image_url`, `thumb_mp4_url`, `thumb_webm_url`, or `image_url` is present. Non-blocking warning for missing Supabase Local base URL prefix.

---

## Files Modified

| Category | Files |
|----------|-------|
| Migration | New: add `thumb_*` columns to `products` |
| New utility | `src/utils/productThumbnail.ts` |
| Modified | `src/hooks/useProducts.ts` (type + duplicate) |
| Modified | `src/components/admin/ProductForm.tsx` (form refactor) |
| Modified | `src/pages/ProductsAdmin.tsx` (list thumbnail) |
| Modified | `src/components/planner/ProductsSection.tsx` |
| Modified | `src/components/promo/CampaignProductsSection.tsx` |
| Modified | `src/components/admin/CampaignProductsTab.tsx` |
| Modified | `src/components/chat/EntityPickerModal.tsx` |

## What stays untouched

- `image_url` and `video_url` columns remain in DB (backward compat)
- `ProductMediaHero` component unchanged (still receives imageUrl/videoUrl props)
- Booking flow, Stripe checkout, campaign pages — no changes
- Gallery card system — no changes
- All existing product records continue working (legacy fallback in helper)

