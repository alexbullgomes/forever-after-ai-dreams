import { useSiteSettings, BrandColors } from './useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useSiteSettingsAdmin = () => {
  const { colors, loading } = useSiteSettings();
  const { toast } = useToast();
  const { user } = useAuth();

  const updateColors = async (newColors: BrandColors): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to update colors',
        variant: 'destructive'
      });
      return false;
    }

    const { error } = await supabase
      .from('site_settings')
      .update({ 
        value: newColors as any,
        updated_by: user.id 
      })
      .eq('key', 'brand_colors');

    if (error) {
      console.error('Error updating colors:', error);
      toast({
        title: 'Error',
        description: 'Failed to update brand colors',
        variant: 'destructive'
      });
      return false;
    }

    toast({
      title: 'Success',
      description: 'Brand colors updated successfully!'
    });
    return true;
  };

  return { colors, loading, updateColors };
};
