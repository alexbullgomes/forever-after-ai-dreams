import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ThemePreset = 'light' | 'dark' | 'ocean' | 'sunset' | 'forest';

export interface BrandColors {
  // Theme preset
  theme_preset?: ThemePreset;
  
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
  
  // Services section
  service_icon_gradient_from: string;
  service_icon_gradient_to: string;
  
  // Contact section
  contact_bg_gradient_from: string;
  contact_bg_gradient_to: string;

  // CTA section icon color
  cta_icon_color: string;
}

// Theme presets definition
export const THEME_PRESETS: Record<ThemePreset, Partial<BrandColors>> = {
  light: {
    theme_preset: 'light',
    primary_from: '351 95% 71%',
    primary_to: '328 86% 70%',
    primary_hover_from: '350 89% 60%',
    primary_hover_to: '328 86% 60%',
    icon_bg_primary: '351 95% 71%',
    icon_bg_secondary: '271 91% 65%',
    icon_bg_accent: '328 86% 70%',
    text_accent: '351 95% 71%',
    badge_text: '350 89% 50%',
    stats_text: '351 95% 71%',
    badge_bg: '350 100% 97%',
    feature_dot: '351 95% 75%',
  },
  dark: {
    theme_preset: 'dark',
    primary_from: '351 95% 71%',
    primary_to: '328 86% 70%',
    primary_hover_from: '351 95% 75%',
    primary_hover_to: '328 86% 75%',
    icon_bg_primary: '351 95% 71%',
    icon_bg_secondary: '271 91% 65%',
    icon_bg_accent: '328 86% 70%',
    text_accent: '351 95% 75%',
    badge_text: '350 89% 70%',
    stats_text: '351 95% 75%',
    badge_bg: '350 50% 15%',
    feature_dot: '351 95% 75%',
  },
  ocean: {
    theme_preset: 'ocean',
    primary_from: '199 89% 48%',
    primary_to: '217 91% 60%',
    primary_hover_from: '199 89% 40%',
    primary_hover_to: '217 91% 50%',
    icon_bg_primary: '199 89% 48%',
    icon_bg_secondary: '172 66% 50%',
    icon_bg_accent: '217 91% 60%',
    text_accent: '199 89% 48%',
    badge_text: '199 89% 35%',
    stats_text: '199 89% 48%',
    badge_bg: '199 89% 97%',
    feature_dot: '199 89% 55%',
  },
  sunset: {
    theme_preset: 'sunset',
    primary_from: '25 95% 53%',
    primary_to: '350 89% 60%',
    primary_hover_from: '25 95% 45%',
    primary_hover_to: '350 89% 52%',
    icon_bg_primary: '25 95% 53%',
    icon_bg_secondary: '350 89% 60%',
    icon_bg_accent: '45 93% 58%',
    text_accent: '25 95% 53%',
    badge_text: '25 95% 40%',
    stats_text: '25 95% 53%',
    badge_bg: '25 95% 97%',
    feature_dot: '25 95% 60%',
  },
  forest: {
    theme_preset: 'forest',
    primary_from: '142 76% 36%',
    primary_to: '160 84% 39%',
    primary_hover_from: '142 76% 28%',
    primary_hover_to: '160 84% 31%',
    icon_bg_primary: '142 76% 36%',
    icon_bg_secondary: '160 84% 39%',
    icon_bg_accent: '120 60% 45%',
    text_accent: '142 76% 36%',
    badge_text: '142 76% 25%',
    stats_text: '142 76% 36%',
    badge_bg: '142 76% 97%',
    feature_dot: '142 76% 45%',
  },
};

export const useSiteSettings = () => {
  const [colors, setColors] = useState<BrandColors | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>('light');

  const applyCSSVariables = useCallback((colors: BrandColors) => {
    const root = document.documentElement;
    
    // Apply theme class
    const themePreset = colors.theme_preset || 'light';
    if (themePreset === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    setCurrentTheme(themePreset);
    
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
    
    // Services section colors
    root.style.setProperty('--service-icon-gradient-from', colors.service_icon_gradient_from);
    root.style.setProperty('--service-icon-gradient-to', colors.service_icon_gradient_to);
    
    // Contact section colors
    root.style.setProperty('--contact-bg-gradient-from', colors.contact_bg_gradient_from);
    root.style.setProperty('--contact-bg-gradient-to', colors.contact_bg_gradient_to);

    // CTA section icon color
    root.style.setProperty('--cta-icon', colors.cta_icon_color);
    
    // Also update the primary color to match brand
    root.style.setProperty('--primary', colors.primary_from);
    root.style.setProperty('--ring-brand', colors.primary_from);
    root.style.setProperty('--border-brand', colors.primary_from);
    
    // Cache colors in localStorage for instant application on next visit
    localStorage.setItem('everafter_brand_colors', JSON.stringify(colors));
  }, []);

  const fetchColors = useCallback(async () => {
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
  }, [applyCSSVariables]);

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
  }, [fetchColors]);

  return { colors, loading, currentTheme, THEME_PRESETS };
};
