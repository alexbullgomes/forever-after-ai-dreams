
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PackageInfo {
  name: string;
  price: string;
  type: string;
}

interface ConsultationFormProps {
  userEmail?: string;
  packageInfo: PackageInfo;
  onClose: () => void;
}

const ConsultationForm = ({ userEmail, packageInfo, onClose }: ConsultationFormProps) => {
  const [email, setEmail] = useState(userEmail || "");
  const [cellphone, setCellphone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        console.log('Consultation request submitted successfully');
      }
    } catch (error) {
      console.error('Failed to submit consultation request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
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
          className="w-full focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          autoComplete="email"
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
          className="w-full focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          autoComplete="tel"
        />
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting || !email || !cellphone}
          className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
        >
          {isSubmitting ? "Submitting..." : "📞 Book Free Consultation"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="w-full text-gray-600 hover:text-gray-800 py-2 hover:bg-gray-50"
        >
          Maybe Later
        </Button>
      </div>

      {/* Urgency copy */}
      <p className="text-center text-xs text-gray-500 mt-3">
        Offer expires soon. Lock in your savings today.
      </p>
    </form>
  );
};

export default ConsultationForm;
