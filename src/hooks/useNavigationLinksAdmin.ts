import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { NavigationLink } from './useNavigationLinks';

type LinkInput = Omit<NavigationLink, 'id'>;

export const useNavigationLinksAdmin = () => {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['navigation-links'] });
    queryClient.invalidateQueries({ queryKey: ['navigation-links-admin'] });
  };

  const { data: links = [], isLoading: loading } = useQuery({
    queryKey: ['navigation-links-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('navigation_links')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as NavigationLink[];
    },
  });

  const createLink = useMutation({
    mutationFn: async (input: Partial<LinkInput>) => {
      const { error } = await supabase.from('navigation_links').insert({
        label: input.label || 'New Link',
        url: input.url || '/',
        type: input.type || 'internal',
        open_in_new_tab: input.open_in_new_tab ?? false,
        is_active: input.is_active ?? true,
        sort_order: input.sort_order ?? links.length,
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Link created'); },
    onError: () => toast.error('Failed to create link'),
  });

  const updateLink = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NavigationLink> & { id: string }) => {
      const { error } = await supabase
        .from('navigation_links')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Link updated'); },
    onError: () => toast.error('Failed to update link'),
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('navigation_links').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Link deleted'); },
    onError: () => toast.error('Failed to delete link'),
  });

  const reorderLinks = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) =>
        supabase.from('navigation_links').update({ sort_order: index, updated_at: new Date().toISOString() }).eq('id', id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => invalidate(),
    onError: () => toast.error('Failed to reorder'),
  });

  return { links, loading, createLink, updateLink, deleteLink, reorderLinks };
};
