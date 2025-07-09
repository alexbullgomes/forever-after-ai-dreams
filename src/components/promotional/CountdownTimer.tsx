import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  isOpen: boolean;
  onExpired: () => void;
}

export const CountdownTimer = ({ isOpen, onExpired }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60); // 24 hours in seconds

  // Initialize countdown timer
  useEffect(() => {
    if (!isOpen) return;
    
    const savedExpiry = localStorage.getItem('wedding_discount_popup_expiry');
    const now = new Date().getTime();
    
    if (savedExpiry) {
      const expiryTime = parseInt(savedExpiry);
      const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
      setTimeLeft(remaining);
    } else {
      // Set 24 hours from now
      const expiryTime = now + (24 * 60 * 60 * 1000);
      localStorage.setItem('wedding_discount_popup_expiry', expiryTime.toString());
      setTimeLeft(24 * 60 * 60);
    }
  }, [isOpen]);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0 || !isOpen) {
      if (timeLeft <= 0) {
        onExpired();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          localStorage.removeItem('wedding_discount_popup_expiry');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isOpen, onExpired]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg p-4 mx-4">
      <div className="flex items-center justify-center gap-2 text-gray-600 text-sm mb-2">
        <Clock className="w-4 h-4" />
        <span>Your 30% OFF offer expires in:</span>
      </div>
      <div className="text-2xl font-bold text-rose-500 tracking-wider">
        {formatTime(timeLeft)}
      </div>
    </div>
  );
};