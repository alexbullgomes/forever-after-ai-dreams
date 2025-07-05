import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { MediaItemType } from './types';
import MediaItem from './MediaItem';

interface GalleryModalProps {
    selectedItem: MediaItemType;
    isOpen: boolean;
    onClose: () => void;
    setSelectedItem: (item: MediaItemType | null) => void;
    mediaItems: MediaItemType[];
}

const GalleryModal: React.FC<GalleryModalProps> = ({ 
    selectedItem, 
    isOpen, 
    onClose, 
    setSelectedItem, 
    mediaItems 
}) => {
    const [dockPosition, setDockPosition] = useState({ x: 0, y: 0 });

    // Handle keyboard events (ESC to close)
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
            if (event.key === 'ArrowLeft') {
                const currentIndex = mediaItems.findIndex(item => item.id === selectedItem.id);
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : mediaItems.length - 1;
                setSelectedItem(mediaItems[prevIndex]);
            }
            if (event.key === 'ArrowRight') {
                const currentIndex = mediaItems.findIndex(item => item.id === selectedItem.id);
                const nextIndex = currentIndex < mediaItems.length - 1 ? currentIndex + 1 : 0;
                setSelectedItem(mediaItems[nextIndex]);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose, selectedItem, mediaItems, setSelectedItem]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-10"
                onClick={onClose}
            />
            
            {/* Main Modal */}
            <motion.div
                initial={{ scale: 0.98 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.98 }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30
                }}
                className="fixed inset-4 sm:inset-8 md:inset-12 backdrop-blur-lg 
                          bg-white/95 dark:bg-gray-900/95 rounded-xl overflow-hidden z-20 
                          shadow-2xl border border-white/20"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Enhanced Close Button - Repositioned */}
                <motion.button
                    className="absolute top-4 right-4 z-30
                              w-12 h-12 rounded-full bg-black/80 hover:bg-black/90 
                              text-white backdrop-blur-sm shadow-xl
                              flex items-center justify-center
                              transition-all duration-200 border border-white/10"
                    onClick={onClose}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    aria-label="Close gallery"
                >
                    <X className='w-6 h-6' />
                </motion.button>

                {/* Main Content */}
                <div className="h-full flex flex-col pt-4 pb-20">
                    <div className="flex-1 p-4 sm:p-6 md:p-8 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedItem.id}
                                className="relative w-full aspect-[16/9] max-w-[90%] sm:max-w-[85%] md:max-w-4xl 
                                         h-auto max-h-[75vh] rounded-lg overflow-hidden shadow-lg"
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
                                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 
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
                    </div>
                </div>

                {/* Instruction overlay for mobile */}
                <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ delay: 2, duration: 1 }}
                    className="absolute top-16 left-1/2 -translate-x-1/2 
                              bg-black/70 text-white text-sm px-3 py-1 rounded-full
                              backdrop-blur-sm pointer-events-none
                              block sm:hidden"
                >
                    Tap outside to close • Use arrows to navigate
                </motion.div>
            </motion.div>

            {/* Draggable Dock */}
            <motion.div
                drag
                dragMomentum={false}
                dragElastic={0.1}
                initial={false}
                animate={{ x: dockPosition.x, y: dockPosition.y }}
                onDragEnd={(_, info) => {
                    setDockPosition(prev => ({
                        x: prev.x + info.offset.x,
                        y: prev.y + info.offset.y
                    }));
                }}
                className="fixed z-50 left-1/2 bottom-4 -translate-x-1/2 touch-none"
            >
                <motion.div
                    className="relative rounded-xl bg-sky-400/20 backdrop-blur-xl 
                             border border-blue-400/30 shadow-lg
                             cursor-grab active:cursor-grabbing"
                >
                    <div className="flex items-center -space-x-2 px-3 py-2">
                        {mediaItems.map((item, index) => (
                            <motion.div
                                key={item.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedItem(item);
                                }}
                                style={{
                                    zIndex: selectedItem.id === item.id ? 30 : mediaItems.length - index,
                                }}
                                className={`
                                    relative group
                                    w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex-shrink-0 
                                    rounded-lg overflow-hidden 
                                    cursor-pointer hover:z-20
                                    ${selectedItem.id === item.id
                                        ? 'ring-2 ring-white/70 shadow-lg'
                                        : 'hover:ring-2 hover:ring-white/30'}
                                `}
                                initial={{ rotate: index % 2 === 0 ? -15 : 15 }}
                                animate={{
                                    scale: selectedItem.id === item.id ? 1.2 : 1,
                                    rotate: selectedItem.id === item.id ? 0 : index % 2 === 0 ? -15 : 15,
                                    y: selectedItem.id === item.id ? -8 : 0,
                                }}
                                whileHover={{
                                    scale: 1.3,
                                    rotate: 0,
                                    y: -10,
                                    transition: { type: "spring", stiffness: 400, damping: 25 }
                                }}
                            >
                                <MediaItem item={item} className="w-full h-full" onClick={() => setSelectedItem(item)} />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/20" />
                                {selectedItem.id === item.id && (
                                    <motion.div
                                        layoutId="activeGlow"
                                        className="absolute -inset-2 bg-white/20 blur-xl"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.2 }}
                                    />
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </>
    );
};

export default GalleryModal;