import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EstimatedPriceBadge } from "@/components/ui/estimated-price-badge";
import { CreatePackageBadge } from "@/components/ui/create-package-badge";
import { Star, Camera } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import PersonalizedConsultationForm from "../PersonalizedConsultationForm";
import AuthModal from "../AuthModal";
import { BookingFunnelModal } from "../booking/BookingFunnelModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateVisitorId } from "@/utils/visitor";

const PENDING_CAMPAIGN_BOOKING_KEY = 'pendingCampaignBooking';
const BOOKING_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

interface PendingCampaignBooking {
  campaignId: string;
  campaignSlug: string;
  cardIndex: number;
  cardTitle: string;
  bookingRequestId: string;
  eventDate: string;
  selectedTime: string;
  timestamp: number;
}

interface CampaignPricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular: boolean;
  idealFor?: string;
  campaignId: string;
  campaignSlug: string;
  cardIndex: number;
}

export function CampaignPricingCard({
  name,
  price,
  description,
  features,
  popular,
  idealFor,
  campaignId,
  campaignSlug,
  cardIndex,
}: CampaignPricingCardProps) {
  const [isConsultationFormOpen, setIsConsultationFormOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Resume checkout after login
  const resumeCheckout = useCallback(async (pending: PendingCampaignBooking) => {
    setIsResuming(true);
    toast({ title: "Resuming your booking...", description: "Please wait while we redirect you to checkout." });

    try {
      const { data, error } = await supabase.functions.invoke('create-booking-checkout', {
        body: {
          booking_request_id: pending.bookingRequestId,
          product_id: null,
          event_date: pending.eventDate,
          selected_time: pending.selectedTime,
          product_title: pending.cardTitle,
          product_price: 150, // Fixed $150 deposit
          currency: 'USD',
          user_id: user?.id || null,
          visitor_id: user?.id ? null : getOrCreateVisitorId(),
          campaign_mode: true,
          campaign_id: pending.campaignId,
          campaign_slug: pending.campaignSlug,
          card_index: pending.cardIndex,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast({ title: 'Slot no longer available', description: data.error, variant: 'destructive' });
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Resume checkout error:', err);
      toast({ title: 'Checkout failed', description: err.message || 'Please try again', variant: 'destructive' });
    } finally {
      setIsResuming(false);
    }
  }, [user?.id, toast]);

  // Check for pending booking on mount and when user changes
  useEffect(() => {
    if (!user) return;

    const stored = localStorage.getItem(PENDING_CAMPAIGN_BOOKING_KEY);
    if (!stored) return;

    try {
      const pending: PendingCampaignBooking = JSON.parse(stored);

      // Check expiry
      if (Date.now() - pending.timestamp > BOOKING_EXPIRY_MS) {
        localStorage.removeItem(PENDING_CAMPAIGN_BOOKING_KEY);
        return;
      }

      // Only process if matches this card
      if (pending.campaignId !== campaignId || pending.cardIndex !== cardIndex) return;

      localStorage.removeItem(PENDING_CAMPAIGN_BOOKING_KEY);
      resumeCheckout(pending);
    } catch (e) {
      localStorage.removeItem(PENDING_CAMPAIGN_BOOKING_KEY);
    }
  }, [user, campaignId, cardIndex, resumeCheckout]);

  const handleAuthRequired = () => {
    setIsAuthModalOpen(true);
  };

  const handleAuthClose = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <>
      <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl ${
        popular ? 'ring-2 ring-[hsl(var(--brand-primary-from))] scale-105' : 'hover:scale-105'
      }`}>
        {popular && (
          <div className="absolute top-0 left-0 right-0 bg-brand-gradient text-white text-center py-2 text-sm font-semibold">
            <Star className="w-4 h-4 inline mr-1" />
            Most Popular
          </div>
        )}
        
        <CardHeader className={popular ? 'pt-12' : ''}>
          <CardTitle className="text-2xl font-bold text-center text-foreground">
            {name}
          </CardTitle>
          <div className="text-center">
            <span className="text-3xl font-bold text-brand-primary-from">{price}</span>
            <div className="mt-2">
              {name === "Photo & Video Combo" ? <CreatePackageBadge /> : <EstimatedPriceBadge />}
            </div>
          </div>
          <p className="text-center text-muted-foreground italic">{description}</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <div className="w-5 h-5 rounded-full bg-[hsl(var(--brand-primary-from)/0.1)] flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-brand-primary-from"></div>
                </div>
                <span className="text-foreground/80">{feature}</span>
              </li>
            ))}
          </ul>
          
          <div className="space-y-3">
            <Button
              onClick={() => setIsBookingOpen(true)}
              disabled={isResuming}
              className="w-full h-12 bg-brand-gradient hover:opacity-90 text-white font-semibold rounded-lg shadow-lg transition-all duration-300"
            >
              {isResuming ? 'Resuming...' : 'Secure Your Booking'}
            </Button>
            
            <Button
              onClick={() => setIsConsultationFormOpen(true)}
              variant="outline"
              className="w-full h-10"
            >
              <Camera className="w-4 h-4 mr-2" />
              Free Consultation First
            </Button>
          </div>
          
          {idealFor && (
            <div className="pt-2 pb-2 text-center">
              <span className="text-sm font-bold text-foreground">{idealFor}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <BookingFunnelModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        productId={null}
        productTitle={name}
        productPrice={150}
        currency="USD"
        campaignMode={true}
        campaignId={campaignId}
        campaignSlug={campaignSlug}
        cardIndex={cardIndex}
        onAuthRequired={handleAuthRequired}
      />

      <PersonalizedConsultationForm 
        isOpen={isConsultationFormOpen}
        onClose={() => setIsConsultationFormOpen(false)}
        packageName={name}
        packagePrice={price}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleAuthClose}
      />
    </>
  );
}
