import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const usePromotionalPopup = () => {
  const { user, loading } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const previousUserRef = useRef<typeof user>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('Promotional popup: Effect triggered', { 
      user: !!user, 
      loading, 
      userId: user?.id 
    });

    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Don't do anything while auth is loading
    if (loading) {
      console.log('Promotional popup: Auth still loading...');
      return;
    }

    // Detect login: user was null/undefined and now has a value
    const wasLoggedOut = !previousUserRef.current;
    const isNowLoggedIn = !!user;
    
    if (wasLoggedOut && isNowLoggedIn) {
      console.log('Promotional popup: Login detected! Setting up timer...', user.id);
      
      // Check if popup should be shown
      const hasBeenSubmitted = localStorage.getItem('wedding_discount_popup_submitted');
      const hasBeenSeen = localStorage.getItem('wedding_discount_popup_seen');
      const sessionShown = sessionStorage.getItem('promotional_popup_shown');
      
      console.log('Promotional popup storage check:', {
        hasBeenSubmitted: !!hasBeenSubmitted,
        hasBeenSeen: !!hasBeenSeen,
        sessionShown: !!sessionShown
      });
      
      // Show popup only if user hasn't interacted with it before
      if (!hasBeenSubmitted && !sessionShown && !hasBeenSeen) {
        console.log('Promotional popup: Starting 15 second timer...');
        
        timerRef.current = setTimeout(() => {
          console.log('Promotional popup: Timer finished, showing popup');
          setShowPopup(true);
          sessionStorage.setItem('promotional_popup_shown', 'true');
        }, 15000); // 15 seconds
      } else {
        console.log('Promotional popup: Blocked by previous interaction');
      }
    }

    // Update the previous user ref
    previousUserRef.current = user;

    // Reset popup when user logs out
    if (!user && previousUserRef.current) {
      console.log('Promotional popup: User logged out, resetting state');
      setShowPopup(false);
    }

    // Cleanup function
    return () => {
      if (timerRef.current) {
        console.log('Promotional popup: Cleaning up timer');
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [user, loading]);

  const closePopup = () => {
    setShowPopup(false);
  };

  return {
    showPopup,
    closePopup,
  };
};