import React, { useState, useMemo, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarCheck, Clock, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAvailabilityComputation, DayAvailability } from '@/hooks/useAvailabilityComputation';

interface BookingStepSlotsProps {
  eventDate: Date;
  productId: string | null;
  availabilityVersion: 'full' | 'limited';
  productTitle: string;
  productPrice: number;
  currency?: string;
  onSelectTime: (time: string) => void;
  onDateChange?: (date: Date) => void;
  onCheckout: () => void;
  isLoading: boolean;
  selectedTime: string | null;
}

export function BookingStepSlots({
  eventDate,
  productId,
  availabilityVersion,
  productTitle,
  productPrice,
  currency = 'USD',
  onSelectTime,
  onDateChange,
  onCheckout,
  isLoading,
  selectedTime,
}: BookingStepSlotsProps) {
  const [calendarMonth, setCalendarMonth] = useState(eventDate);
  const [monthAvailability, setMonthAvailability] = useState<Record<string, DayAvailability>>({});
  
  const { getMonthAvailability, loading: availabilityLoading } = useAvailabilityComputation();

  // Fetch month availability when productId or month changes
  useEffect(() => {
    const loadMonthAvailability = async () => {
      if (!productId) return;
      const result = await getMonthAvailability(
        productId,
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() // 0-indexed to match JS Date constructor
      );
      setMonthAvailability(result);
    };
    loadMonthAvailability();
  }, [productId, calendarMonth, getMonthAvailability]);

  const formatPrice = (price: number) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    });
    return formatter.format(price);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Dynamic modifiers based on real availability
  const modifiers = useMemo(() => ({
    available: (day: Date) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const status = monthAvailability[dateKey]?.status;
      return status === 'available' && !isSameDay(day, eventDate);
    },
    limited: (day: Date) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const status = monthAvailability[dateKey]?.status;
      return status === 'limited' && !isSameDay(day, eventDate);
    },
    full: (day: Date) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const status = monthAvailability[dateKey]?.status;
      return status === 'full' || status === 'blocked';
    },
    selected: (day: Date) => isSameDay(day, eventDate),
  }), [monthAvailability, eventDate]);

  const modifiersClassNames = {
    available: 'bg-green-100 text-green-900 hover:bg-green-200 cursor-pointer',
    limited: 'bg-yellow-100 text-yellow-900 hover:bg-yellow-200 cursor-pointer',
    full: 'text-muted-foreground/50 line-through cursor-not-allowed',
    selected: 'bg-primary text-primary-foreground font-semibold ring-2 ring-primary',
  };

  // Get time slots from availability data or fallback
  const currentDayAvailability = monthAvailability[format(eventDate, 'yyyy-MM-dd')];
  const timeSlots = useMemo(() => {
    if (currentDayAvailability?.slots && currentDayAvailability.slots.length > 0) {
      return currentDayAvailability.slots;
    }
    // Fallback: generate basic slots if no availability data
    const slots = [];
    const startHour = availabilityVersion === 'full' ? 10 : 15;
    const endHour = availabilityVersion === 'full' ? 18 : 17;
    for (let h = startHour; h < endHour; h++) {
      slots.push({ start: `${h.toString().padStart(2, '0')}:00`, status: 'available' as const });
    }
    return slots;
  }, [currentDayAvailability, availabilityVersion]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const dateKey = format(date, 'yyyy-MM-dd');
    const status = monthAvailability[dateKey]?.status;
    // Only allow selecting available or limited dates
    if (status === 'available' || status === 'limited') {
      onDateChange?.(date);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Success Message */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
        <Sparkles className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-green-900 dark:text-green-100">
            You're in luck — we can fit your date!
          </p>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
            {availabilityVersion === 'full' 
              ? 'All time slots are available for your selected date.'
              : 'Limited slots remaining. Book now to secure your spot!'}
          </p>
        </div>
      </div>

      {/* Limited Availability Warning */}
      {availabilityVersion === 'limited' && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Your exclusive offer has expired. Only limited slots are now available.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calendar View */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Calendar View</h4>
          </div>
          {availabilityLoading ? (
            <div className="flex items-center justify-center h-[280px] rounded-md border">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <Calendar
              mode="single"
              selected={eventDate}
              onSelect={handleDateSelect}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className="rounded-md border pointer-events-auto"
            />
          )}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span>Limited</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-muted border" />
              <span>Unavailable</span>
            </div>
          </div>
        </div>

        {/* Time Slots */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h4 className="font-medium">Select Time</h4>
            </div>
            <Badge variant={availabilityVersion === 'full' ? 'default' : 'secondary'}>
              {timeSlots.filter(s => s.status === 'available' || s.status === 'limited').length} slots
            </Badge>
          </div>
          <ScrollArea className="h-[280px] rounded-md border p-3">
            <div className="grid grid-cols-2 gap-2">
              {timeSlots.map((slot) => {
                const slotStart = typeof slot === 'string' ? slot : slot.start;
                const slotStatus = typeof slot === 'string' ? 'available' : slot.status;
                const isAvailable = slotStatus === 'available' || slotStatus === 'limited';
                
                return (
                  <button
                    key={slotStart}
                    onClick={() => isAvailable && onSelectTime(slotStart)}
                    disabled={!isAvailable}
                    className={cn(
                      'p-3 rounded-lg text-sm font-medium transition-all border',
                      isAvailable && 'hover:border-primary hover:bg-primary/5',
                      slotStatus === 'available' && 'border-border bg-background',
                      slotStatus === 'limited' && 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950/20',
                      (slotStatus === 'full' || slotStatus === 'blocked') && 'bg-muted text-muted-foreground cursor-not-allowed',
                      selectedTime === slotStart && 'border-primary bg-primary/10 text-primary'
                    )}
                  >
                    {formatTime(slotStart)}
                    {slotStatus === 'limited' && <span className="text-xs ml-1 text-yellow-600">!</span>}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Selected Summary & CTA */}
      <div className="pt-4 border-t space-y-4">
        {selectedTime && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Your booking</p>
              <p className="font-medium">
                {format(eventDate, 'MMMM d, yyyy')} at {formatTime(selectedTime)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{productTitle}</p>
              <p className="font-semibold text-lg">{formatPrice(productPrice)}</p>
            </div>
          </div>
        )}

        <Button
          onClick={onCheckout}
          disabled={!selectedTime || isLoading}
          className="w-full bg-brand-gradient hover:opacity-90"
          size="lg"
        >
          {isLoading ? 'Processing...' : 'Hold my date & pay'}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Your slot will be held for 15 minutes while you complete payment
        </p>
      </div>
    </div>
  );
}