

# Improve Pipeline Process Filter UI/UX

## Current State
The filter bar uses basic `Button` + `Badge` components with `default`/`ghost` variants. The selected state is a solid filled button with an outline badge count. It works but looks flat and the selected state doesn't stand out clearly.

## Proposed Improvements

### Visual Changes
1. **Selected filter**: Use a pill-shaped button with brand gradient background, white text, and a subtle shadow/ring to make the active state more prominent
2. **Unselected filters**: Use a transparent background with muted text and a light border on hover, making unselected options feel secondary
3. **Count badges**: Selected filter gets a white/semi-transparent badge; unselected gets a subtle muted badge
4. **Transition animations**: Smooth color/background transitions on filter change
5. **Active indicator**: Add a subtle bottom border or underline effect on the selected filter
6. **Summary text**: Style the "Showing X of Y leads" as a softer, slightly italic note

### Implementation
- **File**: `src/pages/PipelineProcess.tsx` (lines 348-368 only)
- Replace the filter bar with styled pill buttons using Tailwind classes
- Add `transition-all duration-200` for smooth state changes
- Use `bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20` for selected state
- Use `text-muted-foreground hover:text-foreground hover:bg-muted` for unselected
- Round badges with consistent sizing
- No structural or logic changes -- purely visual

### What Does NOT Change
- Filter logic, date calculations, counts
- Kanban board, drag-and-drop, real-time subscriptions
- Any other component or page

