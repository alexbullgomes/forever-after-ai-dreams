
# Add Left/Right Navigation Arrows to Gallery Modal

## What Changes
Add two circular arrow buttons (previous/next) overlaid on the media container inside the gallery modal, without touching any existing functionality.

## Technical Approach

**File to modify:** `src/components/ui/gallery/ModalContent.tsx`

- Import `ArrowLeft` and `ArrowRight` from `lucide-react`
- Add two absolutely-positioned circular buttons flanking the media container
- Reuse the existing `mediaItems`, `selectedItem`, and `setSelectedItem` props to compute prev/next navigation (same logic as the keyboard handler in GalleryModal.tsx)
- No new state or props needed

## Button Design
- Circular, 48px desktop / 40px mobile (with 44px min touch target)
- Semi-transparent background using brand tokens: `bg-background/80 backdrop-blur-sm`
- Hover: scale up slightly + increase opacity
- Transition: 200ms
- Positioned vertically centered on the media wrapper, 16-24px from edges
- z-index 20 (above media, below close button at z-30)
- `aria-label` for accessibility, focus-visible ring

## What Stays Unchanged
- GalleryModal.tsx (no changes)
- NavigationDock footer thumbnails
- Keyboard navigation (ESC, arrow keys)
- Modal layout, animations, media loading
- All other gallery components
