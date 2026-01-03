import React, { useState, useCallback } from 'react';
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

type BookingStep = 'date' | 'checking' | 'slots';

interface BookingFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
  productPrice: number;
  currency?: string;
}

export function BookingFunnelModal({
  isOpen,
  onClose,
  productId,
  productTitle,
  productPrice,
  currency = 'USD',
}: BookingFunnelModalProps) {
  const [step, setStep] = useState<BookingStep>('date');
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  const {
    bookingRequest,
    loading,
    error,
    findOrCreateRequest,
    updateSelectedTime,
    generateTimeSlots,
  } = useBookingRequest(productId);

  const handleDateSubmit = useCallback(async (date: Date, timezone: string) => {
    setEventDate(date);
    setStep('checking');
    
    // Track the booking date selection event
    trackVisitorEvent('booking_date_selected', productTitle, {
      product_id: productId,
      event_date: date.toISOString(),
    });
    
    // Create/find booking request while showing loading
    await findOrCreateRequest(date, timezone);
  }, [findOrCreateRequest, productId, productTitle]);

  const handleCheckingComplete = useCallback(() => {
    setStep('slots');
  }, []);

  const handleTimeSelect = useCallback(async (time: string) => {
    setSelectedTime(time);
    await updateSelectedTime(time);
  }, [updateSelectedTime]);

  const handleCheckout = useCallback(async () => {
    if (!bookingRequest || !selectedTime) return;

    setIsProcessing(true);
    
    // Track the checkout initiation event
    trackVisitorEvent('booking_checkout_started', productTitle, {
      product_id: productId,
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
          user_id: user?.id || null,
          visitor_id: user?.id ? null : getOrCreateVisitorId(),
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
  }, [bookingRequest, selectedTime, productId, productTitle, productPrice, user?.id, toast]);

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
            availabilityVersion={bookingRequest.availability_version}
            timeSlots={generateTimeSlots(bookingRequest.availability_version)}
            productTitle={productTitle}
            productPrice={productPrice}
            currency={currency}
            onSelectTime={handleTimeSelect}
            onCheckout={handleCheckout}
            isLoading={isProcessing || loading}
            selectedTime={selectedTime}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
