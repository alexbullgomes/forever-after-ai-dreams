import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalCloseButtonProps {
  onClose: () => void;
}

const ModalCloseButton: React.FC<ModalCloseButtonProps> = ({ onClose }) => {
  return (
    <motion.button
      className="absolute top-1 right-1 sm:top-2 sm:right-2 md:top-3 md:right-3 z-30
                w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full 
                bg-black/80 hover:bg-black/90 text-white backdrop-blur-sm shadow-xl
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
      <X className='w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5' />
    </motion.button>
  );
};

export default ModalCloseButton;