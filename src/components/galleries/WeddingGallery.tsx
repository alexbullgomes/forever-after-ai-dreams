import { useState, useEffect } from "react";
import InteractiveBentoGallery from "@/components/ui/gallery/interactive-bento-gallery";
import { useOurWeddingGallery } from "@/hooks/useOurWeddingGallery";
import { MediaItemType } from "@/components/ui/gallery/types";
import { Skeleton } from "@/components/ui/skeleton";

const WeddingGallery = () => {
  const { cards, loading } = useOurWeddingGallery();
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
          span: "col-span-1",
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
      <div className="py-12">
        <div className="text-center mb-12">
          <div className="mb-4">
            <Skeleton className="h-12 w-80 mx-auto" />
          </div>
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-7xl mx-auto px-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <InteractiveBentoGallery
      mediaItems={mediaItems}
      title="Our Wedding Gallery"
      description="Explore our collection of beautiful wedding moments and memories"
      pageSource="Wedding Packages"
    />
  );
};

export default WeddingGallery;