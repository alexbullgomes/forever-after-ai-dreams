import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatConfig {
  visitor_initial_message: string;
  user_initial_message: string;
  auto_open_enabled: boolean;
  auto_open_delay_seconds: number;
  show_once_per_session: boolean;
}

const DEFAULTS: ChatConfig = {
  visitor_initial_message: "Hi, I'm Eva 👋 How can I help you today? For the full experience — with portfolio, offers, and pricing — log in anytime.",
  user_initial_message: "Hi there! I'm EVA. You don't need to have it all figured out. Just share what you're thinking — a voice note 🎤, a message 💬, anything. I'm here to help shape your ideas into something beautiful. ✨",
  auto_open_enabled: true,
  auto_open_delay_seconds: 60,
  show_once_per_session: true,
};

const CACHE_KEY = 'everafter_chat_config';

export const useChatConfig = () => {
  const [config, setConfig] = useState<ChatConfig>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) return { ...DEFAULTS, ...JSON.parse(cached) };
    } catch {}
    return DEFAULTS;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'chat_config')
        .maybeSingle();

      if (data?.value) {
        const merged = { ...DEFAULTS, ...(data.value as Record<string, unknown>) } as ChatConfig;
        setConfig(merged);
        localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
      }
      setLoading(false);
    };

    fetch();
  }, []);

  return { config, loading, DEFAULTS };
};
