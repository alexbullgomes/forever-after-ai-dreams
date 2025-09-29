import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUserDashboardAccess = () => {
  const { user, loading: authLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) {
        setLoading(true);
        return;
      }

      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_dashboard')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking user dashboard access:', error);
          setHasAccess(false);
        } else {
          setHasAccess(data?.user_dashboard === true);
        }
      } catch (error) {
        console.error('Error in checkAccess:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user, authLoading]);

  return { hasAccess, loading };
};
