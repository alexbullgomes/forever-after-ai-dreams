
# Gallery Modal Portrait Media Layout Fix

## Problem Analysis

When viewing 9:16 (vertical) media in the gallery modal, the navigation dock is pushed outside the visible viewport. This happens because:

1. The modal content uses `flex-1` which allows content to expand freely
2. The portrait media container has `max-h-[75vh]` but combined with padding, buttons, and navigation dock, the total height exceeds 100vh
3. There's no guaranteed reserved space for the navigation elements

**Screenshot Analysis**: The uploaded screenshot shows the vertical media taking up almost the entire modal height, with the "Like" button barely visible and the navigation dock completely cut off below the viewport.

---

## Solution Overview

Restructure the `ModalContent.tsx` layout to:
1. Use a fixed-height flex column that respects viewport bounds
2. Give the navigation area a guaranteed minimum space
3. Reduce portrait media max-height to account for UI elements
4. Apply responsive constraints for mobile vs desktop

---

## Technical Implementation

### File: `src/components/ui/gallery/ModalContent.tsx`

**Current Structure (problematic):**
```
<div h-full flex-col>
  <div flex-1>              ← Can grow unbounded
    <media max-h-[75vh]/>   ← 75vh doesn't leave room for rest
    <buttons/>
    <navigation/>
  </div>
</div>
```

**New Structure (fixed):**
```
<div h-full flex-col overflow-hidden>
  <div flex-1 min-h-0 overflow-y-auto>   ← Scrollable if needed, but constrained
    <media max-h-[55vh] md:max-h-[60vh]/> ← Reduced to leave room for UI
    <buttons/>
  </div>
  <div flex-shrink-0>                     ← Navigation always visible
    <navigation/>
  </div>
</div>
```

### Key Changes:

| Aspect | Before | After |
|--------|--------|-------|
| Portrait media max-height | `max-h-[75vh]` | `max-h-[55vh] md:max-h-[60vh]` |
| Landscape media max-height | `max-h-[60vh]` | `max-h-[50vh] md:max-h-[55vh]` |
| Content container | `flex-1` only | `flex-1 min-h-0 overflow-y-auto` |
| Navigation container | Inside flex-1 | Separate `flex-shrink-0` container |
| Outer container | `h-full flex flex-col` | `h-full flex flex-col overflow-hidden` |

### Specific Code Changes:

**Line 25-27 - Update container classes:**
```typescript
// Portrait: smaller on mobile, slightly larger on desktop
const containerClasses = isPortrait
  ? "relative aspect-[9/16] max-h-[55vh] md:max-h-[60vh] w-auto rounded-lg overflow-hidden shadow-lg"
  : "relative w-full aspect-[16/9] max-w-[95%] sm:max-w-[90%] md:max-w-4xl max-h-[50vh] md:max-h-[55vh] rounded-lg overflow-hidden shadow-lg";
```

**Line 29-30 - Update outer container:**
```tsx
<div className="h-full flex flex-col overflow-hidden">
```

**Line 31 - Update content container:**
```tsx
<div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 md:p-6 flex flex-col items-center justify-start">
```

**Lines 68-92 - Move navigation outside scrollable area:**

Before:
```tsx
{/* Action Buttons */}
<div className="flex items-center justify-center gap-4 mb-6">
  ...
</div>

{/* Navigation - INSIDE scrollable area */}
<div className="flex justify-center items-center w-full max-w-4xl mt-4">
  <NavigationDock ... />
</div>
```

After:
```tsx
      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 mt-4">
        ...
      </div>
    </div>
  </div>

  {/* Navigation - OUTSIDE scrollable area, always visible */}
  <div className="flex-shrink-0 py-3 sm:py-4 flex justify-center items-center w-full">
    <NavigationDock ... />
  </div>
</div>
```

---

## Visual Comparison

```text
BEFORE (Portrait 9:16):                    AFTER (Portrait 9:16):
┌──────────────────────┐                   ┌──────────────────────┐
│     Close [X]        │                   │     Close [X]        │
│                      │                   │                      │
│  ┌────────────────┐  │                   │  ┌────────────────┐  │
│  │                │  │                   │  │                │  │
│  │                │  │                   │  │    PORTRAIT    │  │
│  │    PORTRAIT    │  │                   │  │     MEDIA      │  │
│  │     MEDIA      │  │                   │  │   (smaller)    │  │
│  │   (too tall)   │  │                   │  │                │  │
│  │                │  │                   │  └────────────────┘  │
│  │                │  │                   │                      │
│  └────────────────┘  │                   │    [Like] [Watch]    │
│                      │                   │                      │
│    [Like] [Watch]    │                   │  ┌────────────────┐  │
└──────────────────────┘                   │  │  Navigation    │  │
   Navigation hidden                       │  │     Dock       │  │
   below viewport!                         │  └────────────────┘  │
                                           └──────────────────────┘
                                              All elements visible!
```

---

## Affected Components

| Component | Change | Impact |
|-----------|--------|--------|
| `ModalContent.tsx` | Layout restructure | All galleries fixed |
| `NavigationDock.tsx` | No changes | Works as-is |
| `GalleryModal.tsx` | No changes | Works as-is |
| Gallery consumers | No changes | Automatic fix |

**Galleries automatically fixed:**
- Homepage Portfolio gallery
- Services / EverAfter gallery
- Wedding Packages gallery  
- Campaign galleries (`/promo/:slug`)

---

## Constraints Preserved

- Gallery navigation logic unchanged
- Media loading behavior unchanged
- Animations and transitions unchanged
- Desktop behavior for horizontal (16:9) media similar (slightly smaller)
- Orientation detection hook unchanged
- Like button, Full Video button functionality unchanged

---

## Testing Checklist

1. Open any gallery with portrait (9:16) media
2. Verify navigation dock is fully visible at bottom
3. Verify Like and Watch buttons are visible
4. Test on mobile viewport (should be even more compact)
5. Test with landscape media - should remain similar to before
6. Test navigation dock drag functionality
7. Test keyboard navigation (arrow keys, Escape)
8. Verify animations still work smoothly
