import { useState, useEffect } from 'react';

interface UseAutoOpenChatOptions {
  sessionKey: string;
  delay?: number;
  enabled?: boolean;
}

export const useAutoOpenChat = ({ 
  sessionKey, 
  delay = 10000, 
  enabled = true 
}: UseAutoOpenChatOptions) => {
  const [shouldAutoOpen, setShouldAutoOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Check if chat has already been auto-opened in this session
    const hasAutoOpened = sessionStorage.getItem(sessionKey);
    
    if (hasAutoOpened) {
      return; // Already auto-opened in this session
    }

    // Set timer to auto-open after delay
    const timer = setTimeout(() => {
      setShouldAutoOpen(true);
      // Mark as auto-opened for this session
      sessionStorage.setItem(sessionKey, 'true');
    }, delay);

    // Cleanup timer on unmount
    return () => clearTimeout(timer);
  }, [sessionKey, delay, enabled]);

  return shouldAutoOpen;
};