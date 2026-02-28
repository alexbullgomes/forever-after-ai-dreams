import type { BrandColors } from '@/hooks/useSiteSettings';
import type { CSSProperties } from 'react';

/**
 * Maps BrandColors keys to their CSS custom property names.
 * Mirrors the mapping in useSiteSettings.applyCSSVariables().
 */
const COLOR_KEY_TO_CSS_VAR: Record<keyof Omit<BrandColors, 'theme_preset'>, string> = {
  primary_from: '--brand-primary-from',
  primary_to: '--brand-primary-to',
  primary_hover_from: '--brand-primary-hover-from',
  primary_hover_to: '--brand-primary-hover-to',
  icon_bg_primary: '--brand-icon-bg-primary',
  icon_bg_secondary: '--brand-icon-bg-secondary',
  icon_bg_accent: '--brand-icon-bg-accent',
  text_accent: '--brand-text-accent',
  badge_text: '--brand-badge-text',
  stats_text: '--brand-stats-text',
  badge_bg: '--brand-badge-bg',
  feature_dot: '--brand-feature-dot',
  hero_overlay_color: '--hero-overlay-color',
  hero_badge_bg_color: '--hero-badge-bg-color',
  hero_badge_icon: '--hero-badge-icon',
  hero_gradient_from: '--hero-gradient-from',
  hero_gradient_via: '--hero-gradient-via',
  hero_gradient_to: '--hero-gradient-to',
  hero_text_primary: '--hero-text-primary',
  hero_text_muted: '--hero-text-muted',
  hero_trust_text: '--hero-trust-text',
  hero_glow_1_from: '--hero-glow-1-from',
  hero_glow_1_to: '--hero-glow-1-to',
  hero_glow_2_from: '--hero-glow-2-from',
  hero_glow_2_to: '--hero-glow-2-to',
  service_icon_gradient_from: '--service-icon-gradient-from',
  service_icon_gradient_to: '--service-icon-gradient-to',
  contact_bg_gradient_from: '--contact-bg-gradient-from',
  contact_bg_gradient_to: '--contact-bg-gradient-to',
  cta_icon_color: '--cta-icon',
};

/**
 * Builds a React CSSProperties object with scoped CSS custom properties
 * for campaign-specific brand color overrides.
 * 
 * Also overrides --primary, --ring-brand, --border-brand to match primary_from
 * (same as useSiteSettings.applyCSSVariables does on :root).
 * 
 * Returns an empty object if brandColors is null/undefined/empty,
 * meaning the global theme will be inherited unchanged.
 */
export function buildCampaignColorStyle(
  brandColors: Partial<BrandColors> | null | undefined
): CSSProperties {
  if (!brandColors || typeof brandColors !== 'object') {
    return {};
  }

  const style: Record<string, string> = {};

  for (const [key, cssVar] of Object.entries(COLOR_KEY_TO_CSS_VAR)) {
    const value = (brandColors as Record<string, string | undefined>)[key];
    if (value !== undefined && value !== null && value !== '') {
      style[cssVar] = value;
    }
  }

  // Mirror the extra aliases that applyCSSVariables sets
  if (brandColors.primary_from) {
    style['--primary'] = brandColors.primary_from;
    style['--ring'] = brandColors.primary_from;
    style['--ring-brand'] = brandColors.primary_from;
    style['--border-brand'] = brandColors.primary_from;
  }

  return style as CSSProperties;
}

/**
 * Synchronously applies campaign brand color CSS variables to document.documentElement.
 * Should be called inside useLayoutEffect to prevent FOUC.
 */
export function applyCampaignColorsToRoot(
  brandColors: Partial<BrandColors> | null | undefined
): void {
  if (!brandColors || typeof brandColors !== 'object') return;

  const root = document.documentElement;

  for (const [key, cssVar] of Object.entries(COLOR_KEY_TO_CSS_VAR)) {
    const value = (brandColors as Record<string, string | undefined>)[key];
    if (value !== undefined && value !== null && value !== '') {
      root.style.setProperty(cssVar, value);
    }
  }

  if (brandColors.primary_from) {
    root.style.setProperty('--primary', brandColors.primary_from);
    root.style.setProperty('--ring', brandColors.primary_from);
    root.style.setProperty('--ring-brand', brandColors.primary_from);
    root.style.setProperty('--border-brand', brandColors.primary_from);
  }
}

/**
 * Removes campaign brand color CSS variables from document.documentElement.
 * Called on campaign page unmount to restore global theme.
 */
export function removeCampaignColorsFromRoot(
  brandColors: Partial<BrandColors> | null | undefined
): void {
  if (!brandColors || typeof brandColors !== 'object') return;

  const root = document.documentElement;

  for (const [, cssVar] of Object.entries(COLOR_KEY_TO_CSS_VAR)) {
    root.style.removeProperty(cssVar);
  }

  root.style.removeProperty('--primary');
  root.style.removeProperty('--ring');
  root.style.removeProperty('--ring-brand');
  root.style.removeProperty('--border-brand');
}
