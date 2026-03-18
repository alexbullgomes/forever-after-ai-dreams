const SUPABASE_LOCAL_BASE = "https://supabasestudio.agcreationmkt.cloud/storage/v1/object/public/";

/**
 * Unified thumbnail resolution for products.
 * Priority: thumb_* fields → legacy fields → placeholder.
 * Mobile-first: prefers MP4 over WebM for video.
 */
export function getProductThumbnail(product: {
  thumb_image_url?: string | null;
  thumb_mp4_url?: string | null;
  thumb_webm_url?: string | null;
  image_url?: string | null;
  video_url?: string | null;
}): { imageUrl: string; videoUrl?: string } {
  const imageUrl = product.thumb_image_url || product.image_url || "/placeholder.svg";
  const videoUrl = product.thumb_mp4_url || product.thumb_webm_url || product.video_url || undefined;
  return { imageUrl, videoUrl };
}

/**
 * Check if a URL points to the Supabase Local Storage instance.
 */
export function isSupabaseLocalUrl(url: string): boolean {
  return url.startsWith(SUPABASE_LOCAL_BASE);
}

export { SUPABASE_LOCAL_BASE };
