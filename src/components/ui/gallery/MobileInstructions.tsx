import React from 'react';
import { motion } from 'framer-motion';

const MobileInstructions: React.FC = () => {
  return (
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
  );
};

export default MobileInstructions;