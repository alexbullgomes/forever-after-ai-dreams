import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar as CalendarIcon, Briefcase, Palmtree, RotateCcw, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addMonths, endOfMonth, startOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AvailabilityRule } from '@/hooks/useAvailabilityRules';

export type PresetType = 'weekdays-available' | 'weekends-available' | 'reset';
export type RangeType = 'this-month' | 'next-3-months' | 'next-6-months' | 'custom';

interface QuickPresetsPanelProps {
  currentMonth: Date;
  rules: AvailabilityRule[];
  onApplyPreset: (
    preset: PresetType,
    startDate: Date,
    endDate: Date,
    protectedDates: string[]
  ) => Promise<{ applied: number; skipped: number }>;
  getDaysWithBookings: (startDate: string, endDate: string) => Promise<string[]>;
  onRefresh: () => void;
}

interface PresetSummary {
  preset: PresetType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  protectedDays: string[];
  daysToApply: number;
}

export function QuickPresetsPanel({
  currentMonth,
  rules,
  onApplyPreset,
  getDaysWithBookings,
  onRefresh,
}: QuickPresetsPanelProps) {
  const [rangeType, setRangeType] = useState<RangeType>('this-month');
  const [customStart, setCustomStart] = useState<Date | undefined>(undefined);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(undefined);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [presetSummary, setPresetSummary] = useState<PresetSummary | null>(null);
  const [applying, setApplying] = useState(false);
  const { toast } = useToast();

  const getDateRange = (): { start: Date; end: Date } => {
    const today = new Date();
    switch (rangeType) {
      case 'this-month':
        return { start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) };
      case 'next-3-months':
        return { start: startOfMonth(today), end: endOfMonth(addMonths(today, 2)) };
      case 'next-6-months':
        return { start: startOfMonth(today), end: endOfMonth(addMonths(today, 5)) };
      case 'custom':
        return {
          start: customStart || startOfMonth(today),
          end: customEnd || endOfMonth(addMonths(today, 2)),
        };
      default:
        return { start: startOfMonth(today), end: endOfMonth(today) };
    }
  };

  const countDaysInRange = (start: Date, end: Date, preset: PresetType, protectedDays: string[]): number => {
    const days = eachDayOfInterval({ start, end });
    let count = 0;

    for (const day of days) {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayOfWeek = getDay(day); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isProtected = protectedDays.includes(dateStr);

      if (preset === 'reset') {
        // Reset applies to all days
        count++;
      } else if (preset === 'weekdays-available') {
        // Block weekends, keep weekdays available (skip protected weekdays)
        if (isWeekend || !isProtected) count++;
      } else if (preset === 'weekends-available') {
        // Block weekdays, keep weekends available (skip protected weekends)
        if (!isWeekend || !isProtected) count++;
      }
    }

    return count;
  };

  const handlePresetClick = async (preset: PresetType) => {
    const { start, end } = getDateRange();
    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');

    // Fetch protected days
    const protectedDays = await getDaysWithBookings(startStr, endStr);
    const totalDays = eachDayOfInterval({ start, end }).length;
    const daysToApply = countDaysInRange(start, end, preset, protectedDays);

    setPresetSummary({
      preset,
      startDate: start,
      endDate: end,
      totalDays,
      protectedDays,
      daysToApply,
    });
    setShowConfirmDialog(true);
  };

  const handleConfirmApply = async () => {
    if (!presetSummary) return;

    setApplying(true);
    try {
      const result = await onApplyPreset(
        presetSummary.preset,
        presetSummary.startDate,
        presetSummary.endDate,
        presetSummary.protectedDays
      );

      toast({
        title: 'Preset applied successfully',
        description: `Updated ${result.applied} days${result.skipped > 0 ? `, skipped ${result.skipped} days with bookings` : ''}.`,
      });

      onRefresh();
    } catch (error: any) {
      toast({
        title: 'Failed to apply preset',
        description: error.message || 'An error occurred.',
        variant: 'destructive',
      });
    } finally {
      setApplying(false);
      setShowConfirmDialog(false);
      setPresetSummary(null);
    }
  };

  const getPresetLabel = (preset: PresetType): string => {
    switch (preset) {
      case 'weekdays-available':
        return 'Weekdays Available (Mon-Thu) / Extended Weekend Limited (Fri-Sun)';
      case 'weekends-available':
        return 'Extended Weekend Available (Fri-Sun) / Weekdays Limited (Mon-Thu)';
      case 'reset':
        return 'Reset to Default Rules (clear overrides)';
      default:
        return preset;
    }
  };

  const activeRule = rules.find((r) => r.is_active);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Quick Presets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Range Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Apply to:</span>
            <Select value={rangeType} onValueChange={(v) => setRangeType(v as RangeType)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">This month</SelectItem>
                <SelectItem value="next-3-months">Next 3 months</SelectItem>
                <SelectItem value="next-6-months">Next 6 months</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>

            {rangeType === 'custom' && (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-[130px]">
                      {customStart ? format(customStart, 'MMM d, yyyy') : 'Start date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customStart}
                      onSelect={setCustomStart}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground">—</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-[130px]">
                      {customEnd ? format(customEnd, 'MMM d, yyyy') : 'End date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customEnd}
                      onSelect={setCustomEnd}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="h-auto py-3 px-4 flex flex-col items-start gap-1 hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-950"
              onClick={() => handlePresetClick('weekdays-available')}
            >
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-green-600" />
                <span className="font-medium">Weekdays Available</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Mon-Thu open, Fri-Sun limited
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-3 px-4 flex flex-col items-start gap-1 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950"
              onClick={() => handlePresetClick('weekends-available')}
            >
              <div className="flex items-center gap-2">
                <Palmtree className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Weekends Available</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Fri-Sun open, Mon-Thu limited
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-3 px-4 flex flex-col items-start gap-1 hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-950"
              onClick={() => handlePresetClick('reset')}
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-orange-600" />
                <span className="font-medium">Reset to Default</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Clear overrides, use rules
              </span>
            </Button>
          </div>

          {activeRule && (
            <p className="text-xs text-muted-foreground">
              Default capacity: {activeRule.daily_capacity} per day, {activeRule.start_time}–{activeRule.end_time}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply Preset</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="font-medium text-foreground">
                  {presetSummary && getPresetLabel(presetSummary.preset)}
                </p>
                {presetSummary && (
                  <>
                    <p>
                      Date range:{' '}
                      <span className="font-medium">
                        {format(presetSummary.startDate, 'MMM d, yyyy')} —{' '}
                        {format(presetSummary.endDate, 'MMM d, yyyy')}
                      </span>
                    </p>
                    <p>
                      Total days: <span className="font-medium">{presetSummary.totalDays}</span>
                    </p>
                    {presetSummary.protectedDays.length > 0 && (
                      <p className="text-yellow-600 dark:text-yellow-400">
                        ⚠️ {presetSummary.protectedDays.length} day(s) with bookings will be skipped
                      </p>
                    )}
                    {presetSummary.preset === 'reset' ? (
                      <p className="text-sm">
                        This will remove all manual overrides in the selected range. The calendar will
                        fall back to the product's default availability rules.
                      </p>
                    ) : (
                      <p className="text-sm">
                        Existing overrides in this range will be replaced with the new preset.
                      </p>
                    )}
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={applying}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmApply} disabled={applying}>
              {applying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                'Apply Preset'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
