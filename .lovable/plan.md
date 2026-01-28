

# Fix MP4 Video Playback Issues Across All Gallery Components

## Problem Summary

Videos in gallery components are not playing correctly due to two main issues:

1. **Incorrect URL Field Mapping**: The `PromotionalCampaignGallery.tsx` maps the `url` field to image URLs instead of video URLs. The `MediaItem.tsx` component expects `url` to contain the WebM video source for desktop playback.

2. **Missing autoPlay Attribute**: `MediaItem.tsx` lacks the HTML `autoPlay` attribute, relying solely on JavaScript-based play triggers which can fail on iOS devices with restricted autoplay policies.

3. **Missing iOS Compatibility**: No tap-to-play fallback exists when autoplay is blocked on iOS, unlike `VideoThumbnail.tsx` which handles this gracefully.

## Root Cause Analysis

```text
MediaItem.tsx video source logic:
┌─────────────────────────────────────────────────────────────┐
│  Mobile: <source src={item.mp4Url} />                       │
│  Desktop: <source src={item.url} />  ◄── Expects WebM here  │
│  Fallback: <source src={item.mp4Url} />                     │
└─────────────────────────────────────────────────────────────┘

PromotionalCampaignGallery.tsx (INCORRECT):
  url: card.thumb_image_url  ◄── Maps to IMAGE, not video!

EverAfterGallery.tsx (CORRECT):
  url: card.thumb_webm_url || card.thumb_mp4_url  ◄── Maps to VIDEO
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/galleries/PromotionalCampaignGallery.tsx` | Fix `url` field mapping to prioritize video URLs |
| `src/components/ui/gallery/MediaItem.tsx` | Add `autoPlay` attribute, iOS detection, and tap-to-play fallback |

## Technical Changes

### 1. Fix PromotionalCampaignGallery.tsx (Line 28)

**Current (Incorrect):**
```typescript
url: card.thumb_image_url || card.thumbnail_url || '',
```

**Fixed:**
```typescript
url: card.thumb_webm_url || card.thumb_mp4_url || card.thumb_image_url || card.thumbnail_url || '',
```

This ensures the `url` field contains a video URL (WebM preferred for desktop) when available, matching the pattern used in other gallery components.

### 2. Enhance MediaItem.tsx

**Add iOS Detection** (line 12-16):
```typescript
const isIOSDevice = () => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};
```

**Add State for Play Button** (after line 21):
```typescript
const [isIOS] = useState(isIOSDevice());
const [showPlayButton, setShowPlayButton] = useState(false);
```

**Add autoPlay Attribute and iOS Handlers** (lines 95-118):
```typescript
<video
  ref={videoRef}
  className="w-full h-full object-cover"
  onClick={onClick}
  playsInline
  muted
  loop
  autoPlay                              // ◄── Add HTML autoPlay attribute
  preload={isIOS ? "metadata" : "auto"} // ◄── iOS optimization
  poster={item.posterUrl}
  onPlaying={() => setShowPlayButton(false)}  // ◄── Hide button when playing
  style={{...}}
>
  {/* iOS Priority: MP4 first with explicit codec */}
  {isIOS && item.mp4Url && (
    <source src={item.mp4Url} type="video/mp4; codecs=avc1.42E01E,mp4a.40.2" />
  )}
  {/* Desktop: WebM preferred */}
  {!isIOS && <source src={item.url} type="video/webm" />}
  {/* Fallback */}
  {item.mp4Url && <source src={item.mp4Url} type="video/mp4" />}
  {!item.mp4Url && <source src={item.url} type="video/mp4" />}
</video>
```

**Add Tap-to-Play Fallback** (after the buffering indicator):
```typescript
{showPlayButton && !isBuffering && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      if (videoRef.current) {
        videoRef.current.play().catch(console.warn);
      }
    }}
    className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
    aria-label="Play video"
  >
    <div className="bg-white/90 rounded-full p-3 shadow-lg">
      <Play className="w-6 h-6 text-gray-900" fill="currentColor" />
    </div>
  </button>
)}
```

**Update Play Logic** (in the useEffect around line 52):
```typescript
try {
  await videoRef.current.play();
  setShowPlayButton(false);  // Success - hide button
} catch (error) {
  console.warn("Video playback failed:", error);
  setShowPlayButton(true);   // Show tap-to-play on iOS
}
```

**Remove Aggressive Cleanup** (lines 82-89):
The current cleanup that removes `src` and calls `load()` can cause issues. Replace with a simpler pause:
```typescript
return () => {
  mounted = false;
  if (videoRef.current) {
    videoRef.current.pause();
  }
};
```

### Import Play Icon

Add to imports at line 2:
```typescript
import { Play } from 'lucide-react';
```

## Verification

After implementation, verify:
1. Videos autoplay on desktop (Chrome, Firefox, Safari)
2. Videos autoplay on iOS Safari when muted
3. If autoplay blocked on iOS, tap-to-play button appears
4. Videos pause when scrolled out of view
5. Videos resume when scrolled back into view
6. Promotional campaign gallery videos play correctly
7. No console errors related to video playback

## Unchanged Components

The following galleries already have correct URL mapping and need no changes:
- `EverAfterGallery.tsx` 
- `WeddingGallery.tsx` 
- `PlannerGallery.tsx`

