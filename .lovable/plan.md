

# Analysis: Feature Showcase Card — Current State & Improvement Plan

## Current Implementation

The `Showcase3DCard` component (lines 48–131) renders a `Card` with two distinct sections stacked vertically:
1. **Media container** (line 82): `aspect-[4/5]` div with absolutely-positioned `TabsContent` items
2. **Tab controls** (lines 117–126): A separate `div` below the media with `border-t`, `bg-muted/30`, containing the `TabsList`

The card sits inside a Radix `Tabs` context. The `defaultValue={initial}` on line 153 sets `initial = defaultTab ?? tabs[0]?.value ?? "tab-0"`.

## Root Cause Analysis

### Why media doesn't load automatically
The screenshot shows an empty white card. The `defaultValue` logic looks correct — the Radix `TabsContent` with `data-[state=active]` should render the first tab. The likely issue is that the **media URL itself is empty or invalid** in the database for the first tab, OR the `TabsContent` uses `data-[state=inactive]:hidden` (line 89) which relies on Radix state. Since `defaultValue` is set, this should work. However, if the `value` stored in the database doesn't match `tabs[0]?.value`, the content won't show. The fix is to add a `forceMount` approach or ensure the active content is always visible regardless of Radix state timing.

**Safest fix**: Remove the Radix `TabsContent` wrapper for media rendering entirely. Instead, use controlled state (`useState`) to track the active tab index, and conditionally render the matching media directly. This eliminates any Radix hydration/timing issues while keeping `TabsTrigger` for the tab buttons.

### Why media doesn't fill the card
The media container (`aspect-[4/5]`, line 82) fills the card correctly with `object-cover`. But the tab controls section (lines 117–126) sits **below** the media as a separate block, creating the visual separation seen in the screenshot. The media only fills the top portion, not the entire card.

### Why tabs are outside the media
The `TabsList` is in a separate `div` after the media container, not overlaid on top of it.

## Implementation Plan

### 1. Use controlled state for reliable first-item rendering
- Add `const [activeTab, setActiveTab] = useState(initial)` inside `Showcase3DCard`
- Pass `value={activeTab}` and `onValueChange={setActiveTab}` to the parent `Tabs`
- Render media conditionally based on `activeTab` instead of relying on `TabsContent` — just show/hide with a simple comparison
- This guarantees the first item renders on mount with zero dependency on Radix timing

### 2. Media fills entire card
- Remove the separate tab controls `div` (lines 117–126) from below the media
- Make the `Card` itself the `aspect-[4/5]` container with `relative` positioning
- Media renders as `absolute inset-0 object-cover` filling the entire card
- No empty space below — the card IS the media

### 3. Tabs overlay the media (glass style)
- Move the `TabsList` inside the media container, positioned at the bottom
- Use `absolute bottom-3 left-3 right-3` (or centered) positioning
- Apply glass-morphism: `bg-black/30 backdrop-blur-md rounded-xl border border-white/10`
- Tab triggers get `text-white/80 data-[state=active]:text-white data-[state=active]:bg-white/20` styling
- The gradient overlay (line 114) remains for readability

### 4. No changes to
- 3D tilt animation (mouseX/mouseY/spring logic)
- Props, types, data flow
- Accordion, CTAs, layout columns
- Campaign/theme logic

## File Changed
`src/components/ui/feature-showcase.tsx` — only the `Showcase3DCard` internal rendering

