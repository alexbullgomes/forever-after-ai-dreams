import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { MediaItemType } from './types';
import MediaItem from './MediaItem';
import LikeButton from './LikeButton';
import FullVideoButton from './FullVideoButton';
import ModalCloseButton from './ModalCloseButton';
import NavigationDock from './NavigationDock';
import { useMediaOrientation } from './useMediaOrientation';
interface ModalContentProps {
  selectedItem: MediaItemType;
  isLiked: boolean;
  onToggleLike: () => void;
  pageSource?: string;
  onClose: () => void;
  mediaItems: MediaItemType[];
  setSelectedItem: (item: MediaItemType) => void;
}
const ModalContent: React.FC<ModalContentProps> = ({
  selectedItem,
  isLiked,
  onToggleLike,
  pageSource,
  onClose,
  mediaItems,
  setSelectedItem
}) => {
  const {
    isPortrait
  } = useMediaOrientation(selectedItem);

  const currentIndex = mediaItems.findIndex(item => item.id === selectedItem.id);
  const goToPrev = () => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : mediaItems.length - 1;
    setSelectedItem(mediaItems[prevIndex]);
  };
  const goToNext = () => {
    const nextIndex = currentIndex < mediaItems.length - 1 ? currentIndex + 1 : 0;
    setSelectedItem(mediaItems[nextIndex]);
  };

  // Dynamic classes based on orientation - reduced max-height to ensure navigation stays visible
  const containerClasses = isPortrait ? "relative aspect-[9/16] max-h-[55vh] md:max-h-[60vh] w-auto rounded-lg overflow-hidden shadow-lg" : "relative w-full aspect-[16/9] max-w-[95%] sm:max-w-[90%] md:max-w-4xl max-h-[50vh] md:max-h-[55vh] rounded-lg overflow-hidden shadow-lg";
  return <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 md:p-6 flex-col pt-[150px] flex items-center justify-center py-[30px]">
        <div className="relative flex items-center justify-center w-full">
          {/* Left Arrow */}
          <button
            onClick={goToPrev}
            aria-label="Previous item"
            className="absolute left-2 sm:left-4 md:left-6 z-20 w-10 h-10 md:w-12 md:h-12 min-w-[44px] min-h-[44px] 
                       rounded-full bg-background/80 backdrop-blur-sm text-foreground 
                       flex items-center justify-center 
                       hover:scale-110 hover:bg-background/95 
                       transition-all duration-200 
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                       shadow-lg border border-border/50"
          >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          <AnimatePresence mode="wait">
          <motion.div key={selectedItem.id} className={containerClasses} initial={{
          y: 20,
          scale: 0.97
        }} animate={{
          y: 0,
          scale: 1,
          transition: {
            type: "spring",
            stiffness: 500,
            damping: 30,
            mass: 0.5
          }
        }} exit={{
          y: 20,
          scale: 0.97,
          transition: {
            duration: 0.15
          }
        }} onClick={e => e.stopPropagation()}>
            <MediaItem item={selectedItem} className="w-full h-full object-contain bg-muted dark:bg-muted" />
            <ModalCloseButton onClose={onClose} />
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-5 
                          bg-gradient-to-t from-black/70 to-transparent">
              <h3 className="text-white text-lg sm:text-xl md:text-2xl font-semibold">
                {selectedItem.title}
              </h3>
              <p className="text-white/90 text-sm sm:text-base mt-1">
                {selectedItem.desc}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

          {/* Right Arrow */}
          <button
            onClick={goToNext}
            aria-label="Next item"
            className="absolute right-2 sm:right-4 md:right-6 z-20 w-10 h-10 md:w-12 md:h-12 min-w-[44px] min-h-[44px] 
                       rounded-full bg-background/80 backdrop-blur-sm text-foreground 
                       flex items-center justify-center 
                       hover:scale-110 hover:bg-background/95 
                       transition-all duration-200 
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                       shadow-lg border border-border/50"
          >
            <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <LikeButton selectedItem={selectedItem} isLiked={isLiked} onToggleLike={onToggleLike} pageSource={pageSource} />
          
          {selectedItem.fullVideoUrl && <FullVideoButton videoUrl={selectedItem.fullVideoUrl} eventName={selectedItem.title} />}
        </div>
      </div>
      
      {/* Navigation - OUTSIDE scrollable area, always visible */}
      <div className="flex-shrink-0 py-3 sm:py-4 pb-6 flex justify-center items-center w-full">
        <NavigationDock mediaItems={mediaItems} selectedItem={selectedItem} setSelectedItem={setSelectedItem} />
      </div>
    </div>;
};
export default ModalContent;