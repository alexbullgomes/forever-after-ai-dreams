
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
          await sendAuthWebhook("register", data.user.id, data.user.email || formData.email);
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

      <div className="text-center">
        <button
          onClick={onToggleMode}
          disabled={loading}
          type="button"
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
    </form>
  );
};
