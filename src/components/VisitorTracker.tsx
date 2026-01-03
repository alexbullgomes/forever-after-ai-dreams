import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { upsertVisitor, migrateOldVisitorIds, updateLastSeen } from '@/utils/visitor';

/**
 * Component that automatically tracks visitor activity
 * Mount at app root level to capture all page views and visitor data
 */
export const VisitorTracker = () => {
  const location = useLocation();
  const isInitialized = useRef(false);
  const lastPath = useRef<string | null>(null);

  // Initialize visitor on mount
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    
    // Migrate old visitor IDs if they exist
    migrateOldVisitorIds();
    
    // Create/update visitor record with initial data
    upsertVisitor();
  }, []);

  // Track page navigation
  useEffect(() => {
    // Skip if same path (avoid duplicate tracking)
    if (lastPath.current === location.pathname) return;
    lastPath.current = location.pathname;
    
    // Update last seen on navigation
    updateLastSeen();
  }, [location.pathname]);

  // This component doesn't render anything
  return null;
};

export default VisitorTracker;
