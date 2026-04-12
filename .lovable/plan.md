

# Compact Booking Pipeline Insights — UI/UX Optimization

## Summary
Restructure the BookingInsights component to reduce vertical space by ~60% while preserving all data, logic, navigation, and interactions. Single file change.

## File: `src/components/dashboard/BookingInsights.tsx`

### Layout Changes

**Section 1: Compact Metrics Bar** (replaces 6 large cards)
- Single horizontal glass bar (`bg-card/80 backdrop-blur-sm`) with metrics as inline pill items separated by dividers
- Each item: icon + count + label, all on one line, clickable
- Revenue integrated as the last item: `DollarSign` icon + `$84,710` + tooltip on hover showing breakdown (time_selected / checkout_started counts)
- Abandoned count shown with red accent
- Layout: `flex flex-wrap items-center gap-3` inside a single rounded container
- On mobile: wraps naturally into 2 rows

**Section 2: Inline Funnel** (replaces padded card with title)
- Remove the wrapping card and "Conversion Funnel" heading
- Single horizontal row of stage pills with chevrons between them: `271 → 104 (-62%) → 95 (-9%) → 6 (-94%)`
- Each pill: small icon + count + stage label below in `text-[10px]`
- Drop-off percentages shown as red text between chevrons
- Much tighter padding (`px-2 py-1.5`) and smaller text (`text-sm` for counts)
- Remove proportional width sizing (all pills same size for cleaner layout)

**Section 3: Condensed Hot Leads** (replaces wide table + revenue side panel)
- Remove the separate Revenue Opportunity card entirely (moved to metrics bar)
- Full-width compact list, max 5 items visible (reduced from 10)
- Remove table headers — use a clean list format instead
- Each row: `product name · stage badge · time ago · urgency icon · hover actions`
- Urgency icons replace text badges:
  - `Zap` icon (emerald) for recent (<12h)
  - `AlertTriangle` icon (amber) for attention (12-24h)  
  - `AlertCircle` icon (red) for urgent (>24h)
- Action buttons (Eye, MessageSquare) hidden by default, shown on `group-hover`
- "View All" link in the section header

### Specific Implementation Details

1. **Metrics bar item structure:**
```
<button class="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-muted/60 transition-all">
  <Icon class="h-3.5 w-3.5" />
  <span class="text-base font-bold">{count}</span>
  <span class="text-[10px] text-muted-foreground">{label}</span>
</button>
```
Separated by `<div class="w-px h-6 bg-border/50" />` dividers.

2. **Revenue tooltip:** Use a simple CSS `group/revenue` + `group-hover/revenue:visible` pattern showing the breakdown div — no external tooltip library needed.

3. **Hot leads list row:**
```
<div class="group flex items-center gap-3 px-3 py-2 hover:bg-muted/20 rounded-lg">
  <span class="flex-1 truncate font-medium text-sm">{product}</span>
  <span class="text-[10px] text-muted-foreground capitalize">{stage}</span>
  <span class="text-[10px] text-muted-foreground">{timeAgo}</span>
  <UrgencyIcon class="h-3.5 w-3.5" />
  <div class="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
    {action buttons}
  </div>
</div>
```

### What Does NOT Change
- All data fetching, queries, real-time subscriptions
- Filter logic and time range computation
- Navigation URLs and click handlers
- Urgency classification thresholds
- Revenue calculation logic
- Stage definitions and counts

### Edge Cases
- Revenue tooltip may be cut off on small screens — position it to the left
- Hover actions on mobile: touch devices will show on tap (standard behavior)
- 5-item limit on hot leads still shows "View All" for accessing the full pipeline

