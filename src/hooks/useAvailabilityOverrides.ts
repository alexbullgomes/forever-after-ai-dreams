import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface AvailabilityOverride {
  id: string;
  product_id: string;
  start_at: string | null;
  end_at: string | null;
  date: string | null;
  status: 'available' | 'limited' | 'full' | 'blocked';
  capacity_override: number | null;
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

export const useAvailabilityOverrides = (productId?: string) => {
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

      if (productId) {
        query = query.eq('product_id', productId);
      }

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
  }, [productId, toast]);

  useEffect(() => {
    fetchOverrides();
  }, [fetchOverrides]);

  const createOverride = async (
    override: Omit<AvailabilityOverride, 'id' | 'created_at' | 'created_by'>
  ) => {
    try {
      const { data, error } = await supabase
        .from('availability_overrides')
        .insert({
          ...override,
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
      const { data, error } = await supabase
        .from('availability_overrides')
        .update(updates)
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

  return {
    overrides,
    loading,
    fetchOverrides,
    createOverride,
    updateOverride,
    deleteOverride,
    getOverrideForDate,
  };
};
