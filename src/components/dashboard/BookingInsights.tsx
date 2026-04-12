import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Activity, CalendarDays, Clock, CreditCard, CheckCircle, AlertTriangle,
  ChevronRight, DollarSign, MessageSquare, Eye, Zap, AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type TimeFilter = 'all' | 'today' | 'week' | 'month';

const filterLabels: { key: TimeFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

const getFilterDate = (filter: TimeFilter): Date | null => {
  if (filter === 'all') return null;
  const now = new Date();
  switch (filter) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    case 'month': {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return d;
    }
  }
};

interface BookingRequestRow {
  id: string;
  stage: string;
  created_at: string;
  last_seen_at: string;
  user_id: string | null;
  product_id: string | null;
  package_id: string | null;
  products: { title: string; price: number } | null;
  campaign_packages: { title: string; minimum_deposit_cents: number } | null;
}

const STAGES = ['date_selected', 'time_selected', 'checkout_started', 'paid'] as const;

const stageConfig = [
  { key: 'date_selected', label: 'Date Selected', icon: CalendarDays },
  { key: 'time_selected', label: 'Time Selected', icon: Clock },
  { key: 'checkout_started', label: 'Checkout', icon: CreditCard },
  { key: 'paid', label: 'Paid', icon: CheckCircle },
];

const BookingInsights = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<BookingRequestRow[]>([]);
  const [filter, setFilter] = useState<TimeFilter>('all');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const { data: rows, error } = await supabase
      .from('booking_requests')
      .select('id, stage, created_at, last_seen_at, user_id, product_id, package_id, products:product_id(title, price), campaign_packages:package_id(title, minimum_deposit_cents)')
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (!error && rows) {
      setData(rows as unknown as BookingRequestRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('booking-insights')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_requests' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => {
    const cutoff = getFilterDate(filter);
    return cutoff ? data.filter(r => new Date(r.created_at) >= cutoff) : data;
  }, [data, filter]);

  const stageCounts = useMemo(() => {
    const map: Record<string, number> = {};
    STAGES.forEach(s => { map[s] = 0; });
    map['abandoned'] = 0;
    filtered.forEach(r => {
      if (map[r.stage] !== undefined) map[r.stage]++;
      if (r.stage !== 'paid' && r.stage !== 'contacted') {
        const lastSeen = new Date(r.last_seen_at).getTime();
        if (Date.now() - lastSeen > 24 * 60 * 60 * 1000) map['abandoned']++;
      }
    });
    return map;
  }, [filtered]);

  const totalInFlow = useMemo(
    () => filtered.filter(r => r.stage !== 'paid').length,
    [filtered]
  );

  const revenueEstimate = useMemo(() => {
    let total = 0;
    filtered.forEach(r => {
      if (r.stage === 'time_selected' || r.stage === 'checkout_started') {
        if (r.products?.price) total += Number(r.products.price);
        else if (r.campaign_packages?.minimum_deposit_cents) total += r.campaign_packages.minimum_deposit_cents / 100;
      }
    });
    return total;
  }, [filtered]);

  const funnelSteps = useMemo(() => {
    const counts = STAGES.map(s => ({ stage: s, count: stageCounts[s] || 0 }));
    return counts.map((step, i) => {
      const prev = i > 0 ? counts[i - 1].count : null;
      const dropOff = prev && prev > 0 ? Math.round(((prev - step.count) / prev) * 100) : null;
      return { ...step, dropOff };
    });
  }, [stageCounts]);

  const hotLeads = useMemo(() => {
    const now = Date.now();
    return filtered
      .filter(r => r.stage !== 'paid' && r.stage !== 'contacted')
      .map(r => {
        const inactiveMs = now - new Date(r.last_seen_at).getTime();
        const hours = inactiveMs / (1000 * 60 * 60);
        const urgency: 'recent' | 'attention' | 'urgent' =
          hours < 12 ? 'recent' : hours < 24 ? 'attention' : 'urgent';
        return { ...r, inactiveMs, urgency };
      })
      .sort((a, b) => b.inactiveMs - a.inactiveMs)
      .slice(0, 5);
  }, [filtered]);

  const navigateToStage = (stage: string) => {
    navigate(`/dashboard/bookings-pipeline?stage=${encodeURIComponent(stage)}`);
  };

  const UrgencyIcon = ({ urgency }: { urgency: 'recent' | 'attention' | 'urgent' }) => {
    if (urgency === 'recent') return <Zap className="h-3.5 w-3.5 text-emerald-500" />;
    if (urgency === 'attention') return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
    return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
  };

  const metricItems = [
    { key: 'total', label: 'In Flow', value: totalInFlow, icon: Activity, onClick: () => navigateToStage('all') },
    { key: 'date_selected', label: 'Date', value: stageCounts['date_selected'] || 0, icon: CalendarDays, onClick: () => navigateToStage('date_selected') },
    { key: 'time_selected', label: 'Time', value: stageCounts['time_selected'] || 0, icon: Clock, onClick: () => navigateToStage('time_selected') },
    { key: 'checkout_started', label: 'Checkout', value: stageCounts['checkout_started'] || 0, icon: CreditCard, onClick: () => navigateToStage('checkout_started') },
    { key: 'paid', label: 'Paid', value: stageCounts['paid'] || 0, icon: CheckCircle, onClick: () => navigateToStage('paid') },
    { key: 'abandoned', label: 'Abandoned', value: stageCounts['abandoned'] || 0, icon: AlertTriangle, onClick: () => navigateToStage('all'), accent: true },
  ];

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Booking Pipeline Insights</h2>
          <p className="text-xs text-muted-foreground">Funnel performance & follow-up alerts</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-0.5">
          {filterLabels.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition-all duration-200 ${
                filter === key
                  ? 'bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-16">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Compact Metrics Bar */}
          <div className="rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm px-2 py-1.5">
            <div className="grid grid-cols-3 gap-0.5 sm:flex sm:flex-wrap sm:items-center sm:gap-1">
              {metricItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={item.key} className="flex items-center">
                    <button
                      onClick={item.onClick}
                      className="flex items-center gap-1 px-1.5 py-1 sm:gap-1.5 sm:px-2.5 sm:py-1.5 rounded-lg hover:bg-muted/60 transition-all duration-200 w-full sm:w-auto justify-center sm:justify-start"
                    >
                      <Icon className={`h-3.5 w-3.5 ${item.accent ? 'text-red-500' : 'text-muted-foreground'}`} />
                      <span className={`text-xs sm:text-sm font-bold ${item.accent ? 'text-red-500' : 'text-foreground'}`}>{item.value}</span>
                      <span className="text-[10px] text-muted-foreground">{item.label}</span>
                    </button>
                    {i < metricItems.length - 1 && <div className="hidden sm:block w-px h-5 bg-border/50 mx-0.5" />}
                  </div>
                );
              })}
            </div>

            {/* Revenue pill — full width on mobile */}
            <div className="hidden sm:block w-px h-5 bg-border/50 mx-0.5 sm:inline-block" />
            <div className="relative group/revenue mt-1 sm:mt-0 sm:inline-flex border-t border-border/30 sm:border-0 pt-1 sm:pt-0">
              <button
                onClick={() => navigateToStage('all')}
                className="flex items-center gap-1 px-1.5 py-1 sm:gap-1.5 sm:px-2.5 sm:py-1.5 rounded-lg hover:bg-muted/60 transition-all duration-200 w-full sm:w-auto justify-center sm:justify-start"
              >
                <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs sm:text-sm font-bold text-foreground">${revenueEstimate.toLocaleString()}</span>
                <span className="text-[10px] text-muted-foreground">Pipeline</span>
              </button>
              <div className="invisible group-hover/revenue:visible absolute right-0 top-full mt-1 z-10 bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[180px]">
                <p className="text-xs font-medium text-foreground mb-1.5">Revenue Breakdown</p>
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time Selected</span>
                    <span className="text-foreground font-medium">{stageCounts['time_selected']} bookings</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Checkout Started</span>
                    <span className="text-foreground font-medium">{stageCounts['checkout_started']} bookings</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inline Funnel */}
          <div className="flex items-center gap-1 px-2 overflow-x-auto flex-nowrap sm:flex-wrap sm:justify-center">
            {funnelSteps.map((step, i) => {
              const cfg = stageConfig.find(s => s.key === step.stage)!;
              const Icon = cfg.icon;
              return (
                <div key={step.stage} className="flex items-center gap-1 shrink-0">
                  <div className="flex items-center gap-1 sm:gap-1.5 rounded-lg bg-muted/50 px-2 py-1 sm:px-2.5 sm:py-1.5">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-xs sm:text-sm font-bold text-foreground leading-none">{step.count}</p>
                      <p className="text-[9px] text-muted-foreground">{cfg.label}</p>
                    </div>
                  </div>
                  {i < funnelSteps.length - 1 && (
                    <div className="flex flex-col items-center">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      {funnelSteps[i + 1]?.dropOff !== null && (
                        <span className="hidden sm:block text-[8px] text-red-500 font-medium leading-none">
                          -{funnelSteps[i + 1].dropOff}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Condensed Hot Leads */}
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <h3 className="text-xs font-semibold text-foreground">Urgency Alerts</h3>
              </div>
              <button
                onClick={() => navigate('/dashboard/bookings-pipeline')}
                className="text-[10px] text-primary hover:underline font-medium"
              >
                View All →
              </button>
            </div>

            {hotLeads.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                No urgent follow-ups
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {hotLeads.map(lead => (
                  <div key={lead.id} className="group flex items-center gap-2 sm:gap-3 px-2 py-1.5 sm:px-3 sm:py-2 hover:bg-muted/20 transition-colors">
                     <span className="flex-1 truncate font-medium text-xs text-foreground max-w-[120px] sm:max-w-none">
                       {lead.products?.title || lead.campaign_packages?.title || 'Unknown'}
                     </span>
                     <span className="hidden sm:inline text-[10px] text-muted-foreground capitalize whitespace-nowrap">
                       {lead.stage.replace('_', ' ')}
                     </span>
                     <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                       {formatDistanceToNow(new Date(lead.last_seen_at), { addSuffix: true })}
                     </span>
                     <UrgencyIcon urgency={lead.urgency} />
                     <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                       <button
                        onClick={() => navigate(`/dashboard/bookings-pipeline?stage=${lead.stage}`)}
                        className="p-1 rounded-md hover:bg-muted transition-colors"
                        title="View booking"
                      >
                        <Eye className="h-3 w-3 text-muted-foreground" />
                      </button>
                      {lead.user_id && (
                        <button
                          onClick={() => navigate(`/dashboard/chat-admin?conversationId=${lead.user_id}`)}
                          className="p-1 rounded-md hover:bg-muted transition-colors"
                          title="Open conversation"
                        >
                          <MessageSquare className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingInsights;
