import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type PromotionalPopup = Database['public']['Tables']['promotional_popups']['Row'];

export const usePromotionalPopup = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupConfig, setPopupConfig] = useState<PromotionalPopup | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const initPopup = async () => {
      try {
        // Fetch active popup config
        const { data: config, error } = await supabase
          .from('promotional_popups')
          .select('*')
          .eq('is_active', true)
          .maybeSingle();

        if (error) throw error;
        if (!config) return;

        // Check date range
        const now = new Date();
        if (config.start_at && new Date(config.start_at) > now) return;
        if (config.end_at && new Date(config.end_at) < now) return;

        // Get or create visitor ID
        let visitorId = localStorage.getItem('homepage-visitor-id');
        if (!visitorId) {
          visitorId = crypto.randomUUID();
          localStorage.setItem('homepage-visitor-id', visitorId);
        }

        // Check if already submitted
        const cacheKey = `popup_submission_${config.id}`;
        const cachedSubmission = localStorage.getItem(cacheKey);
        if (cachedSubmission) return;

        // Check database for submission
        const { data: submissions } = await supabase
          .from('visitor_popup_submissions')
          .select('*')
          .eq('popup_id', config.id)
          .eq('visitor_id', visitorId)
          .maybeSingle();

        if (submissions) return;

        // Check session storage if show_once_per_session
        if (config.show_once_per_session && sessionStorage.getItem(`popup_shown_${config.id}`)) {
          return;
        }

        // Set timer to show popup
        const timer = setTimeout(() => {
          setShowPopup(true);
          setPopupConfig(config);
          if (config.show_once_per_session) {
            sessionStorage.setItem(`popup_shown_${config.id}`, 'true');
          }
        }, config.delay_seconds * 1000);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Error initializing popup:', error);
      }
    };

    initPopup();
  }, [user]);

  const closePopup = () => {
    setShowPopup(false);
  };

  return {
    showPopup,
    popupConfig,
    closePopup,
  };
};