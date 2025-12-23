import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { X, User, Phone } from 'lucide-react';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import AuthModal from '@/components/AuthModal';
import { trackReferralConversion } from '@/utils/affiliateTracking';

// Card data interface for portfolio and gallery items
interface CardData {
  cardId?: string | number;
  cardTitle?: string;
  category?: string;
  locationCity?: string;
  eventSeasonOrDate?: string;
  collectionSection?: string;
  thumbnailUrl?: string;
  pageUrl?: string;
  // Additional fields for backward compatibility
  title?: string;
  type?: string;
  id?: string | number;
}

interface GalleryLeadFormProps {
  isOpen: boolean;
  onClose: () => void;
  cardData?: CardData;
  onSuccess?: () => void;
}

export interface GalleryLeadFormRef {
  openWithCard: (cardData: CardData) => void;
}

const GalleryLeadForm = forwardRef<GalleryLeadFormRef, GalleryLeadFormProps>(({ 
  isOpen: externalIsOpen, 
  onClose: externalOnClose, 
  cardData: externalCardData,
  onSuccess 
}, ref) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [internalCardData, setInternalCardData] = useState<CardData | undefined>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Use external props if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const cardData = externalCardData || internalCardData;
  
  const onClose = () => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
      setInternalCardData(undefined);
    }
    resetForm();
  };

  // Expose openWithCard method via ref
  useImperativeHandle(ref, () => ({
    openWithCard: (data: CardData) => {
      setInternalCardData(data);
      setInternalIsOpen(true);
    }
  }), []);

  const resetForm = () => {
    setName('');
    setPhone('');
  };

  // Get the title for H1 - prioritize cardTitle, then title, then default
  const getTitle = () => {
    if (cardData?.cardTitle) return cardData.cardTitle;
    if (cardData?.title) return cardData.title;
    return "Get Your Personalized Quote";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !phone.trim()) {
      toast({
        title: "Error",
        description: "Name and phone number are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get or generate visitorId
      let visitorId = localStorage.getItem('homepage-visitor-id');
      if (!visitorId) {
        visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('homepage-visitor-id', visitorId);
      }

      // Prepare payload with card metadata
      const payload: any = {
        event: 'consultation_request',
        name: name.trim(),
        cellphone: phone.trim(),
        visitorId,
        timestamp: new Date().toISOString(),
        source: 'Gallery Lead Form'
      };

      // Add user info if authenticated
      if (user) {
        payload.userId = user.id;
        payload.userEmail = user.email;
      }

      // Add card metadata if available
      if (cardData) {
        payload.cardMetadata = {
          cardId: cardData.cardId || cardData.id,
          cardTitle: cardData.cardTitle || cardData.title,
          category: cardData.category,
          locationCity: cardData.locationCity,
          eventSeasonOrDate: cardData.eventSeasonOrDate,
          collectionSection: cardData.collectionSection,
          thumbnailUrl: cardData.thumbnailUrl,
          pageUrl: cardData.pageUrl,
          type: cardData.type
        };
      }

      const response = await fetch('https://agcreationmkt.cloud/webhook/dc84492f-9c06-423a-b4fe-84a7e36f801f', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to submit consultation request');
      }

      // Track referral conversion for affiliate program
      await trackReferralConversion('consultation', {
        source: 'gallery_lead_form',
        user_name: name.trim(),
        user_phone: phone.trim(),
        card_title: cardData?.cardTitle || cardData?.title,
        card_category: cardData?.category,
        collection_section: cardData?.collectionSection
      }, user?.id);

      toast({
        title: "Request Submitted!",
        description: "Thank you! We'll contact you soon.",
      });

      resetForm();
      onClose();
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting consultation request:', error);
      toast({
        title: "Error",
        description: "Failed to submit your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginClick = () => {
    setShowAuthModal(true);
  };

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogOverlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <DialogContent className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full max-w-md p-0 bg-card rounded-2xl shadow-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-border text-center">
              <h1 className="text-xl font-bold text-foreground pr-8">
                {getTitle()}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Let our assistant guide you — fill out the form and submit to get all your questions answered.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <User className="inline w-4 h-4 mr-1" />
                  Name *
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full focus:ring-2 focus:ring-brand-primary-from focus:border-brand-primary-from rounded-lg"
                  autoComplete="name"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Phone className="inline w-4 h-4 mr-1" />
                  Cellphone *
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your phone number"
                  required
                  className="w-full focus:ring-2 focus:ring-brand-primary-from focus:border-brand-primary-from rounded-lg"
                  autoComplete="tel"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !name.trim() || !phone.trim()}
                  className="w-full bg-brand-gradient hover:bg-brand-gradient-hover text-white py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    'Call in Seconds'
                  )}
                </Button>
                
                <Button
                  type="button"
                  onClick={onClose}
                  variant="outline"
                  className="w-full py-3 rounded-lg font-medium border-border text-foreground hover:bg-muted"
                >
                  Maybe Later
                </Button>
              </div>

              {/* Login CTA */}
              <div className="text-center pt-2">
                {user ? (
                  <a 
                    href="/admin-dashboard" 
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    You're in. Go to Dashboard
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Have the full experience.{' '}
                    <button
                      type="button"
                      onClick={handleLoginClick}
                      className="text-primary hover:underline focus:outline-none"
                    >
                      Log in
                    </button>
                    .
                  </p>
                )}
              </div>
            </form>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={handleAuthModalClose}
      />
    </>
  );
});

GalleryLeadForm.displayName = 'GalleryLeadForm';

export default GalleryLeadForm;