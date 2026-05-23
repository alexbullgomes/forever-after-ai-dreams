/**
 * Google Analytics 4 helper.
 * Safe no-op if gtag is not loaded (e.g. blocked by adblockers).
 * Never pass PII (emails, phones, names, user IDs, visitor IDs, session IDs).
 */

export const GA_MEASUREMENT_ID =
  (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) ||
  'G-M1BNE1BC7Z';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const PII_KEY_PATTERNS = [
  /email/i,
  /phone/i,
  /name$/i,
  /first_?name/i,
  /last_?name/i,
  /user_?id/i,
  /visitor_?id/i,
  /session_?id/i,
  /customer_?id/i,
  /stripe/i,
  /token/i,
  /password/i,
];

const ALLOWED_ID_KEYS = new Set(['campaign_slug', 'post_slug']);

function sanitizeParams(
  params?: Record<string, unknown>
): Record<string, string | number | boolean> {
  if (!params) return {};
  const safe: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (!ALLOWED_ID_KEYS.has(key) && PII_KEY_PATTERNS.some((re) => re.test(key))) {
      continue;
    }
    const t = typeof value;
    if (t === 'string' || t === 'number' || t === 'boolean') {
      safe[key] = value as string | number | boolean;
    }
  }
  return safe;
}

function isAdminPath(path: string): boolean {
  return path.startsWith('/dashboard');
}

export function trackPageView(path: string, title?: string): void {
  try {
    if (typeof window === 'undefined' || !window.gtag) return;
    if (isAdminPath(path)) return;
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
      page_location: window.location.href,
      send_to: GA_MEASUREMENT_ID,
    });
  } catch {
    /* no-op */
  }
}

export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  try {
    if (typeof window === 'undefined' || !window.gtag) return;
    if (isAdminPath(window.location.pathname)) return;
    window.gtag('event', eventName, sanitizeParams(params));
  } catch {
    /* no-op */
  }
}
