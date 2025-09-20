import { useState } from 'react';

interface VideoThumbnailProps {
  webmUrl?: string;
  mp4Url?: string;
  imageUrl?: string;
  fallbackImageUrl?: string;
  alt: string;
  className?: string;
  autoPlay?: boolean;
}

export const VideoThumbnail = ({
  webmUrl,
  mp4Url,
  imageUrl,
  fallbackImageUrl,
  alt,
  className = "",
  autoPlay = true
}: VideoThumbnailProps) => {
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // If no video URLs are provided, use regular image
  if (!webmUrl && !mp4Url) {
    return (
      <img
        src={fallbackImageUrl}
        alt={alt}
        className={className}
      />
    );
  }

  // If video failed to load, show image fallback
  if (videoError) {
    return (
      <img
        src={imageUrl || fallbackImageUrl}
        alt={alt}
        className={className}
      />
    );
  }

  const handleVideoError = () => {
    setVideoError(true);
  };

  const handleVideoLoaded = () => {
    setVideoLoaded(true);
    if (autoPlay) {
      // Small delay to ensure smooth playback
      setTimeout(() => {
        const video = document.querySelector(`video[data-alt="${alt}"]`) as HTMLVideoElement;
        if (video) {
          video.play().catch(() => {
            // If autoplay fails, that's okay
          });
        }
      }, 100);
    }
  };

  return (
    <div className="relative">
      {/* Show image until video loads */}
      {!videoLoaded && imageUrl && (
        <img
          src={imageUrl}
          alt={alt}
          className={`${className} absolute inset-0`}
        />
      )}
      
      <video
        data-alt={alt}
        className={`${className} ${!videoLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        muted
        loop
        playsInline
        preload="metadata"
        poster={imageUrl}
        onError={handleVideoError}
        onLoadedData={handleVideoLoaded}
      >
        {webmUrl && <source src={webmUrl} type="video/webm" />}
        {mp4Url && <source src={mp4Url} type="video/mp4" />}
      </video>
    </div>
  );
};