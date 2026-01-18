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

interface ReferralStats {
  totalReferrals: number;
  negotiating: number;
  dealsClosed: number;
}

interface UserReferral {
  id: string;
  deal_status: string | null;
  admin_notes: string | null;
  created_at: string;
  campaign_source: string | null;
}

export const useAffiliate = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferrals: 0,
    negotiating: 0,
    dealsClosed: 0
  });
  const [referrals, setReferrals] = useState<UserReferral[]>([]);

  useEffect(() => {
    if (user) {
      fetchAffiliateData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Fetch referrals when affiliate is loaded
  useEffect(() => {
    if (affiliate?.id) {
      fetchReferrals();
    }
  }, [affiliate?.id]);

  // Real-time subscription for referral updates
  useEffect(() => {
    if (!affiliate?.id) return;

    const channel = supabase
      .channel('user-referral-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'referrals',
        filter: `affiliate_id=eq.${affiliate.id}`
      }, () => {
        fetchReferrals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [affiliate?.id]);

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

  const fetchReferrals = async () => {
    if (!affiliate?.id) return;

    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('id, deal_status, admin_notes, created_at, campaign_source')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching referrals:', error);
        return;
      }

      const referralsList = data || [];
      setReferrals(referralsList);

      // Calculate stats
      const stats: ReferralStats = {
        totalReferrals: referralsList.filter(r => r.deal_status === 'registered' || !r.deal_status).length,
        negotiating: referralsList.filter(r => r.deal_status === 'negotiating').length,
        dealsClosed: referralsList.filter(r => r.deal_status === 'deal_closed').length
      };
      setReferralStats(stats);
    } catch (error) {
      console.error('Error in fetchReferrals:', error);
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

  const updateReferralCode = async (newCode: string) => {
    if (!user || !affiliate) {
      toast({
        title: "Error",
        description: "Unable to update referral code.",
        variant: "destructive"
      });
      return false;
    }

    try {
      setLoading(true);

      // Validate format (alphanumeric, 3-20 characters)
      const codeRegex = /^[A-Z0-9]{3,20}$/;
      if (!codeRegex.test(newCode)) {
        toast({
          title: "Invalid code",
          description: "Code must be 3-20 uppercase letters/numbers only.",
          variant: "destructive"
        });
        return false;
      }

      // Check if code is already taken
      const { data: existingAffiliate, error: checkError } = await supabase
        .from('affiliates')
        .select('id')
        .eq('referral_code', newCode)
        .neq('id', affiliate.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking code availability:', checkError);
        toast({
          title: "Error",
          description: "Failed to verify code availability.",
          variant: "destructive"
        });
        return false;
      }

      if (existingAffiliate) {
        toast({
          title: "Code taken",
          description: "This referral code is already in use. Please try another.",
          variant: "destructive"
        });
        return false;
      }

      // Update the code
      const { error: updateError } = await supabase
        .from('affiliates')
        .update({ referral_code: newCode })
        .eq('id', affiliate.id);

      if (updateError) {
        console.error('Error updating referral code:', updateError);
        toast({
          title: "Error",
          description: "Failed to update referral code. Please try again.",
          variant: "destructive"
        });
        return false;
      }

      // Refresh affiliate data
      await fetchAffiliateData();
      
      toast({
        title: "Success!",
        description: "Your referral code has been updated.",
      });
      
      return true;
    } catch (error) {
      console.error('Error in updateReferralCode:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    affiliate,
    loading,
    createAffiliateAccount,
    getReferralUrl,
    updateReferralCode,
    refetch: fetchAffiliateData,
    referralStats,
    referrals,
    refetchReferrals: fetchReferrals
  };
};