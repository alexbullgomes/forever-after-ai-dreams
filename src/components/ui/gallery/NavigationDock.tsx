import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MediaItemType } from './types';
import MediaItem from './MediaItem';

interface NavigationDockProps {
  mediaItems: MediaItemType[];
  selectedItem: MediaItemType;
  setSelectedItem: (item: MediaItemType) => void;
}

const NavigationDock: React.FC<NavigationDockProps> = ({ 
  mediaItems, 
  selectedItem, 
  setSelectedItem 
}) => {
  const [dockPosition, setDockPosition] = useState({ x: 0, y: 0 });

  return (
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
  );
};

export default NavigationDock;