import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BookingStepDate } from './BookingStepDate';
import { BookingStepChecking } from './BookingStepChecking';
import { BookingStepSlots } from './BookingStepSlots';
import { useBookingRequest } from '@/hooks/useBookingRequest';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getOrCreateVisitorId, trackVisitorEvent } from '@/utils/visitor';
import { saveBookingState, PendingBookingState } from '@/utils/bookingRedirect';

type BookingStep = 'date' | 'checking' | 'slots';

const PENDING_CAMPAIGN_BOOKING_KEY = 'pendingCampaignBooking';

interface BookingFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  productTitle: string;
  productPrice: number;
  currency?: string;
  // Campaign pricing card mode props (for special promotional packages)
  campaignMode?: boolean;
  campaignId?: string;
  campaignSlug?: string;
  cardIndex?: number;
  onAuthRequired?: () => void;
  // Campaign product mode props (for products on campaign pages)
  campaignProductMode?: boolean;
  // Resume from date selection after login
  resumeFromDate?: {
    date: Date;
    timezone: string;
  };
}

export function BookingFunnelModal({
  isOpen,
  onClose,
  productId,
  productTitle,
  productPrice,
  currency = 'USD',
  campaignMode = false,
  campaignId,
  campaignSlug,
  cardIndex,
  onAuthRequired,
  campaignProductMode = false,
  resumeFromDate,
}: BookingFunnelModalProps) {
  const [step, setStep] = useState<BookingStep>('date');
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Auto-resume from date selection after login
  useEffect(() => {
    if (isOpen && resumeFromDate && user) {
      setEventDate(resumeFromDate.date);
      setStep('checking');
      
      trackVisitorEvent('booking_date_selected', productTitle, {
        product_id: productId,
        campaign_mode: campaignMode,
        campaign_id: campaignId,
        event_date: resumeFromDate.date.toISOString(),
        resumed_after_login: true,
      });
      
      findOrCreateRequest(resumeFromDate.date, resumeFromDate.timezone);
    }
  }, [isOpen, resumeFromDate, user]);
  
  const {
    bookingRequest,
    loading,
    error,
    findOrCreateRequest,
    updateSelectedTime,
    generateTimeSlots,
  } = useBookingRequest(productId, campaignMode ? { campaignId: campaignId!, cardIndex: cardIndex! } : undefined);

  const handleDateSubmit = useCallback(async (date: Date, timezone: string) => {
    // For campaign pricing card mode, check auth BEFORE proceeding to availability check
    if (campaignMode && !user) {
      const pendingState: PendingBookingState = {
        type: 'campaign_pricing_card',
        campaignId: campaignId!,
        campaignSlug: campaignSlug!,
        cardIndex: cardIndex!,
        cardTitle: productTitle,
        selectedDate: date.toISOString(),
        timezone: timezone,
        timestamp: Date.now(),
      };
      
      saveBookingState(pendingState);
      
      onClose();
      onAuthRequired?.();
      return;
    }

    // For campaign product mode, check auth BEFORE proceeding to availability check
    if (campaignProductMode && !user) {
      const pendingState: PendingBookingState = {
        type: 'campaign_product',
        campaignId: campaignId!,
        campaignSlug: campaignSlug!,
        productId: productId!,
        productTitle: productTitle,
        selectedDate: date.toISOString(),
        timezone: timezone,
        timestamp: Date.now(),
      };
      
      saveBookingState(pendingState);
      
      onClose();
      onAuthRequired?.();
      return;
    }

    setEventDate(date);
    setStep('checking');
    
    // Track the booking date selection event
    trackVisitorEvent('booking_date_selected', productTitle, {
      product_id: productId,
      campaign_mode: campaignMode,
      campaign_product_mode: campaignProductMode,
      campaign_id: campaignId,
      event_date: date.toISOString(),
    });
    
    // Create/find booking request while showing loading
    await findOrCreateRequest(date, timezone);
  }, [findOrCreateRequest, productId, productTitle, campaignMode, campaignProductMode, campaignId, user, campaignSlug, cardIndex, onClose, onAuthRequired]);

  const handleCheckingComplete = useCallback(() => {
    setStep('slots');
  }, []);

  const handleTimeSelect = useCallback(async (time: string) => {
    setSelectedTime(time);
    await updateSelectedTime(time);
  }, [updateSelectedTime]);

  const handleCheckout = useCallback(async () => {
    if (!bookingRequest || !selectedTime) return;

    // For campaign mode, check auth first
    if (campaignMode && !user) {
      // Store pending booking state
      const pendingBooking = {
        campaignId: campaignId!,
        campaignSlug: campaignSlug!,
        cardIndex: cardIndex!,
        cardTitle: productTitle,
        bookingRequestId: bookingRequest.id,
        eventDate: bookingRequest.event_date,
        selectedTime,
        timestamp: Date.now(),
      };
      localStorage.setItem(PENDING_CAMPAIGN_BOOKING_KEY, JSON.stringify(pendingBooking));
      
      // Close the booking modal and open auth modal
      onClose();
      onAuthRequired?.();
      return;
    }

    setIsProcessing(true);
    
    // Track the checkout initiation event
    trackVisitorEvent('booking_checkout_started', productTitle, {
      product_id: productId,
      campaign_mode: campaignMode,
      campaign_id: campaignId,
      event_date: bookingRequest.event_date,
      selected_time: selectedTime,
      price: productPrice,
    });

    try {
      // Call edge function to create hold and checkout session
      const { data, error: fnError } = await supabase.functions.invoke('create-booking-checkout', {
        body: {
          booking_request_id: bookingRequest.id,
          product_id: productId,
          event_date: bookingRequest.event_date,
          selected_time: selectedTime,
          product_title: productTitle,
          product_price: productPrice,
          currency: currency,
          user_id: user?.id || null,
          visitor_id: user?.id ? null : getOrCreateVisitorId(),
          // Campaign-specific fields
          campaign_mode: campaignMode,
          campaign_id: campaignId || null,
          campaign_slug: campaignSlug || null,
          card_index: cardIndex ?? null,
        },
      });

      if (fnError) throw fnError;

      if (data?.error) {
        toast({
          title: 'Slot no longer available',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      if (data?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast({
        title: 'Checkout failed',
        description: err.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [bookingRequest, selectedTime, productId, productTitle, productPrice, currency, user, toast, campaignMode, campaignId, campaignSlug, cardIndex, onClose, onAuthRequired]);

  const handleClose = () => {
    // Reset state on close
    setStep('date');
    setEventDate(null);
    setSelectedTime(null);
    onClose();
  };

  const getDialogTitle = () => {
    switch (step) {
      case 'date':
        return 'Book Your Session';
      case 'checking':
        return 'Checking Availability';
      case 'slots':
        return 'Select Your Time';
      default:
        return 'Book Your Session';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {step === 'date' && (
          <BookingStepDate
            productTitle={productTitle}
            onSubmit={handleDateSubmit}
            isLoading={loading}
          />
        )}

        {step === 'checking' && eventDate && (
          <BookingStepChecking
            eventDate={eventDate}
            onComplete={handleCheckingComplete}
          />
        )}

        {step === 'slots' && eventDate && bookingRequest && (
          <BookingStepSlots
            eventDate={eventDate}
            productId={productId}
            availabilityVersion={bookingRequest.availability_version}
            productTitle={productTitle}
            productPrice={productPrice}
            currency={currency}
            onSelectTime={handleTimeSelect}
            onDateChange={async (newDate) => {
              setEventDate(newDate);
              setSelectedTime(null);
              const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
              await findOrCreateRequest(newDate, timezone);
            }}
            onCheckout={handleCheckout}
            isLoading={isProcessing || loading}
            selectedTime={selectedTime}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
