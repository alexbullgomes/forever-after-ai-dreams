import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format, eachDayOfInterval, getDay } from 'date-fns';

export interface AvailabilityOverride {
  id: string;
  product_id: string | null;
  start_at: string | null;
  end_at: string | null;
  date: string | null;
  status: 'available' | 'limited' | 'full' | 'blocked';
  capacity_override: number | null;
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

export type PresetType = 'weekdays-available' | 'weekends-available' | 'reset';

export const useAvailabilityOverrides = () => {
  const [overrides, setOverrides] = useState<AvailabilityOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchOverrides = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('availability_overrides')
        .select('*')
        .order('created_at', { ascending: false });

      // Always fetch global overrides (product_id IS NULL)
      query = query.is('product_id', null);

      const { data, error } = await query;

      if (error) throw error;
      setOverrides((data || []) as AvailabilityOverride[]);
    } catch (err: any) {
      console.error('Error fetching availability overrides:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch availability overrides',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOverrides();
  }, [fetchOverrides]);

  const createOverride = async (
    override: Omit<AvailabilityOverride, 'id' | 'created_at' | 'created_by'>
  ) => {
    try {
      // Force product_id to null for global override
      const { data, error } = await supabase
        .from('availability_overrides')
        .insert({
          ...override,
          product_id: null,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      setOverrides((prev) => [data as AvailabilityOverride, ...prev]);
      toast({ title: 'Override created successfully' });
      
      // Log to audit
      await supabase.from('availability_audit_log').insert({
        action: 'override_created',
        actor_id: user?.id,
        payload: { override_id: data.id, ...override },
      });

      return data;
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateOverride = async (id: string, updates: Partial<AvailabilityOverride>) => {
    try {
      // Ensure product_id stays null for global overrides
      const { product_id, ...safeUpdates } = updates;
      const { data, error } = await supabase
        .from('availability_overrides')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setOverrides((prev) =>
        prev.map((o) => (o.id === id ? (data as AvailabilityOverride) : o))
      );
      toast({ title: 'Override updated' });
      
      // Log to audit
      await supabase.from('availability_audit_log').insert({
        action: 'override_updated',
        actor_id: user?.id,
        payload: { override_id: id, updates },
      });

      return data;
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteOverride = async (id: string) => {
    try {
      const { error } = await supabase
        .from('availability_overrides')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setOverrides((prev) => prev.filter((o) => o.id !== id));
      toast({ title: 'Override deleted' });
      
      // Log to audit
      await supabase.from('availability_audit_log').insert({
        action: 'override_deleted',
        actor_id: user?.id,
        payload: { override_id: id },
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const getOverrideForDate = useCallback((date: string) => {
    return overrides.find((o) => o.date === date);
  }, [overrides]);

  // Get days with confirmed bookings in a date range
  const getDaysWithBookings = async (
    startDate: string,
    endDate: string
  ): Promise<string[]> => {
    try {
      // Get ALL bookings globally (not filtered by product)
      const { data, error } = await supabase
        .from('bookings')
        .select('event_date')
        .gte('event_date', startDate)
        .lte('event_date', endDate)
        .in('status', ['confirmed', 'paid']);

      if (error) throw error;

      // Get unique dates
      const uniqueDates = [...new Set((data || []).map((b) => b.event_date))];
      return uniqueDates;
    } catch (err: any) {
      console.error('Error fetching days with bookings:', err);
      return [];
    }
  };

  // Bulk delete overrides for a date range
  const bulkDeleteOverrides = async (startDate: string, endDate: string): Promise<number> => {
    try {
      // Delete global overrides only (product_id IS NULL)
      const { data, error } = await supabase
        .from('availability_overrides')
        .delete()
        .is('product_id', null)
        .gte('date', startDate)
        .lte('date', endDate)
        .select();

      if (error) throw error;

      const deletedCount = data?.length || 0;

      // Log to audit
      await supabase.from('availability_audit_log').insert({
        action: 'bulk_overrides_deleted',
        actor_id: user?.id,
        payload: { global: true, start_date: startDate, end_date: endDate, count: deletedCount },
      });

      return deletedCount;
    } catch (err: any) {
      console.error('Error bulk deleting overrides:', err);
      throw err;
    }
  };

  // Bulk create overrides
  const bulkCreateOverrides = async (
    overridesToCreate: Array<Omit<AvailabilityOverride, 'id' | 'created_at' | 'created_by'>>
  ): Promise<number> => {
    if (overridesToCreate.length === 0) return 0;

    try {
      // Force product_id to null for all global overrides
      const overridesWithUser = overridesToCreate.map((o) => ({
        ...o,
        product_id: null,
        created_by: user?.id || null,
      }));

      const { data, error } = await supabase
        .from('availability_overrides')
        .insert(overridesWithUser)
        .select();

      if (error) throw error;

      const createdCount = data?.length || 0;

      // Log to audit
      await supabase.from('availability_audit_log').insert({
        action: 'bulk_overrides_created',
        actor_id: user?.id,
        payload: { global: true, count: createdCount },
      });

      return createdCount;
    } catch (err: any) {
      console.error('Error bulk creating overrides:', err);
      throw err;
    }
  };

  // Apply a preset to a date range
  const applyPreset = async (
    preset: PresetType,
    startDate: Date,
    endDate: Date,
    protectedDates: string[],
    dailyCapacity: number = 1
  ): Promise<{ applied: number; skipped: number }> => {
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // First, delete existing overrides in range
    await bulkDeleteOverrides(startStr, endStr);

    // For reset preset, we're done - just delete overrides
    if (preset === 'reset') {
      await fetchOverrides();
      return { applied: days.length, skipped: 0 };
    }

    // Generate overrides based on preset
    const newOverrides: Array<Omit<AvailabilityOverride, 'id' | 'created_at' | 'created_by'>> = [];
    let skipped = 0;

    for (const day of days) {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayOfWeek = getDay(day); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
      const isProtected = protectedDates.includes(dateStr);
      
      // Extended weekend: Friday (5), Saturday (6), Sunday (0)
      const isExtendedWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
      // Weekdays: Monday (1) to Thursday (4)
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 4;

      if (preset === 'weekdays-available') {
        // Mon-Thu → Available, Fri-Sun → Limited
        if (isWeekday && !isProtected) {
          // Set weekdays (Mon-Thu) to available - status only, no capacity override
          newOverrides.push({
            product_id: null,
            date: dateStr,
            status: 'available',
            capacity_override: null, // Status-only, let global rule handle capacity
            reason: 'Quick Preset: Weekday available',
            start_at: null,
            end_at: null,
          });
        } else if (isExtendedWeekend) {
          // Set extended weekend (Fri-Sun) to limited
          newOverrides.push({
            product_id: null,
            date: dateStr,
            status: 'limited',
            capacity_override: null, // Keep existing capacity from rules
            reason: 'Quick Preset: Extended weekend limited',
            start_at: null,
            end_at: null,
          });
        } else if (isProtected) {
          skipped++;
        }
      } else if (preset === 'weekends-available') {
        // Fri-Sun → Available, Mon-Thu → Limited
        if (isExtendedWeekend && !isProtected) {
          // Set extended weekend (Fri-Sun) to available - status only
          newOverrides.push({
            product_id: null,
            date: dateStr,
            status: 'available',
            capacity_override: null, // Status-only, let global rule handle capacity
            reason: 'Quick Preset: Extended weekend available',
            start_at: null,
            end_at: null,
          });
        } else if (isWeekday) {
          // Set weekdays (Mon-Thu) to limited
          newOverrides.push({
            product_id: null,
            date: dateStr,
            status: 'limited',
            capacity_override: null, // Keep existing capacity from rules
            reason: 'Quick Preset: Weekday limited',
            start_at: null,
            end_at: null,
          });
        } else if (isProtected) {
          skipped++;
        }
      }
    }

    // Bulk create new overrides
    const createdCount = await bulkCreateOverrides(newOverrides);
    await fetchOverrides();

    return { applied: createdCount, skipped };
  };

  return {
    overrides,
    loading,
    fetchOverrides,
    createOverride,
    updateOverride,
    deleteOverride,
    getOverrideForDate,
    getDaysWithBookings,
    bulkDeleteOverrides,
    bulkCreateOverrides,
    applyPreset,
  };
};
