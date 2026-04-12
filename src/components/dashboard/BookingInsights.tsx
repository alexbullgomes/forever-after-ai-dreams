import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Activity, CalendarDays, Clock, CreditCard, CheckCircle, AlertTriangle,
  ChevronRight, DollarSign, MessageSquare, Eye
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
  { key: 'date_selected', label: 'Date Selected', icon: CalendarDays, borderColor: 'border-l-muted-foreground' },
  { key: 'time_selected', label: 'Time Selected', icon: Clock, borderColor: 'border-l-indigo-500' },
  { key: 'checkout_started', label: 'Checkout Started', icon: CreditCard, borderColor: 'border-l-amber-500' },
  { key: 'paid', label: 'Paid', icon: CheckCircle, borderColor: 'border-l-emerald-500' },
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
      // Abandoned: non-paid, inactive >24h
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

  // Revenue opportunity
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

  // Funnel drop-off
  const funnelSteps = useMemo(() => {
    const counts = STAGES.map(s => ({ stage: s, count: stageCounts[s] || 0 }));
    return counts.map((step, i) => {
      const prev = i > 0 ? counts[i - 1].count : null;
      const dropOff = prev && prev > 0 ? Math.round(((prev - step.count) / prev) * 100) : null;
      return { ...step, dropOff };
    });
  }, [stageCounts]);

  // Hot leads (top 10 stale non-paid)
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
      .slice(0, 10);
  }, [filtered]);

  const navigateToStage = (stage: string) => {
    navigate(`/dashboard/bookings-pipeline?stage=${encodeURIComponent(stage)}`);
  };

  const urgencyBadge = (urgency: 'recent' | 'attention' | 'urgent') => {
    const styles = {
      recent: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      attention: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      urgent: 'bg-red-500/10 text-red-600 border-red-500/20',
    };
    const labels = { recent: 'Recent', attention: 'Needs Attention', urgent: 'Urgent' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${styles[urgency]}`}>
        {labels[urgency]}
      </span>
    );
  };

  const metricCards = [
    { key: 'total', label: 'Total in Flow', value: totalInFlow, icon: Activity, borderColor: 'border-l-blue-500', onClick: () => navigateToStage('all') },
    ...stageConfig.map(s => ({
      key: s.key,
      label: s.label,
      value: stageCounts[s.key] || 0,
      icon: s.icon,
      borderColor: s.borderColor,
      onClick: () => navigateToStage(s.key),
    })),
    { key: 'abandoned', label: 'Abandoned', value: stageCounts['abandoned'] || 0, icon: AlertTriangle, borderColor: 'border-l-red-500', onClick: () => navigateToStage('all') },
  ];

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Booking Pipeline Insights</h2>
          <p className="text-sm text-muted-foreground">
            Booking funnel performance & follow-up alerts
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
          {filterLabels.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
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
        <div className="flex items-center justify-center h-24">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {metricCards.map(card => {
              const Icon = card.icon;
              return (
                <button
                  key={card.key}
                  onClick={card.onClick}
                  className={`flex flex-col gap-2 rounded-xl border-l-4 ${card.borderColor} bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm p-4 text-left hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold text-foreground">{card.value}</span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground leading-tight">{card.label}</span>
                </button>
              );
            })}
          </div>

          {/* Funnel Visualization */}
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-4">Conversion Funnel</h3>
            <div className="flex flex-col md:flex-row items-stretch gap-2">
              {funnelSteps.map((step, i) => {
                const cfg = stageConfig.find(s => s.key === step.stage)!;
                const Icon = cfg.icon;
                const maxCount = funnelSteps[0].count || 1;
                const widthPct = Math.max(20, (step.count / maxCount) * 100);
                return (
                  <div key={step.stage} className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-3 flex-shrink-0"
                      style={{ width: `${widthPct}%`, minWidth: 'fit-content' }}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-lg font-bold text-foreground leading-none">{step.count}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{cfg.label}</p>
                      </div>
                    </div>
                    {i < funnelSteps.length - 1 && (
                      <div className="flex flex-col items-center flex-shrink-0">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        {step.dropOff !== null && i > 0 && (
                          <span className="text-[9px] text-red-500 font-medium whitespace-nowrap">
                            -{funnelSteps[i + 1]?.dropOff ?? 0}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue Opportunity + Hot Leads side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Card */}
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-semibold text-foreground">Revenue Opportunity</h3>
              </div>
              <p className="text-3xl font-bold text-foreground">${revenueEstimate.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Estimated from {stageCounts['time_selected'] + stageCounts['checkout_started']} in-progress bookings
              </p>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Time Selected</span>
                  <span className="font-medium text-foreground">{stageCounts['time_selected']} bookings</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Checkout Started</span>
                  <span className="font-medium text-foreground">{stageCounts['checkout_started']} bookings</span>
                </div>
              </div>
            </div>

            {/* Hot Leads Table */}
            <div className="lg:col-span-2 bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-semibold text-foreground">Urgency Alerts</h3>
                </div>
                <button
                  onClick={() => navigate('/dashboard/bookings-pipeline')}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  View All →
                </button>
              </div>

              {hotLeads.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No urgent follow-ups
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Product / Package</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Stage</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Last Activity</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Urgency</th>
                        <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hotLeads.map(lead => (
                        <tr key={lead.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5 text-foreground font-medium truncate max-w-[200px]">
                            {lead.products?.title || lead.campaign_packages?.title || 'Unknown'}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-xs text-muted-foreground capitalize">{lead.stage.replace('_', ' ')}</span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(lead.last_seen_at), { addSuffix: true })}
                          </td>
                          <td className="px-4 py-2.5">{urgencyBadge(lead.urgency)}</td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => navigate(`/dashboard/bookings-pipeline?stage=${lead.stage}`)}
                                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                                title="View booking"
                              >
                                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                              {lead.user_id && (
                                <button
                                  onClick={() => navigate(`/dashboard/chat-admin?conversationId=${lead.user_id}`)}
                                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                                  title="Open conversation"
                                >
                                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingInsights;
