
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Chrome } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GoogleAuthButtonProps {
  googleAvailable: boolean;
  onGoogleUnavailable: () => void;
}

export const GoogleAuthButton = ({ googleAvailable, onGoogleUnavailable }: GoogleAuthButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/planner`
        }
      });

      if (error) {
        console.error('Google auth error:', error);
        if (error.message.includes('provider is not enabled')) {
          onGoogleUnavailable();
          toast({
            title: "Google Sign-In Not Available",
            description: "Please use email and password to continue.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Redirecting to Google...",
          description: "Please complete authentication in the popup window.",
        });
        // Note: Webhook will be handled by the auth state change listener
      }
    } catch (error: any) {
      console.error('Google auth error:', error);
      toast({
        title: "Google Sign-In Error",
        description: "Please try using email and password instead.",
        variant: "destructive",
      });
      onGoogleUnavailable();
    } finally {
      setLoading(false);
    }
  };

  if (!googleAvailable) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleGoogleAuth}
        disabled={loading}
        variant="outline"
        className="w-full h-12 text-gray-700 border-gray-300 hover:bg-gray-50 transition-colors"
      >
        <Chrome className="w-5 h-5 mr-3" />
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or continue with email</span>
        </div>
      </div>
    </>
  );
};
