import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SlotAvailability {
  status: 'available' | 'limited' | 'full' | 'blocked' | 'needs_review';
  reason: string;
  capacity: number;
  used: number;
  override_applied: boolean;
}

export interface DayAvailability {
  status: 'available' | 'limited' | 'full' | 'blocked' | 'needs_review';
  reason: string;
  slots: Array<{
    start: string;
    end: string;
    status: string;
    reason: string;
  }>;
  available_count: number;
  total_count: number;
}

export const useAvailabilityComputation = (useGlobal: boolean = true) => {
  const [loading, setLoading] = useState(false);

  const getSlotAvailability = useCallback(
    async (
    slotStart: Date,
    slotEnd: Date
  ): Promise<SlotAvailability> => {
    try {
      // Always use global availability function
      const { data, error } = await supabase.rpc('get_global_slot_availability', {
        p_slot_start: slotStart.toISOString(),
        p_slot_end: slotEnd.toISOString(),
      });

      if (error) {
        console.error('Error getting slot availability:', error);
        return {
          status: 'available',
          reason: 'Using default (computation error)',
          capacity: 2,
          used: 0,
          override_applied: false,
        };
      }

      return data as unknown as SlotAvailability;
    } catch (err) {
      console.error('Error in getSlotAvailability:', err);
      return {
        status: 'available',
        reason: 'Using default (computation error)',
        capacity: 2,
        used: 0,
        override_applied: false,
      };
    }
  },
    []
  );

  const getDayAvailability = useCallback(
    async (
    day: Date
  ): Promise<DayAvailability> => {
    try {
      const dateStr = day.toISOString().split('T')[0];
      // Always use global availability function
      const { data, error } = await supabase.rpc('get_global_day_availability', {
        p_day: dateStr,
      });

      if (error) {
        console.error('Error getting day availability:', error);
        return {
          status: 'available',
          reason: 'Using default (computation error)',
          slots: [],
          available_count: 0,
          total_count: 0,
        };
      }

      return data as unknown as DayAvailability;
    } catch (err) {
      console.error('Error in getDayAvailability:', err);
      return {
        status: 'available',
        reason: 'Using default (computation error)',
        slots: [],
        available_count: 0,
        total_count: 0,
      };
    }
  },
    []
  );

  const getMonthAvailability = useCallback(
    async (
    year: number,
    month: number
  ): Promise<Record<string, DayAvailability>> => {
    setLoading(true);
    const results: Record<string, DayAvailability> = {};

    try {
      // Get first and last day of month
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      // Fetch availability for each day in parallel (batch of 7 at a time)
      const days: Date[] = [];
      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
      }

      const batchSize = 7;
      for (let i = 0; i < days.length; i += batchSize) {
        const batch = days.slice(i, i + batchSize);
        const promises = batch.map((day) => getDayAvailability(day));
        const batchResults = await Promise.all(promises);

        batch.forEach((day, idx) => {
          const dateKey = day.toISOString().split('T')[0];
          results[dateKey] = batchResults[idx];
        });
      }
    } catch (err) {
      console.error('Error fetching global month availability:', err);
    } finally {
      setLoading(false);
    }

    return results;
  },
    [getDayAvailability]
  );

  return {
    loading,
    getSlotAvailability,
    getDayAvailability,
    getMonthAvailability,
  };
};
