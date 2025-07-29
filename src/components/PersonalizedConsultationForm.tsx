import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Heart, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

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

  const getPersonalizedMessage = () => {
    return `Perfect choice! Let's capture your special day beautifully.`;
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) {
      return numbers;
    }
    if (numbers.length <= 6) {
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    }
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
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
        city: formData.city,
        weddingDate: format(formData.weddingDate, 'yyyy-MM-dd'),
        packageName: packageName,
        packagePrice: packagePrice,
        timestamp: new Date().toISOString(),
        source: packageName
      };

      console.log('Sending package consultation request:', payload);

      const response = await fetch('https://automation.agcreationmkt.com/webhook/bb88400e-5a7e-47a4-89a1-d8f7171f3238', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
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
        window.location.href = '/planner?openChat=true';
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
            <div className="w-16 h-16 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="text-center space-y-3">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
              {packageName} - {packagePrice}
            </DialogTitle>
          </div>
          <p className="text-gray-600 mt-4 text-sm leading-relaxed text-center">
            {getPersonalizedMessage()}
          </p>
          <p className="text-rose-600 font-medium text-sm mt-2 text-center">
            Let's schedule your free consultation! ✨
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="phone">Cellphone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="(555) 123-4567"
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
                  disabled={(date) => date < new Date()}
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
              className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
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
