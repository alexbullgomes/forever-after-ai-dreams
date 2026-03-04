

# Fix Feature Showcase Layout & Initial Media Rendering

## Problem Summary
From the screenshot: the card container stretches too wide (blue outline shows excess space), the first tab's media doesn't render until clicking another tab, and the overall layout isn't properly centered.

## Changes (single file: `src/components/ui/feature-showcase.tsx`)

### 1. Fix First Tab Media Not Loading
The `<img>` tag uses `loading="lazy"` (line 107). Inside an absolutely-positioned container, lazy loading may never trigger because the element isn't detected in the viewport. Change to `loading="eager"` for reliable first-paint rendering.

### 2. Constrain & Center the Layout
Replace the current flex layout with a properly constrained structure:
- Add `max-w-5xl mx-auto` to the inner container so the content group never stretches on wide screens
- Change the right column from `flex-1 min-w-0` (which expands to fill all available space) to a fixed-width column: `w-full lg:w-[340px] lg:flex-shrink-0`
- Left column keeps `lg:max-w-md lg:flex-shrink-0`; right column gets a fixed width so the card container matches the card size

### 3. Card Column Sizing
- Set the right column to `lg:w-[340px]` with `flex-shrink-0` so it doesn't expand beyond the card
- Remove `max-w-xs` wrapper div — the column width itself constrains the card
- Keep `aspect-[4/5]` on the media container

### 4. Responsive Behavior
- Desktop: two-column flex with `lg:flex-row`, left `flex-1` for text, right fixed `lg:w-[340px]`
- Mobile: vertical stack, card centered with `mx-auto max-w-xs`

### 5. No Changes To
- 3D tilt effect, tab navigation, accordion, props, types, theme system, campaign logic

