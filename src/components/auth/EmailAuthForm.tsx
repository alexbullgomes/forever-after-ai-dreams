
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sendAuthWebhook } from "@/utils/authWebhook";

interface EmailAuthFormProps {
  isLogin: boolean;
  onToggleMode: () => void;
  onClose: () => void;
}

export const EmailAuthForm = ({ isLogin, onToggleMode, onClose }: EmailAuthFormProps) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
          await sendAuthWebhook("login", data.user.id, data.user.email || formData.email);
        }

        toast({
          title: "Welcome back!",
          description: "Redirecting to your packages...",
        });

        setTimeout(() => {
          onClose();
          window.location.href = '/dashboard';
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
          await sendAuthWebhook("register", data.user.id, data.user.email || formData.email);
        }

        toast({
          title: "Account created!",
          description: "Welcome to Dream Weddings! Redirecting to your packages...",
        });

        setTimeout(() => {
          onClose();
          window.location.href = '/dashboard';
        }, 1000);
      }
    } catch (error: unknown) {
      console.error('Auth error:', error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isLogin && (
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              disabled={loading}
              className="pl-10 h-12 border-border focus:border-brand-primary-from focus:ring-brand-primary-from"
              placeholder="Your full name"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            className="pl-10 h-12 border-border focus:border-brand-primary-from focus:ring-brand-primary-from"
            placeholder="your@email.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            className="pl-10 h-12 border-border focus:border-brand-primary-from focus:ring-brand-primary-from"
            placeholder={isLogin ? "Enter your password" : "Create a secure password (min 6 chars)"}
            minLength={6}
          />
        </div>
      </div>

      <Button 
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-brand-gradient hover:bg-brand-gradient-hover text-white font-semibold rounded-lg shadow-lg hover:shadow-brand-primary-from/25 transition-all duration-300"
      >
        {loading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
      </Button>

      <div className="text-center">
        <button
          onClick={onToggleMode}
          disabled={loading}
          type="button"
          className="text-sm text-muted-foreground hover:text-brand-primary-from transition-colors"
        >
          {isLogin 
            ? "Don't have an account? Sign up" 
            : "Already have an account? Sign in"}
        </button>
      </div>

      {!isLogin && (
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          By creating an account, you agree to our Terms of Service and Privacy Policy. 
          We'll use your information to provide personalized package recommendations.
        </p>
      )}
    </form>
  );
};
