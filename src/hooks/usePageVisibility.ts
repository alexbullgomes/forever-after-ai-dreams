import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PageVisibility {
  show_wedding_packages: boolean;
}

const DEFAULT_VISIBILITY: PageVisibility = {
  show_wedding_packages: true
};

export const usePageVisibility = () => {
  const [visibility, setVisibility] = useState<PageVisibility>(DEFAULT_VISIBILITY);
  const [loading, setLoading] = useState(true);

  const fetchVisibility = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'page_visibility')
        .maybeSingle();

      if (error) {
        console.error('Error fetching page visibility:', error);
        return;
      }

      if (data?.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
        const value = data.value as Record<string, unknown>;
        setVisibility({
          show_wedding_packages: typeof value.show_wedding_packages === 'boolean' 
            ? value.show_wedding_packages 
            : DEFAULT_VISIBILITY.show_wedding_packages
        });
      }
    } catch (error) {
      console.error('Error fetching page visibility:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateVisibility = useCallback(async (newVisibility: Partial<PageVisibility>) => {
    const updatedVisibility = { ...visibility, ...newVisibility };
    
    const { error } = await supabase
      .from('site_settings')
      .update({ value: updatedVisibility })
      .eq('key', 'page_visibility');

    if (error) {
      console.error('Error updating page visibility:', error);
      throw error;
    }

    setVisibility(updatedVisibility);
  }, [visibility]);

  useEffect(() => {
    fetchVisibility();

    // Real-time subscription
    const channel = supabase
      .channel('page-visibility-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_settings',
          filter: "key=eq.page_visibility"
        },
        (payload) => {
          const newValue = payload.new?.value;
          if (newValue && typeof newValue === 'object' && !Array.isArray(newValue)) {
            const value = newValue as Record<string, unknown>;
            setVisibility({
              show_wedding_packages: typeof value.show_wedding_packages === 'boolean' 
                ? value.show_wedding_packages 
                : DEFAULT_VISIBILITY.show_wedding_packages
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchVisibility]);

  return {
    showWeddingPackages: visibility.show_wedding_packages,
    loading,
    updateVisibility
  };
};
