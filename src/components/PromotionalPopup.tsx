import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { PromotionalHeader } from "./promotional/PromotionalHeader";
import { PromotionalForm } from "./promotional/PromotionalForm";

interface PromotionalPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const PromotionalPopup = ({ isOpen, onClose }: PromotionalPopupProps) => {
  const [isExpired, setIsExpired] = useState(false);

  const handleExpired = () => {
    setIsExpired(true);
    onClose();
  };

  // Don't render if offer expired
  if (isExpired) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 p-0 gap-0 rounded-xl overflow-hidden bg-gradient-to-br from-rose-500 to-pink-500 border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-white/20 hover:bg-white/30 p-1.5"
        >
          <X className="h-4 w-4 text-white" />
          <span className="sr-only">Close</span>
        </button>

        {/* Header Section */}
        <PromotionalHeader isOpen={isOpen} onExpired={handleExpired} />

        {/* Form Section */}
        <PromotionalForm onSuccess={onClose} onMaybeLater={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default PromotionalPopup;