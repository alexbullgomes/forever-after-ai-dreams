import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LandingCard {
  icon: string;
  title: string;
  description: string;
  features: string[];
  button_label: string;
  button_link: string;
}

export interface LandingPageCardsConfig {
  show_cards_section: boolean;
  cards: LandingCard[];
}

const DEFAULT_CONFIG: LandingPageCardsConfig = {
  show_cards_section: true,
  cards: [
    {
      icon: "Heart",
      title: "Personalized Planner",
      description: "Meet EVA — our smart assistant who builds your ideal package and unlocks exclusive deals.",
      features: ["EVA, AI-Powered Recommendations", "Smart Custom Packages for You", "Matches for Your Event Type", "Thoughtful Budget Optimization"],
      button_label: "More Details",
      button_link: "/services"
    },
    {
      icon: "Camera",
      title: "Photo & Video Services",
      description: "Life moves fast, but memories don't have to fade. We capture moments you'll want to hold onto forever.",
      features: ["Genuine Family Portraits", "Stories Behind Your Business", "Corporate Gatherings", "Celebrations and Milestones"],
      button_label: "More Details",
      button_link: ""
    },
    {
      icon: "Sparkles",
      title: "Wedding Packages",
      description: "Your love story feels like a movie — we'll film the moment that matters most.",
      features: ["Photos + Video Packages", "Artistic & Emotional Photography", "Cinematic Wedding Films", "Personalized & Fast Delivery"],
      button_label: "More Details",
      button_link: "/wedding-packages"
    }
  ]
};

export const useLandingPageCards = () => {
  const [config, setConfig] = useState<LandingPageCardsConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'landing_page_cards')
      .maybeSingle();

    if (error) {
      console.error('Error fetching landing page cards:', error);
      setLoading(false);
      return;
    }

    if (data?.value) {
      const value = data.value as unknown as LandingPageCardsConfig;
      setConfig({
        show_cards_section: value.show_cards_section ?? true,
        cards: value.cards ?? DEFAULT_CONFIG.cards
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfig();

    const channel = supabase
      .channel('landing-page-cards-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_settings',
          filter: "key=eq.landing_page_cards"
        },
        () => {
          fetchConfig();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConfig]);

  return {
    cards: config.cards,
    showCardsSection: config.show_cards_section,
    loading
  };
};

export const useLandingPageCardsAdmin = () => {
  const [config, setConfig] = useState<LandingPageCardsConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'landing_page_cards')
      .maybeSingle();

    if (error) {
      console.error('Error fetching landing page cards:', error);
      setLoading(false);
      return;
    }

    if (data?.value) {
      const value = data.value as unknown as LandingPageCardsConfig;
      setConfig({
        show_cards_section: value.show_cards_section ?? true,
        cards: value.cards ?? DEFAULT_CONFIG.cards
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = async (newConfig: LandingPageCardsConfig): Promise<boolean> => {
    const { error } = await supabase
      .from('site_settings')
      .update({ value: JSON.parse(JSON.stringify(newConfig)) })
      .eq('key', 'landing_page_cards');

    if (error) {
      console.error('Error updating landing page cards:', error);
      return false;
    }

    setConfig(newConfig);
    return true;
  };

  return {
    config,
    loading,
    updateConfig,
    refetch: fetchConfig
  };
};
