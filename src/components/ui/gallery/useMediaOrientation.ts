import { useState, useEffect, useRef } from 'react';
import { MediaItemType } from './types';

interface OrientationResult {
  isPortrait: boolean;
  isLoading: boolean;
}

// Cache orientation results to avoid re-detection
const orientationCache = new Map<number, boolean>();

export const useMediaOrientation = (item: MediaItemType): OrientationResult => {
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const detectionRef = useRef<boolean>(false);

  useEffect(() => {
    // Check cache first
    if (orientationCache.has(item.id)) {
      setIsPortrait(orientationCache.get(item.id)!);
      setIsLoading(false);
      return;
    }

    // Prevent duplicate detection
    if (detectionRef.current) return;
    detectionRef.current = true;
    setIsLoading(true);

    const detectOrientation = async () => {
      try {
        if (item.type === 'video') {
          // For videos, use video element to get dimensions
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.muted = true;
          
          const detectFromVideo = new Promise<boolean>((resolve) => {
            video.onloadedmetadata = () => {
              const portrait = video.videoHeight > video.videoWidth;
              resolve(portrait);
            };
            video.onerror = () => resolve(false); // Default to landscape on error
            
            // Timeout fallback
            setTimeout(() => resolve(false), 3000);
          });

          // Use mp4Url first, then url
          video.src = item.mp4Url || item.url;
          const portrait = await detectFromVideo;
          
          orientationCache.set(item.id, portrait);
          setIsPortrait(portrait);
        } else {
          // For images, use Image object
          const img = new Image();
          
          const detectFromImage = new Promise<boolean>((resolve) => {
            img.onload = () => {
              const portrait = img.naturalHeight > img.naturalWidth;
              resolve(portrait);
            };
            img.onerror = () => resolve(false); // Default to landscape on error
            
            // Timeout fallback
            setTimeout(() => resolve(false), 3000);
          });

          img.src = item.url;
          const portrait = await detectFromImage;
          
          orientationCache.set(item.id, portrait);
          setIsPortrait(portrait);
        }
      } catch {
        // Default to landscape on any error
        setIsPortrait(false);
      } finally {
        setIsLoading(false);
        detectionRef.current = false;
      }
    };

    detectOrientation();

    return () => {
      detectionRef.current = false;
    };
  }, [item.id, item.type, item.url, item.mp4Url]);

  return { isPortrait, isLoading };
};
