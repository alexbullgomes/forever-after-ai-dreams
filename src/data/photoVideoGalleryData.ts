import { MediaItemType } from "@/components/ui/gallery/types";

export const photoVideoGalleryItems: MediaItemType[] = [
  {
    id: 1,
    type: "image",
    title: "Family Portrait Session",
    desc: "Beautiful family memories captured in natural light",
    url: "https://images.unsplash.com/photo-1511895426328-dc8714191300",
    span: "col-span-1 sm:col-span-2 row-span-3"
  },
  {
    id: 2,
    type: "video",
    title: "Corporate Brand Story",
    desc: "Professional business storytelling",
    url: "https://hmdnronxajctsrlgrhey.supabase.co/storage/v1/object/public/weddingvideo//Libs.webm",
    mp4Url: "https://hmdnronxajctsrlgrhey.supabase.co/storage/v1/object/public/weddingvideo//Libs.mp4",
    posterUrl: "https://hmdnronxajctsrlgrhey.supabase.co/storage/v1/object/public/weddingvideo//Libs.webp",
    span: "col-span-1 sm:col-span-1 row-span-2"
  },
  {
    id: 3,
    type: "image",
    title: "Business Headshots",
    desc: "Professional corporate photography",
    url: "https://images.unsplash.com/photo-1560250097-0b93528c311a",
    span: "col-span-1 sm:col-span-1 row-span-2"
  },
  {
    id: 4,
    type: "image",
    title: "Corporate Photography Event",
    desc: "Capturing life's special moments",
    url: "https://hmdnronxajctsrlgrhey.supabase.co/storage/v1/object/public/weddingvideo//Libswidephoto.webp",
    span: "col-span-1 sm:col-span-2 row-span-2"
  },
  {
    id: 5,
    type: "video",
    title: "Family Documentary",
    desc: "Cinematic family storytelling",
    url: "https://hmdnronxajctsrlgrhey.supabase.co/storage/v1/object/public/weddingvideo//alanamichaelportifolio.webm",
    mp4Url: "https://hmdnronxajctsrlgrhey.supabase.co/storage/v1/object/public/weddingvideo//alanamichaelportifolio.mp4",
    posterUrl: "https://hmdnronxajctsrlgrhey.supabase.co/storage/v1/object/public/weddingvideo//alanamichaelfoto.webp",
    span: "col-span-1 sm:col-span-1 row-span-3"
  },
  {
    id: 6,
    type: "video",
    title: "Corporate Meeting Event",
    desc: "Professional corporate event coverage",
    url: "https://hmdnronxajctsrlgrhey.supabase.co/storage/v1/object/public/weddingvideo//masterhouse.webm",
    span: "col-span-1 sm:col-span-2 row-span-3"
  }
];