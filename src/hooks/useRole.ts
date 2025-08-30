import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useRole = (requiredRole: 'admin' | 'moderator' | 'user') => {
  const { user } = useAuth();
  const [hasRole, setHasRole] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      console.log('🔍 Starting role check for user:', user?.id, 'Required role:', requiredRole);
      console.log('📧 User email:', user?.email);
      
      if (!user) {
        console.log('❌ No user found - setting hasRole to false');
        setHasRole(false);
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Querying user_roles table...');
        const { data, error } = await supabase
          .from('user_roles')
          .select('role, user_id')
          .eq('user_id', user.id)
          .eq('role', requiredRole)
          .maybeSingle();

        console.log('📊 Role query details:', {
          userId: user.id,
          userEmail: user.email,
          requiredRole,
          queryData: data,
          queryError: error,
          hasData: !!data
        });

        if (error) {
          console.error('❌ Supabase error during role check:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          setHasRole(false);
        } else {
          const hasRoleResult = !!data;
          console.log('✅ Role check complete:', {
            hasRole: hasRoleResult,
            data: data,
            userEmail: user.email
          });
          setHasRole(hasRoleResult);
        }
      } catch (error) {
        console.error('❌ Unexpected error during role check:', error);
        setHasRole(false);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [user, requiredRole]);

  return { hasRole, loading };
};