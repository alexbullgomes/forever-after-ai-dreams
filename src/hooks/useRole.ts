import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'admin' | 'moderator' | 'user';

export const useRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        console.log('Fetching role for user:', user.id, user.email);
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        console.log('Role query result:', { data, error });

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user role:', error);
          setRole('user');
        } else {
          const userRole = data?.role || 'user';
          console.log('Setting user role to:', userRole);
          setRole(userRole);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole('user');
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  const isAdmin = role === 'admin';
  const isModerator = role === 'moderator';
  const isUser = role === 'user';

  return {
    role,
    loading,
    isAdmin,
    isModerator,
    isUser,
  };
};