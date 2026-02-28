import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useHomepageContent, HomepageContentKey } from './useHomepageContent';

export const useHomepageContentAdmin = () => {
  const { content, loading } = useHomepageContent();

  const updateSection = useCallback(async (key: HomepageContentKey, value: any): Promise<boolean> => {
    try {
      // Try update first
      const { data: existing } = await supabase
        .from('site_settings')
        .select('key')
        .eq('key', key)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value })
          .eq('key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ key, value });
        if (error) throw error;
      }
      return true;
    } catch (err) {
      console.error(`Error updating ${key}:`, err);
      return false;
    }
  }, []);

  return { content, loading, updateSection };
};
