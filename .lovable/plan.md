

# Campaign-Scoped Promotional Popup

## Current State
- `PromotionalPopup` is only rendered on the homepage (`Index.tsx`), not on campaign pages
- The Dialog portals to `document.body` by default (Radix), escaping campaign CSS variables
- Campaign pages already have a scoped wrapper div with campaign CSS variables (line 212 of `PromotionalLanding.tsx`)

## Plan

### 1. Add portal container to campaign wrapper (`src/pages/PromotionalLanding.tsx`)
- Add a `ref` to the campaign wrapper div (line 212)
- Add `usePromotionalPopup` hook call
- Render `PromotionalPopup` inside the campaign wrapper, passing the container ref as a new `portalContainer` prop

### 2. Update `PromotionalPopup` to accept optional portal container (`src/components/PromotionalPopup.tsx`)
- Add optional `portalContainer` prop to interface
- Pass it through to Dialog's inner `DialogPortal` — but since `DialogContent` wraps `DialogPortal` internally, we need a different approach

### 3. Update `DialogContent` to support custom container (`src/components/ui/dialog.tsx`)
- Add optional `container` prop to `DialogContent`
- Pass it to `DialogPortal` as the `container` prop (Radix supports this natively)

### 4. Wire it all together
- `PromotionalPopup` passes `portalContainer` to `DialogContent` via the `container` prop
- On homepage: no container passed → default body portal (unchanged)
- On campaign pages: container ref passed → portals into campaign-scoped div → inherits CSS variables

## Files Changed
1. **`src/components/ui/dialog.tsx`** — Add `container` prop forwarding to `DialogPortal`
2. **`src/components/PromotionalPopup.tsx`** — Accept optional `portalContainer` prop, pass to `DialogContent`
3. **`src/pages/PromotionalLanding.tsx`** — Add ref, hook, and render popup with container ref

## No Changes To
- Homepage popup behavior
- Global CSS variables
- Popup logic/hook
- Any other components

