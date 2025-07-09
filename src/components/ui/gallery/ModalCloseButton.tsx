import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalCloseButtonProps {
  onClose: () => void;
}

const ModalCloseButton: React.FC<ModalCloseButtonProps> = ({ onClose }) => {
  return (
    <motion.button
      className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 z-30
                w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full 
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
      <X className='w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6' />
    </motion.button>
  );
};

export default ModalCloseButton;