import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AffiliateWithProfile {
  id: string;
  user_id: string;
  referral_code: string;
  total_referrals: number;
  is_active: boolean;
  created_at: string;
  profile?: {
    name: string | null;
    email: string | null;
  };
}

interface ReferralWithDetails {
  id: string;
  affiliate_id: string;
  referred_user_id: string | null;
  referral_code: string;
  visitor_id: string | null;
  conversion_type: string;
  conversion_data: unknown;
  campaign_source: string | null;
  deal_status: string | null;
  commission_amount: number | null;
  commission_paid_at: string | null;
  admin_notes: string | null;
  created_at: string;
  referred_user?: {
    name: string | null;
    email: string | null;
  };
  affiliate?: {
    referral_code: string;
    profile?: {
      name: string | null;
    };
  };
}

interface AnalyticsStats {
  totalAffiliates: number;
  activeAffiliates: number;
  totalReferrals: number;
  pendingCommissions: number;
  paidCommissions: number;
  dealsClosed: number;
}

export const useAffiliateAnalytics = () => {
  const [affiliates, setAffiliates] = useState<AffiliateWithProfile[]>([]);
  const [referrals, setReferrals] = useState<ReferralWithDetails[]>([]);
  const [stats, setStats] = useState<AnalyticsStats>({
    totalAffiliates: 0,
    activeAffiliates: 0,
    totalReferrals: 0,
    pendingCommissions: 0,
    paidCommissions: 0,
    dealsClosed: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAffiliates = useCallback(async () => {
    const { data, error } = await supabase
      .from('affiliates')
      .select('*')
      .order('total_referrals', { ascending: false });

    if (error) {
      console.error('Error fetching affiliates:', error);
      return [];
    }

    // Fetch profile data for each affiliate
    const affiliatesWithProfiles = await Promise.all(
      (data || []).map(async (affiliate) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', affiliate.user_id)
          .single();

        return {
          ...affiliate,
          profile: profile || undefined
        };
      })
    );

    return affiliatesWithProfiles;
  }, []);

  const fetchReferrals = useCallback(async () => {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching referrals:', error);
      return [];
    }

    // Fetch additional details for each referral
    const referralsWithDetails = await Promise.all(
      (data || []).map(async (referral) => {
        let referred_user;
        let affiliate;

        if (referral.referred_user_id) {
          const { data: userData } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', referral.referred_user_id)
            .single();
          referred_user = userData || undefined;
        }

        const { data: affiliateData } = await supabase
          .from('affiliates')
          .select('referral_code, user_id')
          .eq('id', referral.affiliate_id)
          .single();

        if (affiliateData) {
          const { data: affiliateProfile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', affiliateData.user_id)
            .single();

          affiliate = {
            referral_code: affiliateData.referral_code,
            profile: affiliateProfile || undefined
          };
        }

        return {
          ...referral,
          referred_user,
          affiliate
        };
      })
    );

    return referralsWithDetails;
  }, []);

  const calculateStats = useCallback((affiliatesData: AffiliateWithProfile[], referralsData: ReferralWithDetails[]) => {
    const totalAffiliates = affiliatesData.length;
    const activeAffiliates = affiliatesData.filter(a => a.is_active).length;
    const totalReferrals = referralsData.length;
    
    const pendingCommissions = referralsData
      .filter(r => r.deal_status === 'deal_closed' && !r.commission_paid_at)
      .reduce((sum, r) => sum + (r.commission_amount || 0), 0);
    
    const paidCommissions = referralsData
      .filter(r => r.commission_paid_at)
      .reduce((sum, r) => sum + (r.commission_amount || 0), 0);
    
    const dealsClosed = referralsData.filter(r => r.deal_status === 'deal_closed').length;

    return {
      totalAffiliates,
      activeAffiliates,
      totalReferrals,
      pendingCommissions,
      paidCommissions,
      dealsClosed
    };
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [affiliatesData, referralsData] = await Promise.all([
        fetchAffiliates(),
        fetchReferrals()
      ]);

      setAffiliates(affiliatesData);
      setReferrals(referralsData);
      setStats(calculateStats(affiliatesData, referralsData));
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [fetchAffiliates, fetchReferrals, calculateStats]);

  const updateReferralStatus = async (
    referralId: string, 
    updates: { 
      deal_status?: string; 
      commission_amount?: number; 
      admin_notes?: string;
      commission_paid_at?: string | null;
    }
  ) => {
    const { error } = await supabase
      .from('referrals')
      .update(updates)
      .eq('id', referralId);

    if (error) {
      console.error('Error updating referral:', error);
      return false;
    }

    // Refetch data after update
    await fetchAllData();
    return true;
  };

  const markDealClosed = async (referralId: string, commissionAmount: number) => {
    return updateReferralStatus(referralId, {
      deal_status: 'deal_closed',
      commission_amount: commissionAmount
    });
  };

  const markCommissionPaid = async (referralId: string) => {
    return updateReferralStatus(referralId, {
      commission_paid_at: new Date().toISOString()
    });
  };

  // Initial fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('affiliate-analytics-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'referrals'
      }, () => {
        fetchAllData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'affiliates'
      }, () => {
        fetchAllData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllData]);

  return {
    affiliates,
    referrals,
    stats,
    loading,
    error,
    refetch: fetchAllData,
    updateReferralStatus,
    markDealClosed,
    markCommissionPaid
  };
};
