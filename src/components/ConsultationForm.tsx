
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
import { trackReferralConversion } from '@/utils/affiliateTracking';
import AuthModal from '@/components/AuthModal';

interface PortfolioItem {
  id: number;
  category: string;
  title: string;
  location: string;
  date: string;
  type: string;
  video?: string;
  videoMp4?: string;
  image: string;
}

interface ConsultationFormProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioItem?: PortfolioItem | null;
  serviceName?: string;
}

const ConsultationForm = ({ isOpen, onClose, portfolioItem, serviceName }: ConsultationFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to schedule your consultation.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get or create visitor ID (same as used in Expandable Chat)
      let visitorId = localStorage.getItem('homepage-visitor-id');
      if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem('homepage-visitor-id', visitorId);
      }

      const payload = {
        userId: user?.id || null,
        email: user?.email || '',
        name: formData.name,
        phone: formData.phone,
        visitorId: visitorId,
        timestamp: new Date().toISOString(),
        source: portfolioItem ? 'portfolio_card_click' : serviceName ? 'service_card_click' : 'wedding_consultation_form',
        ...(serviceName && { service: serviceName }),
        ...(portfolioItem && {
          portfolioItem: {
            id: portfolioItem.id,
            title: portfolioItem.title,
            location: portfolioItem.location,
            date: portfolioItem.date,
            type: portfolioItem.type,
            category: portfolioItem.category
          }
        })
      };

      console.log('Sending consultation request:', payload);

      const response = await fetch('https://agcreationmkt.cloud/webhook/dc84492f-9c06-423a-b4fe-84a7e36f801f', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Track referral conversion for consultation form
        await trackReferralConversion('consultation', {
          source: 'homepage_consultation',
          user_name: formData.name,
          user_phone: formData.phone,
          portfolio_item: portfolioItem ? {
            title: portfolioItem.title,
            category: portfolioItem.category
          } : null
        });

        toast({
          title: "Consultation Scheduled! 🎉",
          description: "We'll contact you within 24 hours to confirm your free consultation.",
        });
        
        // Reset form and close
        setFormData({
          name: '',
          phone: '',
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
            <div className="w-16 h-16 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent text-center">
            Creating Memories That Last
          </DialogTitle>
          <p className="text-gray-600 mt-2 text-center">
            Let our assistant guide you and get all your questions answered.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your full name"
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
                  Call in Seconds
                </div>
              )}
            </Button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="text-sm text-gray-600 hover:text-rose-500 transition-colors underline"
            >
              Have the full experience. Log in.
            </button>
          </div>
        </form>
      </DialogContent>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </Dialog>
  );
};

export default ConsultationForm;
