import { useNavigate } from 'react-router-dom';
import { useActiveCampaigns } from '@/hooks/useActiveCampaigns';
import { InteractiveTravelCard } from '@/components/ui/3d-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';

const CampaignCardSkeleton = () => (
  <div className="h-80 w-full overflow-hidden rounded-2xl border border-border bg-card">
    <Skeleton className="h-full w-full" />
  </div>
);

export const CampaignCardsSection = () => {
  const { campaigns, loading, error } = useActiveCampaigns();
  const navigate = useNavigate();

  // Don't render section if error or no campaigns after loading
  if (!loading && (error || campaigns.length === 0)) {
    return (
      <div className="mb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>No active campaigns right now.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-16">
      {/* Section Header */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">
          Active Campaigns
        </h2>
        <p className="mt-2 text-muted-foreground">
          Exclusive offers for your special moments
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <>
            <CampaignCardSkeleton />
            <CampaignCardSkeleton />
            <CampaignCardSkeleton />
          </>
        ) : (
          campaigns.map((campaign) => (
            <InteractiveTravelCard
              key={campaign.id}
              title={campaign.title}
              subtitle={campaign.subtitle}
              imageUrl={campaign.imageUrl}
              actionText="View Campaign"
              href={campaign.href}
              onActionClick={() => navigate(campaign.href)}
            />
          ))
        )}
      </div>
    </div>
  );
};
