import { useEffect, useState } from "react";
import InteractiveBentoGallery from "@/components/ui/gallery/interactive-bento-gallery";
import { supabase } from "@/integrations/supabase/client";
import { MediaItemType } from "@/components/ui/gallery/types";
import { Skeleton } from "@/components/ui/skeleton";

const PlannerGallery = () => {
  const [mediaItems, setMediaItems] = useState<MediaItemType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGalleryCards = async () => {
      try {
        const { data, error } = await supabase
          .from('service_gallery_cards')
          .select('*')
          .eq('is_published', true)
          .order('order_index', { ascending: true });

        if (error) {
          console.error('Error fetching service gallery cards:', error);
          return;
        }

        // Transform database records to MediaItemType format
        const transformedItems: MediaItemType[] = (data || []).map((card, index) => ({
          id: index + 1,
          type: card.thumb_webm_url || card.thumb_mp4_url ? 'video' : 'image',
          title: card.title,
          desc: card.subtitle || '',
          url: card.thumbnail_url || '',
          span: index % 3 === 0 ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1',
          mp4Url: card.thumb_mp4_url,
          posterUrl: card.thumb_image_url,
          fullVideoUrl: card.full_video_enabled ? card.full_video_url : undefined,
        }));

        setMediaItems(transformedItems);
      } catch (error) {
        console.error('Error fetching service gallery cards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryCards();
  }, []);

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
      title="EverAfter Gallery"
      description="Explore our collection of beautiful wedding, family milestone, or business event moments and memories"
      pageSource="Planner"
    />
  );
};

export default PlannerGallery;