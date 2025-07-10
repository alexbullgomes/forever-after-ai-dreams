import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { MediaItemType } from './types';
import ModalCloseButton from './ModalCloseButton';
import ModalContent from './ModalContent';
import NavigationDock from './NavigationDock';
import MobileInstructions from './MobileInstructions';

interface GalleryModalProps {
    selectedItem: MediaItemType;
    isOpen: boolean;
    onClose: () => void;
    setSelectedItem: (item: MediaItemType | null) => void;
    mediaItems: MediaItemType[];
    likedItems: Set<number>;
    onToggleLike: (itemId: number) => void;
    pageSource?: string;
}

const GalleryModal: React.FC<GalleryModalProps> = ({ 
    selectedItem, 
    isOpen, 
    onClose, 
    setSelectedItem, 
    mediaItems,
    likedItems,
    onToggleLike,
    pageSource
}) => {

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
                className="fixed inset-2 sm:inset-4 md:inset-6 lg:inset-8 backdrop-blur-lg 
                          bg-white/95 dark:bg-gray-900/95 rounded-xl overflow-hidden z-20 
                          shadow-2xl border border-white/20"
                onClick={(e) => e.stopPropagation()}
            >
                <ModalContent 
                    selectedItem={selectedItem} 
                    isLiked={likedItems.has(selectedItem.id)}
                    onToggleLike={() => onToggleLike(selectedItem.id)}
                    pageSource={pageSource}
                    onClose={onClose}
                    mediaItems={mediaItems}
                    setSelectedItem={setSelectedItem}
                />
                <MobileInstructions />
            </motion.div>
        </>
    );
};

export default GalleryModal;