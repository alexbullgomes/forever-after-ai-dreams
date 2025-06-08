
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Mail, Lock, User, Chrome } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WEBHOOK_URL = "https://agcreationmkt.cloud/webhook/3d243bf4-c682-4903-a4b7-08bb9ef98b04";

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(true);
  const { toast } = useToast();

  const sendWebhook = async (event: "login" | "register", userId: string, email: string) => {
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event,
          user_id: userId,
          email,
          timestamp: new Date().toISOString()
        }),
      });
      console.log(`Webhook sent successfully for ${event} event`);
    } catch (error) {
      console.error(`Failed to send webhook for ${event} event:`, error);
      // Don't block the user flow if webhook fails
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        // Send webhook after successful login
        if (data.user) {
          await sendWebhook("login", data.user.id, data.user.email || formData.email);
        }

        toast({
          title: "Welcome back!",
          description: "Redirecting to your packages...",
        });

        setTimeout(() => {
          onClose();
          window.location.href = '/wedding-packages';
        }, 1000);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
            }
          }
        });

        if (error) throw error;

        // Send webhook after successful registration
        if (data.user) {
          await sendWebhook("register", data.user.id, data.user.email || formData.email);
        }

        toast({
          title: "Account created!",
          description: "Welcome to Dream Weddings! Redirecting to your packages...",
        });

        setTimeout(() => {
          onClose();
          window.location.href = '/wedding-packages';
        }, 1000);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Authentication Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/wedding-packages`
        }
      });

      if (error) {
        console.error('Google auth error:', error);
        if (error.message.includes('provider is not enabled')) {
          setGoogleAvailable(false);
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
      }
    } catch (error: any) {
      console.error('Google auth error:', error);
      toast({
        title: "Google Sign-In Error",
        description: "Please try using email and password instead.",
        variant: "destructive",
      });
      setGoogleAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
              {isLogin 
                ? "Sign in to access exclusive packages and pricing" 
                : "Create your account to unlock our premium packages"}
            </p>
          </DialogHeader>
        </div>

        <div className="p-6">
          <Card className="border-0 shadow-none">
            <CardContent className="space-y-6 p-0">
              {/* Google Sign-In - only show if available */}
              {googleAvailable && (
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
              )}

              {/* Email Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="pl-10 h-12 border-gray-300 focus:border-rose-400 focus:ring-rose-400"
                        placeholder="Your full name"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="pl-10 h-12 border-gray-300 focus:border-rose-400 focus:ring-rose-400"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="pl-10 h-12 border-gray-300 focus:border-rose-400 focus:ring-rose-400"
                      placeholder={isLogin ? "Enter your password" : "Create a secure password (min 6 chars)"}
                      minLength={6}
                    />
                  </div>
                </div>

                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-rose-500/25 transition-all duration-300"
                >
                  {loading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
                </Button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  disabled={loading}
                  className="text-sm text-gray-600 hover:text-rose-600 transition-colors"
                >
                  {isLogin 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"}
                </button>
              </div>

              {!isLogin && (
                <p className="text-xs text-gray-500 text-center leading-relaxed">
                  By creating an account, you agree to our Terms of Service and Privacy Policy. 
                  We'll use your information to provide personalized package recommendations.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
