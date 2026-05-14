const LOCAL_SUPABASE_PUBLIC_BASE =
  "https://supabasestudio.agcreationmkt.cloud/storage/v1/object/public/";

export type MediaKind = "mp4" | "webm" | "image" | "unknown";

export function classifyMediaUrl(url: string): MediaKind {
  if (!url) return "unknown";
  const clean = url.split("?")[0].toLowerCase().trim();
  if (clean.endsWith(".mp4")) return "mp4";
  if (clean.endsWith(".webm")) return "webm";
  if (
    clean.endsWith(".jpg") ||
    clean.endsWith(".jpeg") ||
    clean.endsWith(".png") ||
    clean.endsWith(".webp") ||
    clean.endsWith(".gif") ||
    clean.endsWith(".avif")
  )
    return "image";
  return "unknown";
}

export function isAllowedPublicMediaUrl(url: string): boolean {
  if (!url) return true;
  return url.startsWith(LOCAL_SUPABASE_PUBLIC_BASE);
}

export interface ThumbnailSource {
  webm?: string;
  mp4?: string;
  image?: string;
  hasAny: boolean;
  hasVideo: boolean;
}

export function resolveCardThumbnail(card: {
  thumb_webm_url?: string | null;
  thumb_mp4_url?: string | null;
  thumb_image_url?: string | null;
  thumbnail_url?: string | null;
}): ThumbnailSource {
  const webm = card.thumb_webm_url || undefined;
  const mp4 = card.thumb_mp4_url || undefined;
  const image = card.thumb_image_url || card.thumbnail_url || undefined;
  return {
    webm,
    mp4,
    image,
    hasVideo: Boolean(webm || mp4),
    hasAny: Boolean(webm || mp4 || image),
  };
}

export { LOCAL_SUPABASE_PUBLIC_BASE };
