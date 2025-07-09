import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const usePromotionalPopup = () => {
  const { user, loading } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [loginDetected, setLoginDetected] = useState(false);

  useEffect(() => {
    // Don't do anything while auth is loading
    if (loading) return;

    // Check if user just logged in
    if (user && !loginDetected) {
      setLoginDetected(true);
      
      // Check if popup should be shown
      const hasBeenSubmitted = localStorage.getItem('wedding_discount_popup_submitted');
      const hasBeenSeen = localStorage.getItem('wedding_discount_popup_seen');
      const sessionShown = sessionStorage.getItem('promotional_popup_shown');
      
      // Show popup only if:
      // 1. User hasn't submitted before
      // 2. User hasn't seen it this session
      // 3. User hasn't clicked "Maybe Later" recently (within same session)
      if (!hasBeenSubmitted && !sessionShown && !hasBeenSeen) {
        // Wait 15 seconds after login
        const timer = setTimeout(() => {
          setShowPopup(true);
          sessionStorage.setItem('promotional_popup_shown', 'true');
        }, 15000); // 15 seconds

        return () => clearTimeout(timer);
      }
    }

    // Reset login detection when user logs out
    if (!user && loginDetected) {
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