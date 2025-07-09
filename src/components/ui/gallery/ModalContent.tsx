import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaItemType } from './types';
import MediaItem from './MediaItem';
import LikeButton from './LikeButton';

interface ModalContentProps {
  selectedItem: MediaItemType;
  isLiked: boolean;
  onToggleLike: () => void;
  pageSource?: string;
}

const ModalContent: React.FC<ModalContentProps> = ({ selectedItem, isLiked, onToggleLike, pageSource }) => {
  return (
    <div className="h-full flex flex-col pt-8 sm:pt-10 md:pt-12 pb-10 sm:pb-12 md:pb-16">
      <div className="flex-1 p-1 sm:p-2 md:p-3 flex flex-col items-center justify-center gap-2 sm:gap-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedItem.id}
            className="relative w-full aspect-[16/9] max-w-[98%] sm:max-w-[95%] md:max-w-[90%] lg:max-w-3xl 
                     h-auto max-h-[55vh] sm:max-h-[60vh] md:max-h-[65vh] lg:max-h-[70vh] 
                     rounded-lg overflow-hidden shadow-lg"
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
            <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4 
                          bg-gradient-to-t from-black/70 to-transparent">
              <h3 className="text-white text-sm sm:text-base md:text-lg lg:text-xl font-semibold">
                {selectedItem.title}
              </h3>
              <p className="text-white/90 text-xs sm:text-xs md:text-sm mt-1">
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
      </div>
    </div>
  );
};

export default ModalContent;