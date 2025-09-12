
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [googleAvailable, setGoogleAvailable] = useState(true);

  // Handle Google OAuth webhooks and redirects
  useGoogleAuth({ onClose });

  const handleGoogleUnavailable = () => {
    setGoogleAvailable(false);
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0">
        <div className="bg-gradient-to-br from-rose-500 to-pink-500 p-6 text-white">
          <DialogHeader>
            <div className="flex items-center justify-center mb-2">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold">
              {isLogin ? "Welcome Back" : "Join Our Family"}
            </DialogTitle>
            <p className="text-center text-rose-100 text-sm">
              Sign in to unlock promos, portfolio & full pricing.
            </p>
          </DialogHeader>
        </div>

        <div className="p-6">
          <Card className="border-0 shadow-none">
            <CardContent className="space-y-6 p-0">
              <GoogleAuthButton 
                googleAvailable={googleAvailable}
                onGoogleUnavailable={handleGoogleUnavailable}
              />

              <EmailAuthForm 
                isLogin={isLogin}
                onToggleMode={handleToggleMode}
                onClose={onClose}
              />
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
