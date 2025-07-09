import InteractiveBentoGallery from "@/components/ui/gallery/interactive-bento-gallery";
import { weddingGalleryItems } from "@/data/weddingGallery";

const WeddingGallery = () => {
  return (
    <InteractiveBentoGallery
      mediaItems={weddingGalleryItems}
      title="Our Wedding Gallery"
      description="Explore our collection of beautiful wedding moments and memories"
      pageSource="Wedding Packages"
    />
  );
};

export default WeddingGallery;