import { supabase } from '@/integrations/supabase/client';

export interface ReferralTracking {
  referralCode: string | null;
  visitorId: string | null;
}

export const getReferralTracking = (): ReferralTracking => {
  // Get referral code from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const referralCode = urlParams.get('ref');
  
  // Get visitor ID from localStorage
  const visitorId = localStorage.getItem('homepage-visitor-id');
  
  // Store referral code in session if present
  if (referralCode) {
    sessionStorage.setItem('referral_code', referralCode);
  }
  
  // Get stored referral code if not in URL
  const storedReferralCode = sessionStorage.getItem('referral_code');
  
  return {
    referralCode: referralCode || storedReferralCode,
    visitorId
  };
};

export const trackReferralConversion = async (
  conversionType: 'registration' | 'form_submission' | 'consultation',
  conversionData: Record<string, any> = {},
  referredUserId?: string
) => {
  const { referralCode, visitorId } = getReferralTracking();
  
  if (!referralCode) {
    console.log('No referral code found, skipping referral tracking');
    return;
  }

  try {
    const { data, error } = await supabase.rpc('track_referral_conversion', {
      p_referral_code: referralCode,
      p_conversion_type: conversionType,
      p_conversion_data: conversionData,
      p_visitor_id: visitorId,
      p_referred_user_id: referredUserId || null
    });

    if (error) {
      console.error('Error tracking referral conversion:', error);
    } else {
      console.log('Referral conversion tracked successfully:', data);
      
      // Clear referral code after successful conversion
      if (conversionType === 'registration') {
        sessionStorage.removeItem('referral_code');
      }
    }
  } catch (error) {
    console.error('Error in trackReferralConversion:', error);
  }
};

export const initializeReferralTracking = () => {
  // Set up referral tracking on page load
  const { referralCode } = getReferralTracking();
  
  if (referralCode) {
    console.log('Referral code detected:', referralCode);
  }
};