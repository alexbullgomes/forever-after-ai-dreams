import { useEffect, useState } from 'react';

interface UseGalleryAnimationReturn {
  shouldAnimate: boolean;
  markAsAnimated: () => void;
}

export const useGalleryAnimation = (galleryId: string): UseGalleryAnimationReturn => {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const storageKey = `gallery-animated-${galleryId}`;

  useEffect(() => {
    const hasBeenAnimated = localStorage.getItem(storageKey);
    if (!hasBeenAnimated) {
      setShouldAnimate(true);
    }
  }, [storageKey]);

  const markAsAnimated = () => {
    localStorage.setItem(storageKey, 'true');
    setShouldAnimate(false);
  };

  return { shouldAnimate, markAsAnimated };
};