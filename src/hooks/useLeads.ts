import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeadFilters {
  hasPhone?: boolean;
  hasReferral?: boolean;
  search?: string;
  range?: string; // 'today' | '7d' | '30d' | ''
  page: number;
  pageSize: number;
}

export interface LeadRow {
  id: string;
  name: string | null;
  email: string | null;
  user_number: string | null;
  created_at: string;
  role: string | null;
  referred_by: string | null;
  visitor_id: string | null;
  status: string | null;
}

function getDateRangeStart(range: string | undefined): Date | null {
  if (!range) return null;
  const now = new Date();
  switch (range) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

export function useLeads(filters: LeadFilters) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => {
      const from = filters.page * filters.pageSize;
      const to = from + filters.pageSize - 1;

      let query = supabase
        .from('profiles')
        .select('id, name, email, user_number, created_at, role, referred_by, visitor_id, status', { count: 'exact' });

      if (filters.hasPhone) {
        query = query.not('user_number', 'is', null).neq('user_number', '');
      }

      if (filters.hasReferral) {
        query = query.not('referred_by', 'is', null);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const rangeStart = getDateRangeStart(filters.range);
      if (rangeStart) {
        query = query.gte('created_at', rangeStart.toISOString());
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        data: (data || []) as LeadRow[],
        totalCount: count || 0,
      };
    },
  });
}
