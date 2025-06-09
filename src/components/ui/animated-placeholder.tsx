
import { AnimatePresence, motion } from "motion/react";

interface AnimatedPlaceholderProps {
  placeholders: string[];
  currentIndex: number;
  showPlaceholder: boolean;
  isActive: boolean;
  inputValue: string;
}

export const AnimatedPlaceholder = ({
  placeholders,
  currentIndex,
  showPlaceholder,
  isActive,
  inputValue,
}: AnimatedPlaceholderProps) => {
  const placeholderContainerVariants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.025 } },
    exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
  };

  const letterVariants = {
    initial: {
      opacity: 0,
      filter: "blur(12px)",
      y: 10,
    },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        opacity: { duration: 0.25 },
        filter: { duration: 0.4 },
        y: { type: "spring", stiffness: 80, damping: 20 },
      },
    },
    exit: {
      opacity: 0,
      filter: "blur(12px)",
      y: -10,
      transition: {
        opacity: { duration: 0.2 },
        filter: { duration: 0.3 },
        y: { type: "spring", stiffness: 80, damping: 20 },
      },
    },
  };

  return (
    <div className="absolute left-0 top-0 w-full h-full pointer-events-none flex items-center px-3 py-2">
      <AnimatePresence mode="wait">
        {showPlaceholder && !isActive && !inputValue && (
          <motion.span
            key={currentIndex}
            className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 select-none pointer-events-none text-base sm:text-base md:text-base"
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              zIndex: 0,
              fontSize: "14px",
            }}
            variants={placeholderContainerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {placeholders[currentIndex]
              .split("")
              .map((char, i) => (
                <motion.span
                  key={i}
                  variants={letterVariants}
                  style={{ display: "inline-block" }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};
