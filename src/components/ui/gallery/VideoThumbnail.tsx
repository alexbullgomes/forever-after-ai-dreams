import { useState, useEffect, useRef } from 'react';

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
  const videoRef = useRef<HTMLVideoElement>(null);

  // Ensure video loads on mobile - try multiple load attempts
  useEffect(() => {
    if (videoRef.current && (webmUrl || mp4Url)) {
      const video = videoRef.current;
      
      // Force load
      video.load();
      
      // Additional mobile fix: try to play after a short delay
      const attemptPlay = setTimeout(() => {
        if (video && autoPlay) {
          video.play().catch(() => {
            // Autoplay blocked, but video should still be visible
          });
        }
      }, 100);
      
      return () => clearTimeout(attemptPlay);
    }
  }, [webmUrl, mp4Url, autoPlay]);

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
  };
  
  const handleCanPlay = () => {
    // Additional event to catch when video can play on mobile
    setVideoLoaded(true);
    if (autoPlay && videoRef.current) {
      videoRef.current.play().catch(() => {
        // If autoplay fails, that's okay - video is still visible
      });
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
        ref={videoRef}
        data-alt={alt}
        className={`${className} ${!videoLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        muted
        loop
        playsInline
        preload="auto"
        poster={imageUrl}
        onError={handleVideoError}
        onLoadedData={handleVideoLoaded}
        onCanPlay={handleCanPlay}
      >
        {webmUrl && <source src={webmUrl} type="video/webm" />}
        {mp4Url && <source src={mp4Url} type="video/mp4" />}
      </video>
    </div>
  );
};