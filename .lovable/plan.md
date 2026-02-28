

# Campaign Theme -- Form Component Integration

## Root Cause

`buildCampaignColorStyle()` in `src/utils/campaignColors.ts` only sets 3 semantic aliases:
- `--primary` (from `primary_from`)
- `--ring-brand` (from `primary_from`)
- `--border-brand` (from `primary_from`)

It does NOT set these shadcn/ui semantic variables that form components rely on:
- `--ring` (focus rings on Input, Textarea, Select, Button)
- `--accent` (hover states on dropdown items, checkboxes)
- `--accent-foreground`

The Contact component's own form inputs use explicit `focus:border-brand-primary-from` which DOES work, but any shadcn/ui component using the default `focus-visible:ring-ring` class will still show the global theme's ring color.

## Fix

### File: `src/utils/campaignColors.ts`

Extend the alias block (lines 67-72) to also derive and set:

```ts
if (brandColors.primary_from) {
  style['--primary'] = brandColors.primary_from;
  style['--ring'] = brandColors.primary_from;
  style['--ring-brand'] = brandColors.primary_from;
  style['--border-brand'] = brandColors.primary_from;
}
```

This is the minimal, safe change. The `--ring` variable controls all `focus-visible:ring-ring` states across every shadcn/ui form component (Input, Textarea, Select, Button, Checkbox, etc.).

### Why NOT set `--accent`, `--border`, `--input`, `--background`, etc.

These variables control structural appearance (background colors, border lightness, surface contrast). They are mode-dependent (light vs dark) and should NOT be derived from a brand hue alone -- doing so would break readability. The campaign pages use a dark contact section with explicit `bg-white/10 border-white/30 text-white` overrides that already look correct regardless of theme. Only the focus ring color leaks through as the wrong hue.

### Impact
- Single file change, single line addition
- Zero risk to global theme, layout, or campaign override system
- All shadcn/ui focus rings inside campaign wrapper will match the campaign's primary color

