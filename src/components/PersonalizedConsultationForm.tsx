
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
    email: user?.email || '',
    phone: '',
    city: '',
    weddingDate: undefined as Date | undefined,
  });

  const getPersonalizedMessage = () => {
    if (packageName.includes('Essential Love')) {
      return `Perfect choice for your intimate celebration! The ${packageName} package is ideal for capturing those precious moments in a beautiful, personal way.`;
    }
    if (packageName.includes('Dream Wedding')) {
      return `Excellent selection! The ${packageName} package is our most popular choice, offering comprehensive coverage to capture every magical moment of your special day.`;
    }
    if (packageName.includes('Luxury Experience') || packageName.includes('Forever Yours')) {
      return `Outstanding choice! The ${packageName} package represents the ultimate in wedding documentation - every detail, every emotion, perfectly preserved forever.`;
    }
    if (packageName.includes('Intimate Moments')) {
      return `Beautiful choice! The ${packageName} package will capture the essence of your love story with elegance and artistry.`;
    }
    if (packageName.includes('Ever After')) {
      return `Wonderful selection! The ${packageName} package provides complete coverage from ceremony to celebration.`;
    }
    if (packageName.includes('Highlight Reel')) {
      return `Great choice! The ${packageName} package will create a stunning cinematic summary of your wedding day.`;
    }
    if (packageName.includes('Legacy Film')) {
      return `Excellent decision! The ${packageName} package ensures every important moment is beautifully documented.`;
    }
    if (packageName.includes('Cinematic Love Story')) {
      return `Perfect selection! The ${packageName} package will create an epic, Hollywood-style film of your wedding day.`;
    }
    return `Excellent choice! The ${packageName} package will beautifully capture your love story in stunning detail.`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.phone || !formData.city || !formData.weddingDate) {
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
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        weddingDate: format(formData.weddingDate, 'yyyy-MM-dd'),
        packageName: packageName,
        packagePrice: packagePrice,
        timestamp: new Date().toISOString(),
        source: 'wedding_package_consultation_form'
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
          email: user?.email || '',
          phone: '',
          city: '',
          weddingDate: undefined,
        });
        onClose();
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
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
            {packageName} - {packagePrice}
          </DialogTitle>
          <p className="text-gray-600 mt-2 text-sm leading-relaxed">
            {getPersonalizedMessage()}
          </p>
          <p className="text-rose-600 font-medium text-sm mt-2">
            Let's schedule your free consultation! ✨
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="email">Confirm Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Cellphone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
            <Label>Wedding Date</Label>
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
