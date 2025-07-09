import InteractiveBentoGallery from "@/components/ui/gallery/interactive-bento-gallery";
import { plannerGalleryItems } from "@/data/plannerGalleryData";

const PlannerGallery = () => {
  return (
    <InteractiveBentoGallery
      mediaItems={plannerGalleryItems}
      title="EverAfter Gallery"
      description="Explore our collection of beautiful wedding, family milestone, or business event moments and memories"
      pageSource="Planner"
    />
  );
};

export default PlannerGallery;