

# Mobile-Optimize Booking Pipeline Insights Metrics Bar

## Problem
At 390px viewport, the metrics bar items wrap awkwardly — pills are too wide with padding, dividers break mid-row, and the funnel steps crowd together.

## Changes (single file: `src/components/dashboard/BookingInsights.tsx`)

### 1. Metrics Bar — Grid Layout on Mobile
- Replace `flex flex-wrap` with a responsive grid: `grid grid-cols-3 sm:flex sm:flex-wrap`
- This gives a clean 3-column grid on mobile (2 rows of 3 metrics), then reverts to inline flex on larger screens
- Remove divider elements on mobile (`hidden sm:block`)
- Reduce pill padding on mobile: `px-1.5 py-1 sm:px-2.5 sm:py-1.5`
- Reduce gap: `gap-0.5 sm:gap-1`
- Shrink font on mobile: `text-xs sm:text-sm` for counts
- Revenue pill spans full width on mobile as a separate row below the grid

### 2. Funnel Steps — Scrollable on Mobile
- Add `overflow-x-auto` and `flex-nowrap` on mobile to prevent wrapping
- Use `min-w-0 shrink-0` on each step to keep them inline
- Hide drop-off percentages below `sm` breakpoint to save space (they still show on tablet+)

### 3. Hot Leads — Tighter Mobile Spacing
- Reduce row padding: `px-2 py-1.5 sm:px-3 sm:py-2`
- Hide the stage text on mobile (keep urgency icon as the indicator)
- Truncate product name more aggressively with `max-w-[120px] sm:max-w-none`

## What Does NOT Change
- All data fetching, queries, subscriptions
- Filter logic, navigation, click handlers
- Desktop/tablet layout (only mobile gets adjusted)

