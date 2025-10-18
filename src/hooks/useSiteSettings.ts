import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BrandColors {
  primary_from: string;
  primary_to: string;
  primary_hover_from: string;
  primary_hover_to: string;
}

export const useSiteSettings = () => {
  const [colors, setColors] = useState<BrandColors | null>(null);
  const [loading, setLoading] = useState(true);

  const applyCSSVariables = (colors: BrandColors) => {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary-from', colors.primary_from);
    root.style.setProperty('--brand-primary-to', colors.primary_to);
    root.style.setProperty('--brand-primary-hover-from', colors.primary_hover_from);
    root.style.setProperty('--brand-primary-hover-to', colors.primary_hover_to);
    
    // Cache colors in localStorage for instant application on next visit
    localStorage.setItem('everafter_brand_colors', JSON.stringify(colors));
  };

  const fetchColors = async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'brand_colors')
      .maybeSingle();

    if (data && data.value) {
      const brandColors = data.value as unknown as BrandColors;
      setColors(brandColors);
      applyCSSVariables(brandColors);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchColors();
    
    // Real-time subscription for color updates
    const channel = supabase
      .channel('site-settings-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'site_settings',
        filter: "key=eq.brand_colors"
      }, () => {
        fetchColors();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { colors, loading };
};
