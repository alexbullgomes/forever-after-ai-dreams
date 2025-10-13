import { memo } from 'react';
import InteractiveBentoGallery from '@/components/ui/gallery/interactive-bento-gallery';
import { MediaItemType } from '@/components/ui/gallery/types';
import { usePromotionalCampaignGallery } from '@/hooks/usePromotionalCampaignGallery';
import { Skeleton } from '@/components/ui/skeleton';

interface PromotionalCampaignGalleryProps {
  campaignId: string;
}

export const PromotionalCampaignGallery = memo(({ campaignId }: PromotionalCampaignGalleryProps) => {
  const { cards, loading } = usePromotionalCampaignGallery(campaignId);

  // Filter only published items
  const publishedCards = cards.filter(card => card.is_published);

  // If no published items, don't render the section at all
  if (!loading && publishedCards.length === 0) {
    return null;
  }

  // Transform database records to MediaItemType format
  const mediaItems: MediaItemType[] = publishedCards.map((card, index) => ({
    id: index + 1,
    type: card.thumb_mp4_url || card.thumb_webm_url ? 'video' : 'image',
    title: card.title,
    desc: card.subtitle || '',
    url: card.thumb_image_url || card.thumbnail_url || '',
    span: index === 0 ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1',
    mp4Url: card.thumb_mp4_url,
    posterUrl: card.thumb_image_url || card.thumbnail_url,
    fullVideoUrl: card.full_video_enabled ? card.full_video_url : undefined,
  }));

  // Loading state
  if (loading) {
    return (
      <div className="my-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-96 md:col-span-2 md:row-span-2" />
            <Skeleton className="h-44" />
            <Skeleton className="h-44" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-16">
      <InteractiveBentoGallery
        mediaItems={mediaItems}
        title="Featured Gallery"
        description="Explore our stunning collection"
        pageSource="promotional_campaign"
      />
    </div>
  );
});

PromotionalCampaignGallery.displayName = 'PromotionalCampaignGallery';
