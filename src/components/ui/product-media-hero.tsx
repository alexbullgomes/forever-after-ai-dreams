"use client";

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ProductMediaHeroProps {
  imageUrl?: string;
  videoUrl?: string;
  mediaType?: "image" | "video" | null;
  alt: string;
  className?: string;
}

const isVideoUrl = (url: string) => /\.(mp4|webm)$/i.test(url);

export function ProductMediaHero({
  imageUrl,
  videoUrl,
  mediaType,
  alt,
  className,
}: ProductMediaHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoError, setVideoError] = useState(false);

  // Determine effective media type
  const effectiveType =
    mediaType || (videoUrl && isVideoUrl(videoUrl) ? "video" : "image");
  const shouldRenderVideo = effectiveType === "video" && videoUrl && !videoError;

  // Intersection Observer: pause video when off-screen
  useEffect(() => {
    if (!videoRef.current || !shouldRenderVideo) return;

    const video = videoRef.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [shouldRenderVideo]);

  // Handle video error - fallback to image
  const handleVideoError = () => {
    setVideoError(true);
  };

  if (shouldRenderVideo) {
    return (
      <div ref={containerRef} className={cn("relative", className)}>
        <video
          ref={videoRef}
          src={videoUrl}
          poster={imageUrl}
          muted
          autoPlay
          loop
          playsInline
          preload="metadata"
          onError={handleVideoError}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  // Fallback to image
  return (
    <img
      src={imageUrl || "/placeholder.svg"}
      alt={alt}
      loading="lazy"
      className={className}
    />
  );
}
