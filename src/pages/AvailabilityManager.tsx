import React, { useState, useEffect } from 'react';
import { useAvailabilityComputation, DayAvailability } from '@/hooks/useAvailabilityComputation';
import { useAvailabilityOverrides } from '@/hooks/useAvailabilityOverrides';
import type { PresetType } from '@/hooks/useAvailabilityOverrides';
import { useAvailabilityRules } from '@/hooks/useAvailabilityRules';
import { AvailabilityOverrideModal } from '@/components/availability/AvailabilityOverrideModal';
import { AvailabilityLegend } from '@/components/availability/AvailabilityLegend';
import { QuickPresetsPanel } from '@/components/availability/QuickPresetsPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-500',
  limited: 'bg-yellow-500',
  full: 'bg-red-500',
  blocked: 'bg-gray-400',
  needs_review: 'bg-orange-500',
};

export default function AvailabilityManager() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthAvailability, setMonthAvailability] = useState<Record<string, DayAvailability>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  
  const { getMonthAvailability, loading: computingAvailability } = useAvailabilityComputation();
  const { overrides, fetchOverrides, getDaysWithBookings, applyPreset } = useAvailabilityOverrides();
  const { rules, createRule } = useAvailabilityRules();

  // Fetch availability when month changes
  useEffect(() => {
    loadMonthAvailability();
  }, [currentMonth]);

  const loadMonthAvailability = async () => {
    const result = await getMonthAvailability(
      currentMonth.getFullYear(),
      currentMonth.getMonth()
    );
    setMonthAvailability(result);
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setShowOverrideModal(true);
  };

  const handleOverrideSaved = () => {
    fetchOverrides();
    loadMonthAvailability();
  };

  const handleApplyPreset = async (
    preset: PresetType,
    startDate: Date,
    endDate: Date,
    protectedDates: string[]
  ): Promise<{ applied: number; skipped: number }> => {
    // Get daily capacity from active rule
    const activeRule = rules.find((r) => r.is_active);
    const dailyCapacity = activeRule?.daily_capacity || 1;
    
    return applyPreset(preset, startDate, endDate, protectedDates, dailyCapacity);
  };

  const handlePresetsRefresh = () => {
    fetchOverrides();
    loadMonthAvailability();
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  // Get existing override for a date
  const getOverrideForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return overrides.find(o => o.date === dateStr);
  };

  // Check if global rules exist
  const hasRules = rules.some(r => r.is_active);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Global Availability Calendar</h1>
        <Button variant="outline" size="sm" onClick={loadMonthAvailability}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Rules Warning */}
      {!hasRules && (
        <div className="flex flex-wrap gap-4 items-center">
          <div className="text-sm text-orange-600 flex items-center gap-2 bg-orange-50 dark:bg-orange-950/50 p-3 rounded-md">
            <span>⚠️ No global availability rules configured.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await createRule({
                  product_id: null,
                  timezone: 'America/Los_Angeles',
                  workdays: [0, 1, 2, 3, 4, 5, 6],
                  start_time: '10:00',
                  end_time: '18:00',
                  slot_minutes: 60,
                  buffer_minutes: 0,
                  capacity_type: 'daily',
                  daily_capacity: 1,
                  slot_capacity: 1,
                  is_active: true,
                } as any);
                loadMonthAvailability();
              }}
            >
              Create Default Rules
            </Button>
          </div>
        </div>
      )}

      {/* Quick Presets Panel */}
      <QuickPresetsPanel
        currentMonth={currentMonth}
        rules={rules}
        onApplyPreset={handleApplyPreset}
        getDaysWithBookings={getDaysWithBookings}
        onRefresh={handlePresetsRefresh}
      />

      {/* Legend */}
      <AvailabilityLegend />

      {/* Calendar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">
            {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {computingAvailability ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary-from" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}

              {/* Empty cells before first day */}
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-20" />
              ))}

              {/* Calendar days */}
              {daysInMonth.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const availability = monthAvailability[dateStr];
                const status = availability?.status || 'needs_review';
                const override = getOverrideForDate(day);
                const statusColor = STATUS_COLORS[status] || STATUS_COLORS.needs_review;

                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      'h-20 p-1 rounded-md border border-border hover:border-primary transition-colors relative',
                      isToday(day) && 'ring-2 ring-primary',
                      override && 'ring-1 ring-blue-400'
                    )}
                  >
                    <div className="flex flex-col h-full">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isToday(day) && 'text-primary'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                      <div className="flex-1 flex items-center justify-center">
                        <div
                          className={cn(
                            'w-3 h-3 rounded-full',
                            statusColor
                          )}
                        />
                      </div>
                      {availability && (
                        <span className="text-xs text-muted-foreground">
                          {availability.available_count}/{availability.total_count}
                        </span>
                      )}
                      {override && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Override Modal */}
      {selectedDate && (
        <AvailabilityOverrideModal
          isOpen={showOverrideModal}
          onClose={() => {
            setShowOverrideModal(false);
            setSelectedDate(null);
          }}
          date={selectedDate}
          existingOverride={getOverrideForDate(selectedDate)}
          onSaved={handleOverrideSaved}
        />
      )}
    </div>
  );
}
