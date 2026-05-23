import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/utils/analytics';

/**
 * Sends a GA4 page_view on every React Router navigation.
 * Admin /dashboard/* routes are skipped inside trackPageView.
 */
export const GoogleAnalyticsTracker = () => {
  const location = useLocation();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    const key = location.pathname + location.search;
    if (lastTracked.current === key) return;
    lastTracked.current = key;
    // Defer to next tick so document.title (set by react-helmet-async) is current.
    const id = window.setTimeout(() => {
      trackPageView(location.pathname + location.search);
    }, 0);
    return () => window.clearTimeout(id);
  }, [location.pathname, location.search]);

  return null;
};

export default GoogleAnalyticsTracker;
