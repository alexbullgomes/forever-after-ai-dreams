import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AffiliateData {
  id: string;
  referral_code: string;
  is_active: boolean;
  total_referrals: number;
  created_at: string;
}

export const useAffiliate = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAffiliateData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchAffiliateData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching affiliate data:', error);
        return;
      }

      setAffiliate(data);
    } catch (error) {
      console.error('Error in fetchAffiliateData:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAffiliateAccount = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create an affiliate account.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Generate referral code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_referral_code', { user_name: user.user_metadata?.full_name || user.email });

      if (codeError) {
        console.error('Error generating referral code:', codeError);
        toast({
          title: "Error",
          description: "Failed to generate referral code. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Create affiliate record
      const { data, error } = await supabase
        .from('affiliates')
        .insert({
          user_id: user.id,
          referral_code: codeData,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating affiliate account:', error);
        toast({
          title: "Error",
          description: "Failed to create affiliate account. Please try again.",
          variant: "destructive"
        });
        return;
      }

      setAffiliate(data);
      toast({
        title: "Success!",
        description: "Your affiliate account has been created successfully!",
      });
    } catch (error) {
      console.error('Error in createAffiliateAccount:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getReferralUrl = () => {
    if (!affiliate) return '';
    return `${window.location.origin}?ref=${affiliate.referral_code}`;
  };

  return {
    affiliate,
    loading,
    createAffiliateAccount,
    getReferralUrl,
    refetch: fetchAffiliateData
  };
};