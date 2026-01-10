/**
 * Booking redirect utilities
 * Handles preserving and restoring booking funnel state across authentication
 */

// Session storage keys
export const BOOKING_RETURN_URL_KEY = 'bookingReturnUrl';
export const PENDING_BOOKING_STATE_KEY = 'pendingBookingState';

export interface PendingBookingState {
  // Common fields
  type: 'campaign_pricing_card' | 'campaign_product';
  campaignId: string;
  campaignSlug: string;
  selectedDate: string;
  timezone: string;
  timestamp: number;
  // For campaign pricing cards
  cardIndex?: number;
  cardTitle?: string;
  // For campaign products
  productId?: string;
  productTitle?: string;
}

/**
 * Validates that a return URL is safe to redirect to
 * - Must be same-origin (starts with /)
 * - Must be a /promo/ path
 */
export function isValidBookingReturnUrl(url: string): boolean {
  // Must start with / (relative path)
  if (!url.startsWith('/')) {
    return false;
  }
  
  // Must be a promo page
  if (!url.startsWith('/promo/')) {
    return false;
  }
  
  // No protocol schemes that could be abused
  if (url.includes('://') || url.startsWith('//')) {
    return false;
  }
  
  return true;
}

/**
 * Saves the current booking state before authentication
 */
export function saveBookingState(state: PendingBookingState): void {
  const returnUrl = window.location.pathname + window.location.search + window.location.hash;
  
  if (!isValidBookingReturnUrl(returnUrl)) {
    console.warn('Invalid booking return URL, not saving state:', returnUrl);
    return;
  }
  
  sessionStorage.setItem(BOOKING_RETURN_URL_KEY, returnUrl);
  sessionStorage.setItem(PENDING_BOOKING_STATE_KEY, JSON.stringify(state));
  
  console.log('Saved booking state:', { returnUrl, state });
}

/**
 * Gets and validates the pending booking return URL
 */
export function getBookingReturnUrl(): string | null {
  const returnUrl = sessionStorage.getItem(BOOKING_RETURN_URL_KEY);
  
  if (!returnUrl) {
    return null;
  }
  
  if (!isValidBookingReturnUrl(returnUrl)) {
    console.warn('Invalid stored booking return URL, clearing:', returnUrl);
    clearBookingState();
    return null;
  }
  
  return returnUrl;
}

/**
 * Gets the pending booking state
 */
export function getPendingBookingState(): PendingBookingState | null {
  const stateStr = sessionStorage.getItem(PENDING_BOOKING_STATE_KEY);
  
  if (!stateStr) {
    return null;
  }
  
  try {
    const state = JSON.parse(stateStr) as PendingBookingState;
    
    // Check if expired (30 minutes)
    if (Date.now() - state.timestamp > 30 * 60 * 1000) {
      console.log('Pending booking state expired, clearing');
      clearBookingState();
      return null;
    }
    
    return state;
  } catch (err) {
    console.error('Error parsing pending booking state:', err);
    clearBookingState();
    return null;
  }
}

/**
 * Clears all booking-related session storage
 */
export function clearBookingState(): void {
  sessionStorage.removeItem(BOOKING_RETURN_URL_KEY);
  sessionStorage.removeItem(PENDING_BOOKING_STATE_KEY);
  
  // Also clear legacy localStorage keys
  localStorage.removeItem('pendingCampaignDateSelection');
  localStorage.removeItem('pendingCampaignProductDateSelection');
  localStorage.removeItem('postLoginReturnTo');
  localStorage.removeItem('postLoginAction');
}

/**
 * Checks if there's a pending booking that needs to be resumed
 */
export function hasPendingBooking(): boolean {
  const returnUrl = getBookingReturnUrl();
  const state = getPendingBookingState();
  return !!(returnUrl && state);
}
