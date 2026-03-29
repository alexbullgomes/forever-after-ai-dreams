

# Fix: Remove Legacy Categories from Gallery System

## Root Cause

Three sources of legacy category references:

1. **`site_settings` database** stores a `filters` array in the portfolio header content with old values ("Photo & Videos"). Since `content?.filters` is not null, it overrides the correct defaults in Portfolio.tsx.

2. **Portfolio.tsx line 106**: The card badge `type` field still maps non-Wedding categories to `"Photo & Video"` — should map per category.

3. **GalleryCardForm.tsx lines 238, 242**: Admin form still offers "Photo & Videos" and "Video" as category options.

## Changes

### 1. Portfolio.tsx — Fix type badge + force-sanitize filters

**Line 106** — Update the `type` mapping:
```
type: card.category  // Use the actual category name as the badge
```

**Lines 49-54** — Add filter sanitization after the fallback to strip any legacy filter that isn't in the allowed set (`all`, `weddings`, `business`, `family`). This handles stale `site_settings` data without requiring a DB update:
```typescript
const rawFilters = content?.filters ?? [
  { id: "all", label: "Highlights" },
  { id: "weddings", label: "Weddings" },
  { id: "business", label: "Business" },
  { id: "family", label: "Family" }
];
const allowedFilterIds = new Set(["all", "weddings", "business", "family"]);
const filters = rawFilters.filter(f => allowedFilterIds.has(f.id));
// If sanitization removed everything, use defaults
if (filters.length === 0) {
  filters.push(
    { id: "all", label: "Highlights" },
    { id: "weddings", label: "Weddings" },
    { id: "business", label: "Business" },
    { id: "family", label: "Family" }
  );
}
```

**Add legacy category mapping in filtering** — Cards with old categories ("Photo & Videos", "Video") get mapped during data fetch:
```typescript
// In the map callback, normalize category:
const rawCategory = card.category;
const category = rawCategory === "Photo & Videos" ? "Business" 
               : rawCategory === "video" ? "Family" 
               : rawCategory;
```

### 2. GalleryCardForm.tsx — Remove legacy category options

**Lines 238, 242** — Remove "Photo & Videos" and "Video" options, keep only:
- Weddings
- Business  
- Family

### 3. No backend changes needed

The `site_settings` stale data is handled by frontend sanitization. No migration required.

## Files Modified

| File | Change |
|------|--------|
| `src/components/Portfolio.tsx` | Sanitize filters, fix type badge, map legacy categories |
| `src/components/admin/GalleryCardForm.tsx` | Remove "Photo & Videos" and "Video" from category dropdown |

## Safety

- No DB schema changes
- No changes to other galleries, booking, chat, or campaigns
- Legacy cards with old categories gracefully mapped
- Admin can re-categorize old cards at their own pace

