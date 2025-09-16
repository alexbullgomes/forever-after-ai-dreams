
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
          setTimeout(() => {
            linkVisitorIdToProfile(session.user.id);
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
      // Check if visitorId exists in localStorage
      const visitorId = localStorage.getItem('homepage-visitor-id');
      
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
