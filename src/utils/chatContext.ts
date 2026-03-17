/**
 * Captures page context and attribution data for chat messages.
 * This metadata is stored in the messages.metadata JSONB column
 * and forwarded to n8n via the emit_message_webhook trigger.
 */
export function getChatMetadata() {
  const referralCode = localStorage.getItem('everafter_referral_code');
  const pathname = window.location.pathname;
  let pageType = 'other';
  let campaignSlug: string | null = null;

  if (pathname === '/') {
    pageType = 'homepage';
  } else if (pathname.startsWith('/promo/')) {
    pageType = 'campaign';
    campaignSlug = pathname.split('/promo/')[1]?.split('?')[0] || null;
  } else if (pathname.startsWith('/user-dashboard')) {
    pageType = 'dashboard';
  } else if (pathname.startsWith('/blog')) {
    pageType = 'blog';
  } else if (pathname.startsWith('/weddingquiz')) {
    pageType = 'quiz';
  }

  return {
    context: {
      page_url: window.location.href,
      page_path: pathname,
      page_title: document.title,
      referrer: document.referrer || null,
      page_type: pageType,
      campaign_slug: campaignSlug,
    },
    attribution: referralCode
      ? {
          referral_code: referralCode,
          source_type: campaignSlug ? 'campaign' : 'organic',
        }
      : null,
  };
}
