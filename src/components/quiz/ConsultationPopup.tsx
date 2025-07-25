
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { initializeCountdown, clearCountdownExpiry } from "./utils/countdownTimer";
import ConsultationPopupHeader from "./ConsultationPopupHeader";
import ConsultationForm from "./ConsultationForm";

interface ConsultationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  packageInfo: {
    name: string;
    price: string;
    type: string;
  };
}

const ConsultationPopup = ({ isOpen, onClose, userEmail, packageInfo }: ConsultationPopupProps) => {
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60); // 24 hours in seconds

  // Initialize countdown timer from localStorage or set 24 hours
  useEffect(() => {
    if (!isOpen) return;
    
    const initialTime = initializeCountdown();
    setTimeLeft(initialTime);
  }, [isOpen]);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0 || !isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearCountdownExpiry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isOpen]);

  // Don't render if offer expired
  if (timeLeft <= 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 p-0 gap-0 rounded-xl overflow-hidden bg-white border border-gray-200 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close button - Enhanced visibility for Chrome */}
        <button
          onClick={onClose}
          type="button"
          className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-white/80 p-1 hover:bg-white"
        >
          <X className="h-4 w-4 text-gray-600" />
          <span className="sr-only">Close</span>
        </button>

        {/* Header */}
        <ConsultationPopupHeader timeLeft={timeLeft} />

        {/* Form */}
        <ConsultationForm
          userEmail={userEmail}
          packageInfo={packageInfo}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ConsultationPopup;
