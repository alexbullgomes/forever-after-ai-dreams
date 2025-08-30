import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useRole = (requiredRole: 'admin' | 'moderator' | 'user') => {
  const { user } = useAuth();
  const [hasRole, setHasRole] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setHasRole(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', requiredRole)
          .maybeSingle();

        if (error) {
          console.error('Error checking role:', error);
          setHasRole(false);
        } else {
          setHasRole(!!data);
        }
      } catch (error) {
        console.error('Error in role check:', error);
        setHasRole(false);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [user, requiredRole]);

  return { hasRole, loading };
};