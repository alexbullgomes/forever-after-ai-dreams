import { supabase } from '@/integrations/supabase/client';

const VISITOR_ID_KEY = 'everafter-visitor-id';
const SESSION_ID_KEY = 'everafter-session-id';

/**
 * Get or create a persistent visitor ID
 */
export const getOrCreateVisitorId = (): string => {
  if (typeof window === 'undefined') {
    return crypto.randomUUID();
  }
  
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
};

/**
 * Get visitor ID if it exists (returns null if not set)
 */
export const getVisitorId = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(VISITOR_ID_KEY);
};

/**
 * Get or create a session ID (resets per browser session)
 */
export const getOrCreateSessionId = (): string => {
  if (typeof window === 'undefined') {
    return crypto.randomUUID();
  }
  
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
};

/**
 * Capture UTM parameters from URL
 */
export const captureUtmParams = (): {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
} => {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  utmKeys.forEach(key => {
    const value = params.get(key);
    if (value) {
      utm[key] = value;
    }
  });
  
  return utm;
};

/**
 * Detect device type from user agent
 */
export const detectDeviceInfo = (): {
  device_type: string;
  browser: string;
  os: string;
  screen_resolution: string;
} => {
  if (typeof window === 'undefined') {
    return { device_type: 'unknown', browser: 'unknown', os: 'unknown', screen_resolution: 'unknown' };
  }
  
  const ua = navigator.userAgent;
  
  // Device type
  let device_type = 'desktop';
  if (/Mobi|Android/i.test(ua)) {
    device_type = 'mobile';
  } else if (/Tablet|iPad/i.test(ua)) {
    device_type = 'tablet';
  }
  
  // Browser detection
  let browser = 'unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  
  // OS detection
  let os = 'unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  // Screen resolution
  const screen_resolution = `${window.screen.width}x${window.screen.height}`;
  
  return { device_type, browser, os, screen_resolution };
};

interface VisitorData {
  visitor_id?: string;
  first_landing_url?: string;
  last_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  screen_resolution?: string;
}

/**
 * Upsert visitor record in Supabase
 */
export const upsertVisitor = async (data?: Partial<VisitorData>): Promise<void> => {
  const visitorId = getOrCreateVisitorId();
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const referrer = typeof document !== 'undefined' ? document.referrer : '';
  const utmParams = captureUtmParams();
  const deviceInfo = detectDeviceInfo();
  
  try {
    // Use upsert pattern to avoid requiring UPDATE policy for anonymous users
    // The INSERT policy (Public can insert visitor records) handles this
    const upsertData = {
      visitor_id: visitorId,
      last_seen_at: new Date().toISOString(),
      last_url: currentUrl,
      // Only set these on first insert (will be ignored on conflict)
      first_landing_url: currentUrl,
      referrer: referrer || undefined,
      utm_source: data?.utm_source || utmParams.utm_source,
      utm_medium: data?.utm_medium || utmParams.utm_medium,
      utm_campaign: data?.utm_campaign || utmParams.utm_campaign,
      utm_term: utmParams.utm_term,
      utm_content: utmParams.utm_content,
      device_type: deviceInfo.device_type,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      screen_resolution: deviceInfo.screen_resolution,
    };

    await supabase
      .from('visitors')
      .upsert(upsertData, { 
        onConflict: 'visitor_id',
        ignoreDuplicates: false 
      });
  } catch (error) {
    console.error('Error upserting visitor:', error);
  }
};

/**
 * Link visitor to authenticated user
 */
export const linkVisitorToUser = async (userId: string): Promise<void> => {
  const visitorId = getVisitorId();
  if (!visitorId) return;
  
  try {
    // Use upsert to link visitor - authenticated user can update their own linked visitor
    await supabase
      .from('visitors')
      .upsert({
        visitor_id: visitorId,
        linked_user_id: userId,
        status: 'linked',
        last_seen_at: new Date().toISOString(),
      }, { 
        onConflict: 'visitor_id',
        ignoreDuplicates: false 
      });
  } catch (error) {
    console.error('Error linking visitor to user:', error);
  }
};

/**
 * Track a visitor event
 */
export const trackVisitorEvent = async (
  eventType: string,
  eventName?: string,
  eventPayload?: Record<string, unknown>
): Promise<void> => {
  const visitorId = getOrCreateVisitorId();
  const sessionId = getOrCreateSessionId();
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const pageTitle = typeof document !== 'undefined' ? document.title : '';
  
  try {
    // Ensure visitor record exists first
    const { data: existingVisitor } = await supabase
      .from('visitors')
      .select('id')
      .eq('visitor_id', visitorId)
      .maybeSingle();
    
    if (!existingVisitor) {
      // Create visitor record first
      await upsertVisitor();
    }
    
    // Insert event
    await supabase
      .from('visitor_events')
      .insert([{
        visitor_id: visitorId,
        event_type: eventType,
        event_name: eventName || undefined,
        page_url: pageUrl,
        page_title: pageTitle,
        event_payload: eventPayload ? JSON.parse(JSON.stringify(eventPayload)) : {},
        session_id: sessionId,
      }]);
  } catch (error) {
    console.error('Error tracking visitor event:', error);
  }
};

/**
 * Update last seen timestamp
 */
export const updateLastSeen = async (): Promise<void> => {
  const visitorId = getVisitorId();
  if (!visitorId) return;
  
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  
  try {
    // Use upsert to update last seen - works with INSERT policy
    await supabase
      .from('visitors')
      .upsert({
        visitor_id: visitorId,
        last_seen_at: new Date().toISOString(),
        last_url: currentUrl,
      }, { 
        onConflict: 'visitor_id',
        ignoreDuplicates: false 
      });
  } catch (error) {
    console.error('Error updating last seen:', error);
  }
};

// Legacy compatibility - migrate old visitor IDs
export const migrateOldVisitorIds = (): void => {
  if (typeof window === 'undefined') return;
  
  const oldHomepageId = localStorage.getItem('homepage-visitor-id');
  const oldBookingId = localStorage.getItem('booking-visitor-id');
  const currentId = localStorage.getItem(VISITOR_ID_KEY);
  
  // If we don't have a unified ID yet, use the first old one we find
  if (!currentId) {
    const idToUse = oldHomepageId || oldBookingId;
    if (idToUse) {
      localStorage.setItem(VISITOR_ID_KEY, idToUse);
    }
  }
  
  // Keep old keys for backward compatibility during transition
  // They can be removed in a future cleanup
};
