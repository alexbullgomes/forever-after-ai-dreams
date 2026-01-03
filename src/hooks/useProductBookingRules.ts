import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProductBookingRules {
  slot_duration_minutes: number;
  full_window_start: string;
  full_window_end: string;
  limited_slots: string[];
  offer_window_hours: number;
  checkout_hold_minutes: number;
  calendar_mode: 'unavailable' | 'real';
}

const DEFAULT_RULES: ProductBookingRules = {
  slot_duration_minutes: 60,
  full_window_start: '10:00',
  full_window_end: '18:00',
  limited_slots: ['15:00', '16:00', '17:00'],
  offer_window_hours: 24,
  checkout_hold_minutes: 15,
  calendar_mode: 'unavailable',
};

export function useProductBookingRules(productId: string | null) {
  const [rules, setRules] = useState<ProductBookingRules>(DEFAULT_RULES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      setRules(DEFAULT_RULES);
      setLoading(false);
      return;
    }

    const fetchRules = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_booking_rules')
        .select('*')
        .eq('product_id', productId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching booking rules:', error);
        setRules(DEFAULT_RULES);
      } else if (data) {
        setRules({
          slot_duration_minutes: data.slot_duration_minutes,
          full_window_start: data.full_window_start,
          full_window_end: data.full_window_end,
          limited_slots: data.limited_slots as string[],
          offer_window_hours: data.offer_window_hours,
          checkout_hold_minutes: data.checkout_hold_minutes,
          calendar_mode: data.calendar_mode as 'unavailable' | 'real',
        });
      } else {
        setRules(DEFAULT_RULES);
      }
      setLoading(false);
    };

    fetchRules();
  }, [productId]);

  return { rules, loading };
}
