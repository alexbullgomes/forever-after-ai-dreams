import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Heart, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface PromotionalPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const PromotionalPopup = ({ isOpen, onClose }: PromotionalPopupProps) => {
  const { user } = useAuth();
  const [cellphone, setCellphone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    if (timeLeft <= 0 || !isOpen) return;

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
  }, [timeLeft, isOpen]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Validate phone number (basic validation)
  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidPhone(cellphone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "User not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        userId: user.id,
        fullName: user.user_metadata?.full_name || user.user_metadata?.name || '',
        email: user.email || '',
        cellphone: cellphone.trim(),
        event: "wedding_discount_popup",
        timestamp: new Date().toISOString(),
      };

      const response = await fetch('https://agcreationmkt.cloud/webhook/0fe48135-df84-4d58-8998-11a3aafb23b7', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "Success! 🎉",
          description: "Your 30% discount has been claimed! We'll contact you soon.",
        });
        
        // Mark as submitted to prevent showing again
        localStorage.setItem('wedding_discount_popup_submitted', 'true');
        onClose();
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to claim discount. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMaybeLater = () => {
    // Mark as seen but not submitted
    localStorage.setItem('wedding_discount_popup_seen', 'true');
    onClose();
  };

  // Don't render if offer expired
  if (timeLeft <= 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 p-0 gap-0 rounded-xl overflow-hidden bg-gradient-to-br from-rose-500 to-pink-500 border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-white/20 hover:bg-white/30 p-1.5"
        >
          <X className="h-4 w-4 text-white" />
          <span className="sr-only">Close</span>
        </button>

        {/* Header Section */}
        <div className="px-6 pt-8 pb-6 text-center text-white">
          {/* Heart Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" fill="white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold mb-2">
            Unlock 30% OFF on Your Wedding Package!
          </h2>
          
          {/* Subtitle */}
          <p className="text-white/90 text-sm mb-6">
            Personalize your experience with just your phone number.
          </p>

          {/* Countdown Timer */}
          <div className="bg-white rounded-lg p-4 mx-4">
            <div className="flex items-center justify-center gap-2 text-gray-600 text-sm mb-2">
              <Clock className="w-4 h-4" />
              <span>Your 30% OFF offer expires in:</span>
            </div>
            <div className="text-2xl font-bold text-rose-500 tracking-wider">
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone Input */}
            <div>
              <label htmlFor="cellphone" className="block text-sm font-medium text-gray-700 mb-2">
                Cellphone
              </label>
              <Input
                id="cellphone"
                type="tel"
                placeholder="(555) 123-4567"
                value={cellphone}
                onChange={(e) => setCellphone(e.target.value)}
                className="w-full"
                required
              />
            </div>

            {/* CTA Button */}
            <Button
              type="submit"
              disabled={!isValidPhone(cellphone) || isSubmitting}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                "🎁 Claim My Discount"
              )}
            </Button>

            {/* Maybe Later Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleMaybeLater}
                className="text-gray-500 hover:text-gray-700 text-sm underline transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </form>

          {/* Footer Text */}
          <p className="text-xs text-gray-400 text-center mt-4">
            Offer expires soon. Lock in your savings today.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionalPopup;