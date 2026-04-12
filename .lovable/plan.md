

# Pipeline Process – Date-Based Lead Filters

## Summary
Add a client-side filter bar above the pipeline kanban board to filter profiles by recency (Today, This Week, This Month, All). No database or query changes -- filtering applied in-memory on the already-fetched `profiles` array.

## Approach: Client-Side Filtering
The page already fetches all pipeline-enabled profiles in one query. Filtering client-side is the safest approach: zero risk to drag-and-drop, real-time subscriptions, or existing queries.

## Changes

**Single file: `src/pages/PipelineProcess.tsx`**

1. **Add state**: `dateFilter` with values `'all' | 'today' | 'week' | 'month'`, default `'all'`

2. **Add filter function** using `created_at`:
   - Today: `created_at >= startOfToday()`
   - This Week: `created_at >= startOfWeek()` (Sunday)
   - This Month: `created_at >= startOfMonth()`
   - All: no filter

3. **Derive `filteredProfiles`** via `useMemo` -- applies date filter to `profiles` state. All existing kanban rendering and drag-and-drop logic uses `filteredProfiles` instead of `profiles` for display, but drag handlers continue to operate on the full `profiles` state so moves persist correctly.

4. **Add filter bar UI** between the header and the kanban board:
   - Horizontal row of 4 buttons: All Leads, Today, This Week, This Month
   - Each button shows a badge count (computed from full `profiles` array)
   - Active filter has `variant="default"`, others `variant="ghost"`
   - Summary text: e.g. "Showing 5 of 14 leads"

5. **`getStatusCount`** updated to count from `filteredProfiles`

## What is NOT touched
- Database schema
- Supabase query / real-time subscription
- Drag-and-drop handlers (`handleDragEnd`, `handleMoveToColumn`, etc.)
- `KanbanProvider`, `KanbanBoard`, `KanbanCard` components
- RLS policies
- Any other file

## Visual Layout
```text
Pipeline Process
Manage and track customer progress through the pipeline

[All Leads (14)] [Today (2)] [This Week (5)] [This Month (9)]   Showing 9 of 14 leads

┌─ New Lead & Negotiation ─┐ ┌─ Closed Deal... ─┐ ...
```

