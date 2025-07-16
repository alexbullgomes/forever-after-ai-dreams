import InteractiveBentoGallery from "@/components/ui/gallery/interactive-bento-gallery";
import { milestonesGalleryItems } from "@/data/milestonesGalleryData";

const MilestonesGallery = () => {
  return (
    <InteractiveBentoGallery
      mediaItems={milestonesGalleryItems}
      title="Milestones Gallery"
      description="Capturing life's precious family moments and special celebrations"
      pageSource="Photo & Video"
    />
  );
};

export default MilestonesGallery;