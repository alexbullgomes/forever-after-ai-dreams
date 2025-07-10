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
        // First time seeing the popup - start the 72-hour countdown
        startTime = Date.now().toString();
        localStorage.setItem(popupStartTimeKey, startTime);
      }
      
      // Check if 72 hours (259200000 ms) have passed
      const elapsed = Date.now() - parseInt(startTime);
      const seventyTwoHours = 72 * 60 * 60 * 1000; // 72 hours in milliseconds
      
      if (elapsed < seventyTwoHours) {
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