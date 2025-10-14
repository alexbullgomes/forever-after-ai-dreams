import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Gift, Star, Zap, Sparkles, Tag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type PromotionalPopupConfig = Database['public']['Tables']['promotional_popups']['Row'];

interface PromotionalPopupProps {
  isOpen: boolean;
  onClose: () => void;
  config: PromotionalPopupConfig;
}

const iconMap: Record<string, any> = {
  gift: Gift,
  heart: Heart,
  star: Star,
  zap: Zap,
  sparkles: Sparkles,
  tag: Tag,
};

const PromotionalPopup = ({ isOpen, onClose, config }: PromotionalPopupProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const IconComponent = iconMap[config.icon] || Gift;

  // Dynamic countdown timer based on config
  useEffect(() => {
    if (!isOpen) return;

    const popupStartTimeKey = `promotional_popup_start_time_${config.id}`;
    let startTime = localStorage.getItem(popupStartTimeKey);
    
    if (!startTime) {
      startTime = Date.now().toString();
      localStorage.setItem(popupStartTimeKey, startTime);
    }

    const updateCountdown = () => {
      const now = Date.now();
      const elapsed = now - parseInt(startTime!);
      const countdownMs = config.countdown_hours * 60 * 60 * 1000;
      const remaining = countdownMs - elapsed;

      if (remaining <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        onClose();
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose, config.id, config.countdown_hours]);

  const isValidPhone = (phone: string) => {
    const digits = phone.replace(/[^\d]/g, '');
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
    setPhoneNumber(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (config.phone_required && (!phoneNumber.trim() || !isValidPhone(phoneNumber))) {
      toast({
        title: "Valid phone number required",
        description: "Please enter a valid phone number to claim the offer",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Get or create visitor ID
      let visitorId = localStorage.getItem('homepage-visitor-id');
      if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem('homepage-visitor-id', visitorId);
      }

      // Store in database
      const { error: dbError } = await supabase
        .from('visitor_popup_submissions')
        .insert({
          visitor_id: visitorId,
          popup_id: config.id,
          phone_number: phoneNumber,
          user_id: user?.id || null,
          metadata: {
            user_email: user?.email,
            user_name: user?.user_metadata?.full_name,
          },
        });

      if (dbError) throw dbError;

      // Cache in localStorage
      const cacheKey = `popup_submission_${config.id}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        visitor_id: visitorId,
        phone_number: phoneNumber,
        submitted_at: new Date().toISOString(),
      }));

      // Send to webhook
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
          visitor_id: visitorId,
          popup_id: config.id,
          event: "wedding_discount_popup",
        }),
      });

      if (response.ok) {
        toast({
          title: "🎉 Discount Claimed!",
          description: "Your discount has been secured! We'll contact you soon.",
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
        <div className={`bg-gradient-to-br ${config.bg_gradient} p-6 text-white`}>
          <DialogHeader>
            <div className="flex items-center justify-center mb-2">
              <IconComponent className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold">
              {config.title}
            </DialogTitle>
            {config.subtitle && (
              <p className="text-center text-white/90 text-sm">
                {config.subtitle}
              </p>
            )}
          </DialogHeader>
        </div>

        <div className="p-6">
          {/* Countdown Timer */}
          <div className="text-center mb-6">
            <p className="text-sm font-medium text-gray-600 mb-2">
              ⏳ Your {config.discount_label} offer expires in:
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
                {config.phone_required && (
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      📱 Phone Number
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
                )}
                
                <Button
                  type="submit"
                  disabled={loading || (config.phone_required && (!phoneNumber.trim() || !isValidPhone(phoneNumber)))}
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Claiming..." : `🎁 ${config.cta_label}`}
                </Button>
              </form>

              <div className="text-center space-y-2">
                {config.legal_note && (
                  <p className="text-xs text-gray-600">
                    👉 {config.legal_note}
                  </p>
                )}
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
