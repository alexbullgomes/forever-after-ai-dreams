import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Handshake, Camera, Film, CheckCircle } from 'lucide-react';

type PipelineFilter = 'all' | 'today' | 'week' | 'month';

const stages = [
  { id: 'New Lead & Negotiation', icon: UserPlus, borderColor: 'border-l-gray-500' },
  { id: 'Closed Deal & Pre-Production', icon: Handshake, borderColor: 'border-l-amber-500' },
  { id: 'Production', icon: Camera, borderColor: 'border-l-blue-500' },
  { id: 'Post-Production (Editing)', icon: Film, borderColor: 'border-l-purple-500' },
  { id: 'Delivery & Finalization', icon: CheckCircle, borderColor: 'border-l-emerald-500' },
];

const filterLabels: { key: PipelineFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

const getFilterDate = (filter: PipelineFilter): Date | null => {
  if (filter === 'all') return null;
  const now = new Date();
  switch (filter) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week': {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      d.setDate(d.getDate() - 7);
      return d;
    }
    case 'month':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  }
};

interface PipelineProfile {
  id: string;
  pipeline_status: string;
  created_at: string;
}

const PipelineOverview = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<PipelineProfile[]>([]);
  const [filter, setFilter] = useState<PipelineFilter>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, pipeline_status, created_at')
        .eq('pipeline_profile', 'Enable');

      if (!error && data) {
        setProfiles(data as PipelineProfile[]);
      }
      setLoading(false);
    };

    fetchProfiles();

    const channel = supabase
      .channel('pipeline-overview')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchProfiles();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const counts = useMemo(() => {
    const cutoff = getFilterDate(filter);
    const filtered = cutoff
      ? profiles.filter(p => new Date(p.created_at) >= cutoff)
      : profiles;

    const map: Record<string, number> = {};
    stages.forEach(s => { map[s.id] = 0; });
    filtered.forEach(p => {
      if (map[p.pipeline_status] !== undefined) {
        map[p.pipeline_status]++;
      }
    });
    return map;
  }, [profiles, filter]);

  const total = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pipeline Overview</h2>
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? 'lead' : 'leads'} in pipeline
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
          {filterLabels.map(({ key, label }) => {
            const isActive = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`
                  rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
                  }
                `}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-24">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stages.map(stage => {
            const Icon = stage.icon;
            const count = counts[stage.id] || 0;
            return (
              <button
                key={stage.id}
                onClick={() =>
                  navigate(
                    `/dashboard/pipeline-process?status=${encodeURIComponent(stage.id)}&range=${filter}`
                  )
                }
                className={`
                  flex flex-col gap-2 rounded-xl border-l-4 ${stage.borderColor}
                  bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm
                  p-4 text-left
                  hover:shadow-md hover:scale-[1.02] transition-all duration-200
                  cursor-pointer
                `}
              >
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold text-foreground">{count}</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground leading-tight">
                  {stage.id}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PipelineOverview;
