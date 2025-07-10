import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaItemType } from './types';
import MediaItem from './MediaItem';
import LikeButton from './LikeButton';
import FullVideoButton from './FullVideoButton';

interface ModalContentProps {
  selectedItem: MediaItemType;
  isLiked: boolean;
  onToggleLike: () => void;
  pageSource?: string;
}

const ModalContent: React.FC<ModalContentProps> = ({ selectedItem, isLiked, onToggleLike, pageSource }) => {
  return (
    <div className="h-full flex flex-col pt-8 pb-12">
      <div className="flex-1 p-3 sm:p-4 md:p-6 flex flex-col items-center justify-center gap-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedItem.id}
            className="relative w-full aspect-[16/9] max-w-[95%] sm:max-w-[90%] md:max-w-4xl 
                     h-auto max-h-[80vh] rounded-lg overflow-hidden shadow-lg"
            initial={{ y: 20, scale: 0.97 }}
            animate={{
              y: 0,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 0.5
              }
            }}
            exit={{
              y: 20,
              scale: 0.97,
              transition: { duration: 0.15 }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <MediaItem item={selectedItem} className="w-full h-full object-contain bg-gray-100 dark:bg-gray-800" />
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
        
        <LikeButton 
          selectedItem={selectedItem} 
          isLiked={isLiked}
          onToggleLike={onToggleLike}
          pageSource={pageSource}
        />
        
        {selectedItem.fullVideoUrl && (
          <FullVideoButton
            videoUrl={selectedItem.fullVideoUrl}
            eventName={selectedItem.title}
          />
        )}
      </div>
    </div>
  );
};

export default ModalContent;