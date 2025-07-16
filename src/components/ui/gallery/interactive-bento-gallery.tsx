import React, { useState, useCallback, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaItemType } from './types';
import MediaItem from './MediaItem';
import GalleryModal from './GalleryModal';
import { useGalleryAnimation } from '@/hooks/useGalleryAnimation';

interface InteractiveBentoGalleryProps {
    mediaItems: MediaItemType[];
    title: string;
    description: string;
    pageSource?: string;
}

const InteractiveBentoGallery: React.FC<InteractiveBentoGalleryProps> = memo(({ 
    mediaItems, 
    title, 
    description,
    pageSource 
}) => {
    const [selectedItem, setSelectedItem] = useState<MediaItemType | null>(null);
    const [items, setItems] = useState(mediaItems);
    const [likedItems, setLikedItems] = useState<Set<number>>(new Set());
    const { shouldAnimate, markAsAnimated } = useGalleryAnimation(pageSource || 'default');

    const toggleLikeItem = useCallback((itemId: number) => {
        setLikedItems(prev => {
            const newLikedItems = new Set(prev);
            if (newLikedItems.has(itemId)) {
                newLikedItems.delete(itemId);
            } else {
                newLikedItems.add(itemId);
            }
            return newLikedItems;
        });
    }, []);

    useEffect(() => {
        if (shouldAnimate) {
            // Mark as animated after the animation completes
            const timer = setTimeout(() => {
                markAsAnimated();
            }, 1000); // Adjust timing based on your longest animation
            return () => clearTimeout(timer);
        }
    }, [shouldAnimate, markAsAnimated]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-8 text-center">
                <motion.h1
                    className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent 
                             bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900
                             dark:from-white dark:via-gray-200 dark:to-white"
                    initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={shouldAnimate ? { duration: 0.5 } : { duration: 0 }}
                >
                    {title}
                </motion.h1>
                <motion.p
                    className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400"
                    initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={shouldAnimate ? { duration: 0.5, delay: 0.1 } : { duration: 0 }}
                >
                    {description}
                </motion.p>
            </div>
            
            <AnimatePresence mode="wait">
                {selectedItem ? (
                    <GalleryModal
                        selectedItem={selectedItem}
                        isOpen={true}
                        onClose={() => setSelectedItem(null)}
                        setSelectedItem={setSelectedItem}
                        mediaItems={items}
                        likedItems={likedItems}
                        onToggleLike={toggleLikeItem}
                        pageSource={pageSource}
                    />
                ) : (
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 auto-rows-[60px]"
                        initial={shouldAnimate ? "hidden" : "visible"}
                        animate="visible"
                        exit="hidden"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: shouldAnimate ? { staggerChildren: 0.05 } : { duration: 0 }
                            }
                        }}
                    >
                        {items.map((item, index) => (
                            <motion.div
                                key={item.id}
                                layoutId={`media-${item.id}`}
                                className={`relative overflow-hidden rounded-xl cursor-pointer ${item.span}`}
                                onClick={() => setSelectedItem(item)}
                                variants={{
                                    hidden: { y: 20, opacity: 0 },
                                    visible: {
                                        y: 0,
                                        opacity: 1,
                                        transition: shouldAnimate ? {
                                            duration: 0.3,
                                            ease: "easeOut"
                                        } : { duration: 0 }
                                    }
                                }}
                                whileHover={{ scale: 1.02 }}
                            >
                                <MediaItem
                                    item={item}
                                    className="absolute inset-0 w-full h-full"
                                    onClick={() => setSelectedItem(item)}
                                />
                                <motion.div
                                    className="absolute inset-0 flex flex-col justify-end p-2 sm:p-3 md:p-4"
                                    initial={{ opacity: 0 }}
                                    whileHover={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="absolute inset-0 flex flex-col justify-end p-2 sm:p-3 md:p-4">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                        <h3 className="relative text-white text-xs sm:text-sm md:text-base font-medium line-clamp-1">
                                            {item.title}
                                        </h3>
                                        <p className="relative text-white/70 text-[10px] sm:text-xs md:text-sm mt-0.5 line-clamp-2">
                                            {item.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

export default InteractiveBentoGallery;