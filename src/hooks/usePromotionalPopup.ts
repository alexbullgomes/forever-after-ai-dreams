import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const usePromotionalPopup = () => {
  const [showPopup, setShowPopup] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if popup was already shown in this session
    const popupShownKey = "promotional_popup_shown";
    const wasShown = sessionStorage.getItem(popupShownKey);
    
    if (user && !wasShown) {
      // Set a timer to show the popup after 30 seconds
      const timer = setTimeout(() => {
        setShowPopup(true);
        // Mark as shown for this session
        sessionStorage.setItem(popupShownKey, "true");
      }, 30000); // 30 seconds

      return () => clearTimeout(timer);
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