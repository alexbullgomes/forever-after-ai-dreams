
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Heart, Clock, X } from "lucide-react";

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
  const [email, setEmail] = useState(userEmail || "");
  const [cellphone, setCellphone] = useState("");
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60); // 24 hours in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize countdown timer from localStorage or set 24 hours
  useEffect(() => {
    const savedExpiry = localStorage.getItem('consultation_offer_expiry');
    const now = new Date().getTime();
    
    if (savedExpiry) {
      const expiryTime = parseInt(savedExpiry);
      const secondsLeft = Math.max(0, Math.floor((expiryTime - now) / 1000));
      setTimeLeft(secondsLeft);
    } else {
      // Set 24 hours from now
      const expiryTime = now + (24 * 60 * 60 * 1000);
      localStorage.setItem('consultation_offer_expiry', expiryTime.toString());
    }
  }, [isOpen]);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          localStorage.removeItem('consultation_offer_expiry');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !cellphone) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('https://agcreationmkt.cloud/webhook/36fb4d39-8ebe-4ab6-b781-c7d8b73cc9cb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'consultation_request',
          email,
          cellphone,
          package_info: packageInfo,
          discount_offer: '30% OFF',
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        // Close popup and show success
        onClose();
        // You could add a toast notification here
      }
    } catch (error) {
      console.error('Failed to submit consultation request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (timeLeft <= 0) {
    return null; // Don't show if offer expired
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 p-0 gap-0 rounded-xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {/* Header with heart icon */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-center py-6 px-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-white" />
          </div>
          
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white text-center">
              Customize Your Dream Package —<br />
              and Unlock up to 30% OFF
            </DialogTitle>
          </DialogHeader>
          
          <p className="text-rose-100 text-sm mt-2">
            Tell us a bit about your wedding so we can tailor the perfect Photo & Video bundle for you.
          </p>

          {/* Countdown Timer */}
          <div className="mt-4 inline-flex items-center bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
            <Clock className="w-4 h-4 mr-2" />
            Your 30% OFF offer expires in: {formatTime(timeLeft)}
          </div>
        </div>

        {/* Package Info */}
        <div className="px-6 py-4 bg-rose-50 text-center">
          <h3 className="font-semibold text-rose-600 text-lg">{packageInfo.name} - {packageInfo.price}</h3>
          <Badge variant="secondary" className="mt-1">Estimated Price</Badge>
          <p className="text-sm text-gray-600 mt-2">
            Excellent selection! The {packageInfo.name} package is our most popular choice, offering comprehensive coverage to capture every magical moment of your special day.
          </p>
          <p className="text-rose-600 font-medium text-sm mt-2">
            Let's schedule your free consultation!
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cellphone
            </label>
            <Input
              type="tel"
              value={cellphone}
              onChange={(e) => setCellphone(e.target.value)}
              placeholder="(555) 123-4567"
              required
              className="w-full"
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || !email || !cellphone}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isSubmitting ? "Submitting..." : "📞 Book Free Consultation"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="w-full text-gray-600 hover:text-gray-800 py-2"
            >
              Maybe Later
            </Button>
          </div>

          {/* Urgency copy */}
          <p className="text-center text-xs text-gray-500 mt-3">
            Offer expires soon. Lock in your savings today.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ConsultationPopup;
