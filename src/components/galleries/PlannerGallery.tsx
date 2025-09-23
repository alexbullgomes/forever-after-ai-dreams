import { useState, useEffect } from "react";
import InteractiveBentoGallery from "@/components/ui/gallery/interactive-bento-gallery";
import { useOurPortfolioGallery } from "@/hooks/useOurPortfolioGallery";
import { MediaItemType } from "@/components/ui/gallery/types";
import { Skeleton } from "@/components/ui/skeleton";

const PlannerGallery = () => {
  const { cards, loading } = useOurPortfolioGallery();
  const [mediaItems, setMediaItems] = useState<MediaItemType[]>([]);

  useEffect(() => {
    const fetchGalleryCards = async () => {
      if (!loading && cards.length > 0) {
        const publishedCards = cards.filter(card => card.is_published);

        const transformedItems: MediaItemType[] = publishedCards.map((card, index) => ({
          id: index + 1,
          type: card.thumb_webm_url || card.thumb_mp4_url ? 'video' : 'image',
          title: card.title,
          desc: card.subtitle || "",
          url: card.thumb_webm_url || card.thumb_mp4_url || card.thumb_image_url || card.thumbnail_url || "",
          span: index % 7 === 0 || index % 11 === 0 ? "md:col-span-2 md:row-span-2" : 
                index % 5 === 0 ? "md:col-span-2" : 
                index % 3 === 0 ? "md:row-span-2" : "col-span-1",
          mp4Url: card.thumb_mp4_url,
          posterUrl: card.thumb_image_url || card.thumbnail_url,
          fullVideoUrl: card.full_video_enabled ? card.full_video_url : undefined
        }));
        
        setMediaItems(transformedItems);
      }
    };

    fetchGalleryCards();
  }, [cards, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <InteractiveBentoGallery
      mediaItems={mediaItems}
      title="Our Portfolio Gallery"
      description="Explore our collection of stunning photography and videography work"
      pageSource="Planner"
    />
  );
};

export default PlannerGallery;