import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface PromotionalFormProps {
  onSuccess: () => void;
  onMaybeLater: () => void;
}

export const PromotionalForm = ({ onSuccess, onMaybeLater }: PromotionalFormProps) => {
  const { user } = useAuth();
  const [cellphone, setCellphone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        onSuccess();
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
    onMaybeLater();
  };

  return (
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
  );
};