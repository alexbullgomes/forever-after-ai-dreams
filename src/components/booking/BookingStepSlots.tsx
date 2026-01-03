import React, { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarCheck, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface BookingStepSlotsProps {
  eventDate: Date;
  availabilityVersion: 'full' | 'limited';
  timeSlots: string[];
  productTitle: string;
  productPrice: number;
  currency?: string;
  onSelectTime: (time: string) => void;
  onCheckout: () => void;
  isLoading: boolean;
  selectedTime: string | null;
}

export function BookingStepSlots({
  eventDate,
  availabilityVersion,
  timeSlots,
  productTitle,
  productPrice,
  currency = 'USD',
  onSelectTime,
  onCheckout,
  isLoading,
  selectedTime,
}: BookingStepSlotsProps) {
  const [calendarMonth, setCalendarMonth] = useState(eventDate);

  // Generate calendar days with availability status
  const calendarDays = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

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

  // Custom day render to show availability
  const modifiers = {
    available: (day: Date) => isSameDay(day, eventDate),
    unavailable: (day: Date) => !isSameDay(day, eventDate),
  };

  const modifiersClassNames = {
    available: 'bg-green-100 text-green-900 hover:bg-green-200 font-semibold',
    unavailable: 'text-muted-foreground/50 line-through cursor-not-allowed',
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
          <Calendar
            mode="single"
            selected={eventDate}
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className="rounded-md border"
            disabled
          />
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-muted border line-through" />
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
              {timeSlots.length} slots
            </Badge>
          </div>
          <ScrollArea className="h-[280px] rounded-md border p-3">
            <div className="grid grid-cols-2 gap-2">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => onSelectTime(time)}
                  className={cn(
                    'p-3 rounded-lg text-sm font-medium transition-all',
                    'border hover:border-primary hover:bg-primary/5',
                    selectedTime === time
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background'
                  )}
                >
                  {formatTime(time)}
                </button>
              ))}
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
