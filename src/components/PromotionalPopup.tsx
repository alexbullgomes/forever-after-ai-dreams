import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface PromotionalPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const PromotionalPopup = ({ isOpen, onClose }: PromotionalPopupProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });
  const { user } = useAuth();
  const { toast } = useToast();

  // 24-hour countdown timer
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          clearInterval(timer);
          return prev;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Phone number validation - simplified for better UX
  const isValidPhone = (phone: string) => {
    const digits = phone.replace(/[^\d]/g, '');
    console.log('Phone validation:', { phone, digits, length: digits.length });
    return digits.length === 10;
  };

  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    console.log('Phone change:', { original: e.target.value, formatted, isValid: isValidPhone(formatted) });
    setPhoneNumber(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim() || !isValidPhone(phoneNumber)) {
      toast({
        title: "Valid phone number required",
        description: "Please enter a valid phone number to claim the offer",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch("https://agcreationmkt.cloud/webhook/0fe48135-df84-4d58-8998-11a3aafb23b7", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          fullName: user?.user_metadata?.full_name || user?.user_metadata?.name || "",
          email: user?.email,
          cellphone: phoneNumber.trim(),
          event: "wedding_discount_popup",
        }),
      });

      if (response.ok) {
        // Mark as submitted to prevent showing again
        sessionStorage.setItem("promotional_popup_submitted", "true");
        toast({
          title: "🎉 Discount Claimed!",
          description: "Your 30% wedding package discount has been secured! We'll contact you soon.",
        });
        onClose();
      } else {
        throw new Error("Failed to submit offer");
      }
    } catch (error) {
      console.error("Error submitting offer:", error);
      toast({
        title: "Error",
        description: "Failed to claim discount. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMaybeLater = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0">
        <div className="bg-gradient-to-br from-rose-500 to-pink-500 p-6 text-white">
          <DialogHeader>
            <div className="flex items-center justify-center mb-2">
              <div className="flex items-center space-x-2">
                <Gift className="w-8 h-8 text-white" />
                <Heart className="w-6 h-6 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl font-bold">
              Unlock 30% OFF on Your Wedding Package!
            </DialogTitle>
            <p className="text-center text-rose-100 text-sm">
              Personalize your experience with just your phone number.
            </p>
          </DialogHeader>
        </div>

        <div className="p-6">
          {/* Countdown Timer */}
          <div className="text-center mb-6">
            <p className="text-sm font-medium text-gray-600 mb-2">
              Your 30% OFF offer expires in:
            </p>
            <div className="flex justify-center space-x-2 text-2xl font-bold text-rose-600">
              <span>{String(timeLeft.hours).padStart(2, '0')}</span>
              <span>:</span>
              <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span>:</span>
              <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
          </div>

          <Card className="border-0 shadow-none">
            <CardContent className="space-y-6 p-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    📱 Cellphone
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className="w-full"
                    maxLength={14}
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={loading || !phoneNumber.trim() || !isValidPhone(phoneNumber)}
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Claiming..." : "🎁 Claim My Discount"}
                </Button>
              </form>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleMaybeLater}
                  className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionalPopup;