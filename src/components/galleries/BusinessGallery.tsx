import InteractiveBentoGallery from "@/components/ui/gallery/interactive-bento-gallery";
import { businessGalleryItems } from "@/data/businessGalleryData";

const BusinessGallery = () => {
  return (
    <InteractiveBentoGallery
      mediaItems={businessGalleryItems}
      title="Business Gallery"
      description="Professional business photography showcasing corporate excellence and brand identity"
      pageSource="Business"
    />
  );
};

export default BusinessGallery;