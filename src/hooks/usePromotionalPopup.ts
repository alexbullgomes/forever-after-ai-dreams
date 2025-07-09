import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const usePromotionalPopup = () => {
  const { user, loading } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [loginDetected, setLoginDetected] = useState(false);

  useEffect(() => {
    // Don't do anything while auth is loading
    if (loading) {
      console.log('Promotional popup: Auth still loading...');
      return;
    }

    // Check if user just logged in
    if (user && !loginDetected) {
      console.log('Promotional popup: User login detected, setting up timer...');
      setLoginDetected(true);
      
      // Check if popup should be shown
      const hasBeenSubmitted = localStorage.getItem('wedding_discount_popup_submitted');
      const hasBeenSeen = localStorage.getItem('wedding_discount_popup_seen');
      const sessionShown = sessionStorage.getItem('promotional_popup_shown');
      
      console.log('Promotional popup storage check:', {
        hasBeenSubmitted: !!hasBeenSubmitted,
        hasBeenSeen: !!hasBeenSeen,
        sessionShown: !!sessionShown
      });
      
      // Show popup only if:
      // 1. User hasn't submitted before
      // 2. User hasn't seen it this session
      // 3. User hasn't clicked "Maybe Later" recently (within same session)
      if (!hasBeenSubmitted && !sessionShown && !hasBeenSeen) {
        console.log('Promotional popup: Starting 15 second timer...');
        // Wait 15 seconds after login
        const timer = setTimeout(() => {
          console.log('Promotional popup: Timer finished, showing popup');
          setShowPopup(true);
          sessionStorage.setItem('promotional_popup_shown', 'true');
        }, 15000); // 15 seconds

        return () => {
          console.log('Promotional popup: Timer cleanup');
          clearTimeout(timer);
        };
      } else {
        console.log('Promotional popup: Blocked by previous interaction');
      }
    }

    // Reset login detection when user logs out
    if (!user && loginDetected) {
      console.log('Promotional popup: User logged out, resetting state');
      setLoginDetected(false);
      setShowPopup(false);
    }
  }, [user, loading, loginDetected]);

  const closePopup = () => {
    setShowPopup(false);
  };

  return {
    showPopup,
    closePopup,
  };
};