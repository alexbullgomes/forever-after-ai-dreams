import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BrandColors {
  // Primary gradient colors
  primary_from: string;
  primary_to: string;
  primary_hover_from: string;
  primary_hover_to: string;
  
  // Icon backgrounds
  icon_bg_primary: string;     // Main icon background (e.g., rose-500)
  icon_bg_secondary: string;   // Secondary icon background (e.g., purple-500)
  icon_bg_accent: string;      // Accent icon background (e.g., pink-500)
  
  // Text accents
  text_accent: string;         // Primary accent text (e.g., rose-500)
  badge_text: string;          // Badge text color (e.g., rose-700)
  stats_text: string;          // Statistics text color (e.g., rose-500)
  
  // Backgrounds
  badge_bg: string;            // Badge background (e.g., rose-50)
  
  // Decorative elements
  feature_dot: string;         // Feature list dots (e.g., rose-400)
  
  // Hero section
  hero_overlay_color: string;
  hero_badge_bg_color: string;
  hero_badge_icon: string;
  hero_gradient_from: string;
  hero_gradient_via: string;
  hero_gradient_to: string;
  hero_text_primary: string;
  hero_text_muted: string;
  hero_trust_text: string;
  hero_glow_1_from: string;
  hero_glow_1_to: string;
  hero_glow_2_from: string;
  hero_glow_2_to: string;
}

export const useSiteSettings = () => {
  const [colors, setColors] = useState<BrandColors | null>(null);
  const [loading, setLoading] = useState(true);

  const applyCSSVariables = (colors: BrandColors) => {
    const root = document.documentElement;
    
    // Primary gradient colors
    root.style.setProperty('--brand-primary-from', colors.primary_from);
    root.style.setProperty('--brand-primary-to', colors.primary_to);
    root.style.setProperty('--brand-primary-hover-from', colors.primary_hover_from);
    root.style.setProperty('--brand-primary-hover-to', colors.primary_hover_to);
    
    // Icon backgrounds
    root.style.setProperty('--brand-icon-bg-primary', colors.icon_bg_primary);
    root.style.setProperty('--brand-icon-bg-secondary', colors.icon_bg_secondary);
    root.style.setProperty('--brand-icon-bg-accent', colors.icon_bg_accent);
    
    // Text accents
    root.style.setProperty('--brand-text-accent', colors.text_accent);
    root.style.setProperty('--brand-badge-text', colors.badge_text);
    root.style.setProperty('--brand-stats-text', colors.stats_text);
    
    // Backgrounds
    root.style.setProperty('--brand-badge-bg', colors.badge_bg);
    
    // Decorative elements
    root.style.setProperty('--brand-feature-dot', colors.feature_dot);
    
    // Hero section colors
    root.style.setProperty('--hero-overlay-color', colors.hero_overlay_color);
    root.style.setProperty('--hero-badge-bg-color', colors.hero_badge_bg_color);
    root.style.setProperty('--hero-badge-icon', colors.hero_badge_icon);
    root.style.setProperty('--hero-gradient-from', colors.hero_gradient_from);
    root.style.setProperty('--hero-gradient-via', colors.hero_gradient_via);
    root.style.setProperty('--hero-gradient-to', colors.hero_gradient_to);
    root.style.setProperty('--hero-text-primary', colors.hero_text_primary);
    root.style.setProperty('--hero-text-muted', colors.hero_text_muted);
    root.style.setProperty('--hero-trust-text', colors.hero_trust_text);
    root.style.setProperty('--hero-glow-1-from', colors.hero_glow_1_from);
    root.style.setProperty('--hero-glow-1-to', colors.hero_glow_1_to);
    root.style.setProperty('--hero-glow-2-from', colors.hero_glow_2_from);
    root.style.setProperty('--hero-glow-2-to', colors.hero_glow_2_to);
    
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
