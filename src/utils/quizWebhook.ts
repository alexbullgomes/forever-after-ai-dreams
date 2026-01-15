import { trackReferralConversion } from './affiliateTracking';

const WEBHOOK_PROXY_URL = "https://hmdnronxajctsrlgrhey.supabase.co/functions/v1/webhook-proxy";

export const sendQuizWebhook = async (
  userLead: {
    fullName: string;
    email: string;
    weddingDate?: string;
  },
  answers: Array<{
    questionId: number;
    answerId: string;
    category: 'photo' | 'video' | 'both';
    intensity: 'essential' | 'mid' | 'premium';
  }>,
  recommendation: {
    category: 'photo' | 'video' | 'both';
    intensity: 'essential' | 'mid' | 'premium';
    packageName: string;
    packagePrice: string;
    packageType: string;
  }
) => {
  try {
    await fetch(WEBHOOK_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        webhook_type: "quiz_completion",
        payload: {
          event: "quiz_completed",
          user: {
            full_name: userLead.fullName,
            email: userLead.email,
            wedding_date: userLead.weddingDate,
          },
          quiz_answers: answers,
          recommendation: recommendation,
          timestamp: new Date().toISOString()
        }
      }),
    });
    
    // Track referral conversion for quiz completion
    await trackReferralConversion('form_submission', {
      source: 'wedding_quiz',
      user_email: userLead.email,
      package_recommendation: recommendation.packageName
    });
    
    console.log("Quiz webhook sent successfully");
  } catch (error) {
    console.error("Failed to send quiz webhook:", error);
    // Don't block the user flow if webhook fails
  }
};
