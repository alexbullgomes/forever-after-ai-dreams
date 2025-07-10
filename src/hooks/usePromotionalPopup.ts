import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const usePromotionalPopup = () => {
  const [showPopup, setShowPopup] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if popup was already submitted
    const popupSubmittedKey = "promotional_popup_submitted";
    const popupStartTimeKey = "promotional_popup_start_time";
    const wasSubmitted = sessionStorage.getItem(popupSubmittedKey);
    
    if (user && !wasSubmitted) {
      // Check if countdown has already started
      let startTime = localStorage.getItem(popupStartTimeKey);
      
      if (!startTime) {
        // First time seeing the popup - start the 12-hour countdown
        startTime = Date.now().toString();
        localStorage.setItem(popupStartTimeKey, startTime);
      }
      
      // Check if 12 hours have passed
      const elapsed = Date.now() - parseInt(startTime);
      const twelveHours = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
      
      if (elapsed < twelveHours) {
        // Set a timer to show the popup after 30 seconds
        const timer = setTimeout(() => {
          setShowPopup(true);
        }, 30000); // 30 seconds

        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const closePopup = () => {
    setShowPopup(false);
  };

  return {
    showPopup,
    closePopup,
  };
};