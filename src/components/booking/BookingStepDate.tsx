import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { useBookingDateValidation } from '@/utils/dateValidation';

interface BookingStepDateProps {
  productTitle: string;
  onSubmit: (date: Date, timezone: string) => void;
  isLoading: boolean;
}

export function BookingStepDate({ productTitle, onSubmit, isLoading }: BookingStepDateProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  // Use centralized date validation for consistent timezone-safe behavior
  // This ensures today and all future dates are selectable
  // Only past dates (< today) are disabled
  const { disabledDays, timezone } = useBookingDateValidation();

  const handleSubmit = () => {
    if (selectedDate) {
      onSubmit(selectedDate, timezone);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
          <CalendarDays className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">When is your event?</h3>
        <p className="text-sm text-muted-foreground">
          Select your preferred date for {productTitle}
        </p>
      </div>

      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        disabled={disabledDays}
        className="rounded-md border"
        initialFocus
      />

      {selectedDate && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Selected: <span className="font-medium text-foreground">{format(selectedDate, 'MMMM d, yyyy')}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Timezone: {timezone}
          </p>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!selectedDate || isLoading}
        className="w-full bg-brand-gradient hover:opacity-90"
        size="lg"
      >
        {isLoading ? 'Processing...' : 'Check Availability'}
      </Button>
    </div>
  );
}
