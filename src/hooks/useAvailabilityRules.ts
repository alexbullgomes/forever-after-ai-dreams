import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AvailabilityRule {
  id: string;
  product_id: string;
  timezone: string;
  workdays: number[];
  start_time: string;
  end_time: string;
  slot_minutes: number;
  buffer_minutes: number;
  capacity_type: 'daily' | 'slot';
  daily_capacity: number;
  slot_capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useAvailabilityRules = (productId?: string) => {
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('availability_rules')
        .select('*')
        .order('created_at', { ascending: false });

      // Always fetch global rules (product_id IS NULL)
      query = query.is('product_id', null);

      const { data, error } = await query;

      if (error) throw error;
      setRules((data || []) as AvailabilityRule[]);
    } catch (err: any) {
      console.error('Error fetching availability rules:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch availability rules',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const createRule = async (rule: Omit<AvailabilityRule, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Force product_id to null for global rule
      const { data, error } = await supabase
        .from('availability_rules')
        .insert({ ...rule, product_id: null })
        .select()
        .single();

      if (error) throw error;

      setRules((prev) => [data as AvailabilityRule, ...prev]);
      toast({ title: 'Rule created successfully' });
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

  const updateRule = async (id: string, updates: Partial<AvailabilityRule>) => {
    try {
      // Ensure product_id stays null for global rules
      const { product_id, ...safeUpdates } = updates;
      const { data, error } = await supabase
        .from('availability_rules')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setRules((prev) =>
        prev.map((r) => (r.id === id ? (data as AvailabilityRule) : r))
      );
      toast({ title: 'Rule updated' });
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

  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('availability_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRules((prev) => prev.filter((r) => r.id !== id));
      toast({ title: 'Rule deleted' });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    rules,
    loading,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
  };
};
