

# Hardening Booking Date Picker Logic

## Current State Analysis

After analyzing the codebase, I found **four distinct date-disabled patterns** in use:

| Location | Current Implementation | Issue |
|----------|----------------------|-------|
| `BookingStepDate.tsx` | `before: startOfDay(new Date())` | Recently fixed, uses local timezone |
| `GalleryConsultationForm.tsx` | `disabled={(date) => date < new Date()}` | Compares against current time, not startOfDay |
| `PersonalizedConsultationForm.tsx` | `disabled={(date) => date < new Date()}` | Same issue - current time comparison |
| `BookingStepSlots.tsx` | Relies on `monthAvailability` from backend | Correct - uses server-side rules |

**Key Findings:**
1. Date logic is duplicated across 3 components with inconsistent implementations
2. No centralized timezone handling - each component uses `Intl.DateTimeFormat().resolvedOptions().timeZone`
3. The `GalleryConsultationForm` and `PersonalizedConsultationForm` use `date < new Date()` which may block today after midnight in edge cases due to time component comparison
4. Backend availability rules have a timezone field per product (e.g., `America/Los_Angeles`) but this isn't leveraged on the frontend for date selection

---

## Proposed Solution

### 1. Create Centralized Date Validation Utility

**New File: `src/utils/dateValidation.ts`**

This utility will provide:

```typescript
/**
 * Booking Date Validation Utilities
 * 
 * CRITICAL DESIGN DECISIONS:
 * 
 * 1. WHY `< today` NOT `<= today`:
 *    - Users must be able to book today's date (same-day bookings)
 *    - Only PAST dates (yesterday and earlier) should be disabled
 *    - Time slot availability for today is handled separately by availability rules
 * 
 * 2. WHY TIMEZONE NORMALIZATION:
 *    - Without normalization, a user at 11 PM PST would see a different "today" than UTC
 *    - startOfDay ensures consistent midnight-based comparison
 *    - Product timezone is passed to backend for slot computation, not for date picker UI
 * 
 * 3. WHY NO BUSINESS HOURS CUTOFF AT DATE LEVEL:
 *    - Date picker: Always allows today + future
 *    - Time slots: Enforces business hours, capacity, and cutoffs
 *    - Separation of concerns prevents future date blocking
 */

import { startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * Gets the minimum selectable date for booking calendars
 * 
 * @param timezone - Optional timezone (defaults to browser timezone)
 * @returns Date object representing the start of "today" in the specified timezone
 * 
 * RULES:
 * - Returns start of today (00:00:00) in the user's local timezone
 * - For the `before` constraint: dates BEFORE this value are disabled
 * - Today (the returned date) IS selectable
 * - All future dates ARE selectable
 * - Yesterday and earlier are NOT selectable
 */
export function getMinSelectableDate(timezone?: string): Date

/**
 * Checks if a date is in the past (before today)
 * 
 * @param date - The date to check
 * @param timezone - Optional timezone for "today" determination
 * @returns true if the date is strictly before today
 * 
 * USAGE:
 * - For Calendar `disabled` prop: disabled={(date) => isDateInPast(date)}
 * - Returns false for today → today is selectable
 * - Returns true for yesterday → yesterday is disabled
 */
export function isDateInPast(date: Date, timezone?: string): boolean

/**
 * Gets the user's detected timezone
 * Cached for consistency during the session
 */
export function getUserTimezone(): string
```

### 2. Implementation Details

**Core Functions:**

```typescript
// Cache user timezone to avoid repeated API calls
let cachedUserTimezone: string | null = null;

export function getUserTimezone(): string {
  if (!cachedUserTimezone) {
    cachedUserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return cachedUserTimezone;
}

export function getMinSelectableDate(timezone?: string): Date {
  const tz = timezone || getUserTimezone();
  
  // Get current time in the specified timezone
  const now = new Date();
  const zonedNow = toZonedTime(now, tz);
  
  // Return start of day (midnight) in that timezone
  // This ensures the date comparison works at day boundaries
  return startOfDay(zonedNow);
}

export function isDateInPast(date: Date, timezone?: string): boolean {
  const minDate = getMinSelectableDate(timezone);
  
  // Normalize the input date to start of day for fair comparison
  const normalizedDate = startOfDay(date);
  
  // Date is in the past if it's BEFORE minDate (not equal to)
  // This means today is NOT in the past → today is selectable
  return normalizedDate < minDate;
}
```

### 3. React Hook for Convenience

**Add to `src/utils/dateValidation.ts`:**

```typescript
import { useMemo } from 'react';

/**
 * React hook for date validation in booking calendars
 * 
 * @param productTimezone - Optional product-specific timezone
 * @returns Object with disabled days config and validation functions
 */
export function useBookingDateValidation(productTimezone?: string) {
  const timezone = productTimezone || getUserTimezone();
  
  // Memoize to prevent unnecessary recalculations
  const disabledDays = useMemo(() => ({
    // The `before` constraint disables dates BEFORE this date
    // This means the returned date (today) is SELECTABLE
    before: getMinSelectableDate(timezone),
  }), [timezone]);
  
  // Callback for imperative date checking
  const isDisabled = useCallback((date: Date) => {
    return isDateInPast(date, timezone);
  }, [timezone]);
  
  return {
    disabledDays,
    isDisabled,
    timezone,
  };
}
```

---

## Files to Modify

### File Changes Summary

| File | Action | Changes |
|------|--------|---------|
| `src/utils/dateValidation.ts` | **CREATE** | New centralized utility |
| `src/components/booking/BookingStepDate.tsx` | **MODIFY** | Use centralized hook |
| `src/components/ui/gallery/GalleryConsultationForm.tsx` | **MODIFY** | Use `isDateInPast()` |
| `src/components/PersonalizedConsultationForm.tsx` | **MODIFY** | Use `isDateInPast()` |

### Detailed Changes

**1. BookingStepDate.tsx (Booking Flow)**

Before:
```typescript
import { format, startOfDay } from 'date-fns';

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const disabledDays = {
  before: startOfDay(new Date()),
};
```

After:
```typescript
import { format } from 'date-fns';
import { useBookingDateValidation } from '@/utils/dateValidation';

const { disabledDays, timezone } = useBookingDateValidation();
```

**2. GalleryConsultationForm.tsx**

Before:
```typescript
disabled={(date) => date < new Date()}
```

After:
```typescript
import { isDateInPast } from '@/utils/dateValidation';

disabled={(date) => isDateInPast(date)}
```

**3. PersonalizedConsultationForm.tsx**

Before:
```typescript
disabled={(date) => date < new Date()}
```

After:
```typescript
import { isDateInPast } from '@/utils/dateValidation';

disabled={(date) => isDateInPast(date)}
```

---

## Regression Protection: Inline Documentation

The new utility will include comprehensive inline comments explaining:

```typescript
/**
 * REGRESSION PROTECTION NOTES:
 * 
 * 1. NEVER use `<= today` - this would disable today which must be selectable
 * 
 * 2. NEVER use `date < new Date()` directly in components:
 *    - This compares against current TIME, not DATE
 *    - At 11:59 PM, `new Date()` = "today at 11:59 PM"
 *    - So "today at 00:00" < "today at 11:59" = true = BLOCKED (wrong!)
 *    - Always use startOfDay() for date-level comparisons
 * 
 * 3. NEVER add business hours cutoff at the date picker level:
 *    - Date picker should ONLY care about: past vs present/future
 *    - Business hours, cutoffs, and slot availability are handled by:
 *      - availability_rules table
 *      - availability_overrides table  
 *      - get_slot_availability() SQL function
 *    - This separation ensures users can always SELECT today
 * 
 * 4. TIMEZONE CONSISTENCY:
 *    - User's local timezone determines what "today" means for date selection
 *    - Product timezone (from availability_rules.timezone) is passed to
 *      backend for slot computation, NOT for date picker UI
 *    - This prevents edge cases where a US user booking for a Japan-based
 *      product would see the wrong "today"
 * 
 * 5. DST TRANSITIONS:
 *    - date-fns-tz handles DST automatically
 *    - toZonedTime() properly converts across timezone boundaries
 *    - Tests should cover DST transition dates (Mar/Nov in US)
 */
```

---

## Testing Considerations

The implementation should be verified against:

| Scenario | Expected Behavior |
|----------|-------------------|
| Today at 9 AM | Today is selectable |
| Today at 11:59 PM | Today is still selectable |
| Yesterday | Disabled |
| Tomorrow | Selectable |
| User in different timezone than product | Date selection based on user's local time |
| DST transition day | Correct "today" determination |
| Month navigation | Past dates in previous months disabled |
| Year boundary | Dec 31 → Jan 1 works correctly |

---

## Implementation Sequence

```text
Phase 1: Create Utility
└── Create src/utils/dateValidation.ts with:
    ├── getUserTimezone()
    ├── getMinSelectableDate()
    ├── isDateInPast()
    └── useBookingDateValidation() hook

Phase 2: Update Booking Flow
└── Modify BookingStepDate.tsx to use the hook

Phase 3: Update Other Calendars
├── Modify GalleryConsultationForm.tsx
└── Modify PersonalizedConsultationForm.tsx

Phase 4: Verify (Manual Testing)
└── Test all calendar components across scenarios
```

---

## No Breaking Changes Guarantee

1. **Same behavior for users** - Today and future dates remain selectable
2. **Same timezone passed to backend** - Still uses `Intl.DateTimeFormat().resolvedOptions().timeZone`
3. **No booking flow changes** - Only internal refactoring
4. **Backward compatible** - All existing functionality preserved
5. **No database changes** - Pure frontend refactoring

---

## Dependencies

Uses existing dependencies:
- `date-fns` (already installed) - for `startOfDay`
- `date-fns-tz` (already installed) - for `toZonedTime`

No new dependencies required.

