
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { trackReferralConversion } from '@/utils/affiliateTracking';
import { linkVisitorToUser, getVisitorId } from '@/utils/visitor';
import { toast } from 'sonner';

const PENDING_PAYMENT_KEY = 'pendingPayment';
const PAYMENT_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface PendingPayment {
  packageName: string;
  packagePrice: string;
  paymentType: 'deposit' | 'full';
  timestamp: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const processingPaymentRef = useRef(false);

  // Process pending payment after successful authentication
  const processPendingPayment = async (userSession: Session) => {
    // Double-click protection
    if (processingPaymentRef.current) {
      console.log('Already processing pending payment, skipping...');
      return;
    }

    const pendingPaymentStr = localStorage.getItem(PENDING_PAYMENT_KEY);
    if (!pendingPaymentStr) return;

    try {
      const pendingPayment: PendingPayment = JSON.parse(pendingPaymentStr);
      
      // Check if payment is expired
      if (Date.now() - pendingPayment.timestamp > PAYMENT_EXPIRY_MS) {
        console.log('Pending payment expired, clearing...');
        localStorage.removeItem(PENDING_PAYMENT_KEY);
        return;
      }

      processingPaymentRef.current = true;
      
      // Clear pending payment immediately to prevent duplicate processing
      localStorage.removeItem(PENDING_PAYMENT_KEY);

      console.log('Processing pending payment:', pendingPayment);
      
      toast.info("Resuming your booking...", {
        description: "Redirecting to checkout...",
      });

      // Calculate amount based on payment type
      const priceNumber = parseFloat(pendingPayment.packagePrice.replace(/[^0-9.]/g, ''));
      const amount = pendingPayment.paymentType === 'deposit' 
        ? Math.round(priceNumber * 0.3 * 100) // 30% deposit in cents
        : Math.round(priceNumber * 100); // Full amount in cents

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          packageName: pendingPayment.packageName,
          amount: amount,
          paymentType: pendingPayment.paymentType,
        },
      });

      if (error) throw error;

      if (data?.url) {
        console.log('Redirecting to Stripe checkout:', data.url);
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error processing pending payment:', error);
      processingPaymentRef.current = false;
      toast.error("Checkout Error", {
        description: "Failed to resume checkout. Please try again.",
      });
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Link visitorId to user profile when signing in
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            // Link visitor to user profile (unified visitor tracking)
            await linkVisitorToUser(session.user.id);
            linkVisitorIdToProfile(session.user.id);
            // Track referral conversion for new registrations
            const isNewUser = session.user.created_at === session.user.last_sign_in_at;
            if (isNewUser) {
              await trackReferralConversion('registration', {
                user_email: session.user.email,
                user_name: session.user.user_metadata?.full_name || '',
                auth_provider: session.user.app_metadata?.provider || 'email'
              }, session.user.id);
            }
            
            // Process pending payment if exists (for OAuth redirects)
            await processPendingPayment(session);
            
            // Handle post-login redirect (only if no pending payment was processed)
            if (!processingPaymentRef.current) {
              // Check for campaign booking return URL first
              const postLoginReturnTo = localStorage.getItem('postLoginReturnTo');
              const postLoginAction = localStorage.getItem('postLoginAction');
              
              if (postLoginReturnTo && postLoginAction === 'resume_campaign_bookfunnel') {
                localStorage.removeItem('postLoginReturnTo');
                localStorage.removeItem('postLoginAction');
                
                // Only redirect if not already on the target page
                if (!window.location.pathname.startsWith(postLoginReturnTo.split('?')[0])) {
                  window.location.href = postLoginReturnTo;
                }
                return;
              }
              
              // Fall back to legacy intendedRoute
              const intendedRoute = localStorage.getItem('intendedRoute');
              if (intendedRoute) {
                localStorage.removeItem('intendedRoute');
                window.location.href = intendedRoute;
              }
            }
          }, 0);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          console.log('Initial session:', session?.user?.email);
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error in getSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const linkVisitorIdToProfile = async (userId: string) => {
    try {
      // Check for unified visitor ID first, fall back to legacy
      const visitorId = getVisitorId() || localStorage.getItem('homepage-visitor-id');
      
      if (visitorId) {
        console.log('Linking visitorId to profile:', visitorId);
        
        // Update the user's profile with the visitorId
        const { error } = await supabase
          .from('profiles')
          .update({ visitor_id: visitorId })
          .eq('id', userId);
          
        if (error) {
          console.error('Error linking visitorId to profile:', error);
        } else {
          console.log('Successfully linked visitorId to profile');
        }

        // Sync phone from popup submissions
        const { data: submissions } = await supabase
          .from('visitor_popup_submissions')
          .select('*')
          .eq('visitor_id', visitorId)
          .eq('synced_to_profile', false)
          .order('submitted_at', { ascending: false });

        if (submissions && submissions.length > 0) {
          const latestSubmission = submissions[0];
          
          // Update profile with phone if not already set
          const { data: profile } = await supabase
            .from('profiles')
            .select('promotional_phone')
            .eq('id', userId)
            .maybeSingle();

          if (!profile?.promotional_phone && latestSubmission.phone_number) {
            await supabase.from('profiles')
              .update({ promotional_phone: latestSubmission.phone_number })
              .eq('id', userId);
          }

          // Mark submission as synced
          await supabase.from('visitor_popup_submissions')
            .update({ 
              synced_to_profile: true, 
              synced_at: new Date().toISOString(),
              user_id: userId 
            })
            .eq('id', latestSubmission.id);
        }
      }
    } catch (error) {
      console.error('Error in linkVisitorIdToProfile:', error);
    }
  };

  const cleanupAuthState = () => {
    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Remove from sessionStorage if in use
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const signOut = async () => {
    try {
      console.log('Signing out user...');
      
      // Clean up auth state first
      cleanupAuthState();
      
      // Attempt global sign out (ignore errors since session might be missing)
      try {
        await supabase.auth.signOut({ scope: 'global' });
        console.log('Sign out successful');
      } catch (error) {
        console.log('Sign out completed (session was already missing)');
      }
      
      // Force page refresh for a clean state
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, force refresh to clean state
      window.location.href = '/';
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
