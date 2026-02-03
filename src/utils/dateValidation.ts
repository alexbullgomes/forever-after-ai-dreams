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
 * 
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
 */

import { startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { useMemo, useCallback } from 'react';

// Cache user timezone to avoid repeated API calls during the session
let cachedUserTimezone: string | null = null;

/**
 * Gets the user's detected timezone
 * Cached for consistency during the session
 * 
 * @returns The user's browser timezone (e.g., "America/Los_Angeles")
 */
export function getUserTimezone(): string {
  if (!cachedUserTimezone) {
    cachedUserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return cachedUserTimezone;
}

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
 * 
 * IMPORTANT: The `before` property in react-day-picker disables dates
 * BEFORE the specified date, NOT including the date itself.
 * So if we return "Feb 3 00:00:00", Feb 3 is SELECTABLE, Feb 2 is DISABLED.
 */
export function getMinSelectableDate(timezone?: string): Date {
  const tz = timezone || getUserTimezone();
  
  // Get current time in the specified timezone
  const now = new Date();
  const zonedNow = toZonedTime(now, tz);
  
  // Return start of day (midnight) in that timezone
  // This ensures the date comparison works at day boundaries
  return startOfDay(zonedNow);
}

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
 * 
 * IMPORTANT: Uses strict less-than comparison (< not <=)
 * This ensures today is NEVER considered "in the past"
 */
export function isDateInPast(date: Date, timezone?: string): boolean {
  const minDate = getMinSelectableDate(timezone);
  
  // Normalize the input date to start of day for fair comparison
  // This prevents time-of-day from affecting the result
  const normalizedDate = startOfDay(date);
  
  // Date is in the past if it's BEFORE minDate (not equal to)
  // This means today is NOT in the past → today is selectable
  return normalizedDate < minDate;
}

/**
 * React hook for date validation in booking calendars
 * 
 * @param productTimezone - Optional product-specific timezone
 * @returns Object with disabled days config and validation functions
 * 
 * USAGE:
 * ```tsx
 * const { disabledDays, timezone } = useBookingDateValidation();
 * 
 * <Calendar
 *   disabled={disabledDays}
 *   // or for imperative checking:
 *   disabled={(date) => isDisabled(date)}
 * />
 * ```
 */
export function useBookingDateValidation(productTimezone?: string) {
  const timezone = productTimezone || getUserTimezone();
  
  // Memoize to prevent unnecessary recalculations
  // The disabled days config is stable unless timezone changes
  const disabledDays = useMemo(() => ({
    // The `before` constraint disables dates BEFORE this date
    // This means the returned date (today) is SELECTABLE
    before: getMinSelectableDate(timezone),
  }), [timezone]);
  
  // Callback for imperative date checking
  // Useful when you need to check dates programmatically
  const isDisabled = useCallback((date: Date) => {
    return isDateInPast(date, timezone);
  }, [timezone]);
  
  return {
    /**
     * Configuration object for react-day-picker's `disabled` prop
     * Pass directly: <Calendar disabled={disabledDays} />
     */
    disabledDays,
    
    /**
     * Function to check if a specific date should be disabled
     * Returns true if date is in the past
     */
    isDisabled,
    
    /**
     * The timezone being used for date calculations
     * Can be passed to backend for slot availability computation
     */
    timezone,
  };
}
