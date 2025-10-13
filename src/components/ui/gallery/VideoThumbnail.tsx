import { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';

// iOS detection utility
const isIOSDevice = (): boolean => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

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
  const [showPlayButton, setShowPlayButton] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isIOS = isIOSDevice();

  // iOS-specific video loading and playback
  useEffect(() => {
    if (videoRef.current && (webmUrl || mp4Url)) {
      const video = videoRef.current;
      
      // For iOS, validate MP4 exists (WebM not supported)
      if (isIOS && !mp4Url) {
        console.warn('iOS device detected but no MP4 source available, falling back to image');
        setVideoError(true);
        return;
      }
      
      // Force load
      video.load();
      
      // iOS-specific: immediate play attempt without delay
      if (isIOS && autoPlay) {
        video.play().catch((error) => {
          console.log('iOS autoplay blocked, showing tap-to-play button:', error);
          setShowPlayButton(true);
        });
      } 
      // Non-iOS: delayed play attempt (existing behavior)
      else if (autoPlay) {
        const attemptPlay = setTimeout(() => {
          if (video) {
            video.play().catch(() => {
              setShowPlayButton(true);
            });
          }
        }, 100);
        
        return () => clearTimeout(attemptPlay);
      }
    }
  }, [webmUrl, mp4Url, autoPlay, isIOS]);

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

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video failed to load:', e);
    setVideoError(true);
  };

  const handleVideoLoaded = () => {
    setVideoLoaded(true);
  };
  
  const handleLoadedMetadata = () => {
    // iOS Safari fires this earlier than onLoadedData
    setVideoLoaded(true);
  };
  
  const handleCanPlay = () => {
    setVideoLoaded(true);
    if (autoPlay && videoRef.current) {
      videoRef.current.play().catch(() => {
        setShowPlayButton(true);
      });
    }
  };
  
  const handlePlaying = () => {
    // Video actually started playing, hide play button
    setShowPlayButton(false);
  };
  
  const handleTapToPlay = () => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error('Manual play failed:', error);
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
        autoPlay={autoPlay}
        muted
        loop
        playsInline
        preload={isIOS ? "metadata" : "auto"}
        poster={imageUrl}
        onError={handleVideoError}
        onLoadedData={handleVideoLoaded}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onPlaying={handlePlaying}
      >
        {/* MP4 first for iOS Safari compatibility (WebM not supported) */}
        {mp4Url && <source src={mp4Url} type="video/mp4; codecs=avc1.42E01E,mp4a.40.2" />}
        {webmUrl && <source src={webmUrl} type="video/webm" />}
      </video>
      
      {/* Tap-to-play fallback for iOS when autoplay is blocked */}
      {showPlayButton && videoLoaded && (
        <button
          onClick={handleTapToPlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
          aria-label="Play video"
        >
          <div className="bg-white/90 rounded-full p-4 shadow-lg">
            <Play className="w-8 h-8 text-gray-900" fill="currentColor" />
          </div>
        </button>
      )}
    </div>
  );
};