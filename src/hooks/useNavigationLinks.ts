import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NavigationLink {
  id: string;
  label: string;
  url: string;
  type: 'internal' | 'external';
  open_in_new_tab: boolean;
  is_active: boolean;
  sort_order: number;
}

export const useNavigationLinks = () => {
  const { data: links = [], isLoading: loading } = useQuery({
    queryKey: ['navigation-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('navigation_links')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as NavigationLink[];
    },
    staleTime: 5 * 60 * 1000,
  });

  return { links, loading };
};
