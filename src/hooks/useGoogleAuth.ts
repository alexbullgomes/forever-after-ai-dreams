
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendGoogleAuthWebhook } from "@/utils/authWebhook";

interface UseGoogleAuthProps {
  onClose: () => void;
}

export const useGoogleAuth = ({ onClose }: UseGoogleAuthProps) => {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if this was a Google OAuth login by checking the provider
          const isGoogleAuth = session.user.app_metadata?.provider === 'google';
          const isNewUser = event === 'SIGNED_IN' && session.user.created_at === session.user.last_sign_in_at;
          
          if (isGoogleAuth) {
            // Send webhook for Google authentication with enhanced payload
            const webhookEvent = isNewUser ? 'register' : 'login';
            const fullName = session.user.user_metadata?.full_name || 
                           session.user.user_metadata?.name || 
                           `${session.user.user_metadata?.given_name || ''} ${session.user.user_metadata?.family_name || ''}`.trim() || 
                           '';
            
            await sendGoogleAuthWebhook(
              webhookEvent, 
              session.user.id, 
              session.user.email || '', 
              fullName
            );
            
            // Close modal and redirect
            onClose();
            window.location.href = '/wedding-packages';
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [onClose]);
};
