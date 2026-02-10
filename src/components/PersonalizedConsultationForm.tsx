import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PhoneNumberField, { buildPhonePayload } from '@/components/ui/phone-number-field';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Heart, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { trackReferralConversion } from '@/utils/affiliateTracking';
import { isDateInPast } from '@/utils/dateValidation';

interface PersonalizedConsultationFormProps {
  isOpen: boolean;
  onClose: () => void;
  packageName: string;
  packagePrice: string;
}

const PersonalizedConsultationForm = ({ 
  isOpen, 
  onClose, 
  packageName, 
  packagePrice 
}: PersonalizedConsultationFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    city: '',
    weddingDate: undefined as Date | undefined,
  });
  const [dialCode, setDialCode] = useState('+1');

  const getPersonalizedMessage = () => {
    return `Perfect choice! Let's capture your special day beautifully.`;
  };

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, phone: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone || !formData.city || !formData.weddingDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to schedule your consultation.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        userId: user?.id || null,
        email: user?.email || '',
        phone: formData.phone,
        ...buildPhonePayload(dialCode, formData.phone),
        city: formData.city,
        weddingDate: format(formData.weddingDate, 'yyyy-MM-dd'),
        packageName: packageName,
        packagePrice: packagePrice,
        timestamp: new Date().toISOString(),
        source: packageName
      };

      console.log('[PersonalizedConsultationForm] Submitting consultation:', payload);

      // Use edge function proxy to bypass CORS
      const response = await fetch('https://hmdnronxajctsrlgrhey.supabase.co/functions/v1/consultation-webhook-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('[PersonalizedConsultationForm] Response status:', response.status);

      if (response.ok) {
        // Track referral conversion for personalized consultation
        await trackReferralConversion('consultation', {
          source: 'package_consultation',
          package_name: packageName,
          package_price: packagePrice,
          user_phone: formData.phone,
          user_city: formData.city,
          wedding_date: formData.weddingDate
        }, user?.id);

        toast({
          title: "Consultation Scheduled! 🎉",
          description: `We'll contact you within 24 hours to discuss your ${packageName} package and plan your perfect wedding day.`,
        });
        
        // Reset form and close
        setFormData({
          phone: '',
          city: '',
          weddingDate: undefined,
        });
        onClose();
        // Redirect to planner page with auto-open chat
        window.location.href = '/services?openChat=true';
      } else {
        throw new Error('Failed to submit consultation request');
      }
    } catch (error) {
      console.error('Error submitting consultation:', error);
      toast({
        title: "Submission Error",
        description: "There was an issue scheduling your consultation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-brand-gradient rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <div className="text-center space-y-3">
          <DialogTitle className="text-2xl font-bold text-brand-gradient bg-brand-gradient bg-clip-text text-transparent">
            {packageName}
          </DialogTitle>
          </div>
          <p className="text-muted-foreground mt-4 text-xs text-center whitespace-nowrap">
            {getPersonalizedMessage()}
          </p>
          <p className="text-brand-primary-from font-medium text-sm mt-2 text-center">
            Let's schedule your free consultation! ✨
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="phone">Cellphone</Label>
            <PhoneNumberField
              id="phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              dialCode={dialCode}
              onDialCodeChange={setDialCode}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Los Angeles, CA"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Event Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.weddingDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.weddingDate ? (
                    format(formData.weddingDate, "PPP")
                  ) : (
                    <span>Pick your special date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.weddingDate}
                  onSelect={(date) => setFormData({ ...formData, weddingDate: date })}
                  disabled={(date) => isDateInPast(date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Maybe Later
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-brand-gradient hover:bg-brand-gradient-hover"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Scheduling...
                </div>
              ) : (
                <div className="flex items-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Book Free Consultation
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PersonalizedConsultationForm;
