import InteractiveBentoGallery from "@/components/ui/gallery/interactive-bento-gallery";
import { businessGalleryItems } from "@/data/businessGalleryData";

const BusinessGallery = () => {
  return (
    <InteractiveBentoGallery
      mediaItems={businessGalleryItems}
      title="Business Gallery"
      description="Professional business photography and videography showcasing corporate excellence"
      pageSource="Photo & Video"
    />
  );
};

export default BusinessGallery;