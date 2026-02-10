import { z } from 'zod';
import { trackReferralConversion } from '@/utils/affiliateTracking';

// Validation schemas
const emailSchema = z.string().trim().email('Invalid email address').max(255, 'Email is too long');
const phoneSchema = z.string().trim().min(7, 'Phone number is too short').max(20, 'Phone number is too long')
  .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Invalid phone number format');

export const validateConsultationForm = (email: string, cellphone: string): boolean => {
  const emailResult = emailSchema.safeParse(email);
  const phoneResult = phoneSchema.safeParse(cellphone);
  return emailResult.success && phoneResult.success;
};

export const getEmailValidationError = (email: string): string | null => {
  const result = emailSchema.safeParse(email);
  return result.success ? null : result.error.errors[0]?.message || 'Invalid email';
};

export const getPhoneValidationError = (phone: string): string | null => {
  const result = phoneSchema.safeParse(phone);
  return result.success ? null : result.error.errors[0]?.message || 'Invalid phone number';
};

export const submitConsultationRequest = async (
  email: string,
  cellphone: string,
  packageInfo: { name: string; price: string; type: string },
  phonePayload?: { phone_e164: string; phone_country_dial_code: string; phone_national: string }
) => {
  const response = await fetch('https://hmdnronxajctsrlgrhey.supabase.co/functions/v1/webhook-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      webhook_type: 'consultation_form',
      payload: {
        event: 'consultation_request',
        email,
        cellphone,
        ...phonePayload,
        package_info: packageInfo,
        discount_offer: '30% OFF',
        source: packageInfo.name,
        timestamp: new Date().toISOString()
      }
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to submit consultation request');
  }

  // Track referral conversion for consultation request
  await trackReferralConversion('consultation', {
    source: 'package_consultation',
    user_email: email,
    package_name: packageInfo.name,
    package_price: packageInfo.price
  });

  return response;
};
