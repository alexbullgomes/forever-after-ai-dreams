import { supabase } from '@/integrations/supabase/client';
import { getVisitorId } from '@/utils/visitor';

// Storage keys for persistent referral tracking
const REFERRAL_CODE_KEY = 'everafter_referral_code';
const REFERRAL_TIMESTAMP_KEY = 'everafter_referral_timestamp';
const REFERRAL_LANDING_KEY = 'everafter_referral_landing';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface ReferralTracking {
  referralCode: string | null;
  visitorId: string | null;
  campaignSource: string | null;
}

/**
 * Captures referral code from URL and persists to localStorage
 * Should be called on every page load
 */
export const captureReferralCode = (): void => {
  const urlParams = new URLSearchParams(window.location.search);
  const referralCode = urlParams.get('ref');
  
  if (referralCode) {
    console.log('Referral code captured:', referralCode);
    localStorage.setItem(REFERRAL_CODE_KEY, referralCode);
    localStorage.setItem(REFERRAL_TIMESTAMP_KEY, Date.now().toString());
    localStorage.setItem(REFERRAL_LANDING_KEY, window.location.pathname);
  }
};

/**
 * Checks if stored referral code has expired (30 days)
 */
const isReferralExpired = (): boolean => {
  const timestamp = localStorage.getItem(REFERRAL_TIMESTAMP_KEY);
  if (!timestamp) return true;
  
  return Date.now() - parseInt(timestamp) > THIRTY_DAYS_MS;
};

/**
 * Clears all referral tracking data from storage
 */
export const clearReferralData = (): void => {
  localStorage.removeItem(REFERRAL_CODE_KEY);
  localStorage.removeItem(REFERRAL_TIMESTAMP_KEY);
  localStorage.removeItem(REFERRAL_LANDING_KEY);
  // Also clear legacy sessionStorage key
  sessionStorage.removeItem('referral_code');
};

/**
 * Gets the current referral tracking data
 * Returns null for referralCode if expired
 */
export const getReferralTracking = (): ReferralTracking => {
  // First, capture any new referral code from URL
  captureReferralCode();
  
  // Get visitor ID using unified utility
  const visitorId = getVisitorId();
  
  // Check for expiry
  if (isReferralExpired()) {
    clearReferralData();
    return { referralCode: null, visitorId, campaignSource: null };
  }
  
  // Get stored referral code (from localStorage)
  const referralCode = localStorage.getItem(REFERRAL_CODE_KEY);
  
  // Get campaign source from landing page
  const landingPage = localStorage.getItem(REFERRAL_LANDING_KEY) || '/';
  let campaignSource: string | null = null;
  
  if (landingPage.startsWith('/promo/')) {
    campaignSource = landingPage.replace('/promo/', '').split('?')[0];
  } else if (landingPage === '/') {
    campaignSource = 'homepage';
  } else {
    campaignSource = landingPage.replace('/', '').split('?')[0] || 'homepage';
  }
  
  return {
    referralCode,
    visitorId,
    campaignSource
  };
};

/**
 * Tracks a referral conversion (registration, form submission, etc.)
 * Includes self-referral prevention and duplicate check (handled server-side)
 */
export const trackReferralConversion = async (
  conversionType: 'registration' | 'form_submission' | 'consultation',
  conversionData: Record<string, any> = {},
  referredUserId?: string
) => {
  const { referralCode, visitorId, campaignSource } = getReferralTracking();
  
  if (!referralCode) {
    console.log('No referral code found, skipping referral tracking');
    return null;
  }

  try {
    console.log('Tracking referral conversion:', {
      referralCode,
      conversionType,
      campaignSource,
      referredUserId
    });

    const { data, error } = await supabase.rpc('track_referral_conversion', {
      p_referral_code: referralCode,
      p_conversion_type: conversionType,
      p_conversion_data: { ...conversionData, campaign_source: campaignSource },
      p_visitor_id: visitorId,
      p_referred_user_id: referredUserId || null
    });

    if (error) {
      console.error('Error tracking referral conversion:', error);
      return null;
    }

    if (data) {
      console.log('Referral conversion tracked successfully:', data);
      
      // Only clear referral data after successful registration conversion
      if (conversionType === 'registration') {
        clearReferralData();
      }
      
      return data;
    } else {
      console.log('Referral conversion returned null (possibly self-referral or duplicate)');
      return null;
    }
  } catch (error) {
    console.error('Error in trackReferralConversion:', error);
    return null;
  }
};

/**
 * Initialize referral tracking on app load
 * Captures ref param and sets up persistence
 */
export const initializeReferralTracking = () => {
  // Migrate legacy sessionStorage to localStorage
  const legacyCode = sessionStorage.getItem('referral_code');
  if (legacyCode && !localStorage.getItem(REFERRAL_CODE_KEY)) {
    localStorage.setItem(REFERRAL_CODE_KEY, legacyCode);
    localStorage.setItem(REFERRAL_TIMESTAMP_KEY, Date.now().toString());
    localStorage.setItem(REFERRAL_LANDING_KEY, '/');
    sessionStorage.removeItem('referral_code');
    console.log('Migrated legacy referral code:', legacyCode);
  }
  
  // Capture any new referral code from URL
  captureReferralCode();
  
  const { referralCode, campaignSource } = getReferralTracking();
  
  if (referralCode) {
    console.log('Referral tracking active:', { referralCode, campaignSource });
  }
};

/**
 * Generate a campaign-specific referral URL
 */
export const generateCampaignReferralUrl = (
  referralCode: string,
  campaignSlug?: string
): string => {
  const baseUrl = window.location.origin;
  
  if (campaignSlug) {
    return `${baseUrl}/promo/${campaignSlug}?ref=${referralCode}`;
  }
  
  return `${baseUrl}/?ref=${referralCode}`;
};
