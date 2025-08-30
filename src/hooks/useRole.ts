import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useRole = (requiredRole: 'admin' | 'moderator' | 'user') => {
  const { user, loading: authLoading } = useAuth();
  const [hasRole, setHasRole] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      console.log('🔍 Starting role check for user:', user?.id, 'Required role:', requiredRole);
      console.log('📧 User email:', user?.email);
      console.log('🔄 Auth loading:', authLoading);
      
      // Wait for auth to fully load before checking role
      if (authLoading) {
        console.log('⏳ Auth still loading, waiting...');
        return;
      }
      
      if (!user) {
        console.log('❌ No user found - setting hasRole to false');
        setHasRole(false);
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Querying profiles table for role...');
        const { data, error } = await supabase
          .from('profiles')
          .select('role, id')
          .eq('id', user.id)
          .maybeSingle();

        console.log('📊 Role query details:', {
          userId: user.id,
          userEmail: user.email,
          requiredRole,
          queryData: data,
          queryError: error,
          userRole: data?.role || 'user'
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
          // If no profile exists, default role is 'user'
          const userRole = data?.role || 'user';
          const hasRoleResult = userRole === requiredRole;
          console.log('✅ Role check complete:', {
            hasRole: hasRoleResult,
            userRole: userRole,
            requiredRole: requiredRole,
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
  }, [user, requiredRole, authLoading]);

  return { hasRole, loading };
};