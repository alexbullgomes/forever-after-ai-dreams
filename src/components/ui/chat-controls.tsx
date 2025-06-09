
import { Lightbulb, Globe } from "lucide-react";
import { motion } from "motion/react";

interface ChatControlsProps {
  isVisible: boolean;
  thinkActive: boolean;
  deepSearchActive: boolean;
  onThinkToggle: () => void;
  onDeepSearchToggle: () => void;
}

export const ChatControls = ({ 
  isVisible, 
  thinkActive, 
  deepSearchActive, 
  onThinkToggle, 
  onDeepSearchToggle 
}: ChatControlsProps) => {
  return (
    <motion.div
      className="w-full flex justify-start px-4 items-center text-sm"
      variants={{
        hidden: {
          opacity: 0,
          y: 20,
          pointerEvents: "none" as const,
          transition: { duration: 0.25 },
        },
        visible: {
          opacity: 1,
          y: 0,
          pointerEvents: "auto" as const,
          transition: { duration: 0.35, delay: 0.08 },
        },
      }}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      style={{ marginTop: 8 }}
    >
      <div className="flex gap-3 items-center">
        {/* Think Toggle */}
        <button
          className={`flex items-center gap-1 px-4 py-2 rounded-full transition-all font-medium group ${
            thinkActive
              ? "bg-rose-600/10 outline outline-rose-600/60 text-rose-950"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          title="Think"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onThinkToggle();
          }}
        >
          <Lightbulb
            className="group-hover:fill-yellow-300 transition-all"
            size={18}
          />
          Think
        </button>

        {/* Deep Search Toggle */}
        <motion.button
          className={`flex items-center px-4 gap-1 py-2 rounded-full transition font-medium whitespace-nowrap overflow-hidden justify-start ${
            deepSearchActive
              ? "bg-rose-600/10 outline outline-rose-600/60 text-rose-950"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          title="Deep Search"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeepSearchToggle();
          }}
          initial={false}
          animate={{
            width: deepSearchActive ? 125 : 36,
            paddingLeft: deepSearchActive ? 8 : 9,
          }}
        >
          <div className="flex-1">
            <Globe size={18} />
          </div>
          <motion.span
            className="pb-[2px]"
            initial={false}
            animate={{
              opacity: deepSearchActive ? 1 : 0,
            }}
          >
            Deep Search
          </motion.span>
        </motion.button>
      </div>
    </motion.div>
  );
};
