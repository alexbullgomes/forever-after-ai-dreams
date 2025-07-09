import InteractiveBentoGallery from "@/components/ui/gallery/interactive-bento-gallery";
import { photoVideoGalleryItems } from "@/data/photoVideoGalleryData";

const PhotoVideoGallery = () => {
  return (
    <InteractiveBentoGallery
      mediaItems={photoVideoGalleryItems}
      title="Our Portfolio Gallery"
      description="Explore our collection of stunning photography and videography work"
      pageSource="Photo & Video"
    />
  );
};

export default PhotoVideoGallery;