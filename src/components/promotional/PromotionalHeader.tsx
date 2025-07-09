import { Heart } from "lucide-react";
import { CountdownTimer } from "./CountdownTimer";

interface PromotionalHeaderProps {
  isOpen: boolean;
  onExpired: () => void;
}

export const PromotionalHeader = ({ isOpen, onExpired }: PromotionalHeaderProps) => {
  return (
    <div className="px-6 pt-8 pb-6 text-center text-white">
      {/* Heart Icon */}
      <div className="flex justify-center mb-4">
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
          <Heart className="w-6 h-6 text-white" fill="white" />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold mb-2">
        Unlock 30% OFF on Your Wedding Package!
      </h2>
      
      {/* Subtitle */}
      <p className="text-white/90 text-sm mb-6">
        Personalize your experience with just your phone number.
      </p>

      {/* Countdown Timer */}
      <CountdownTimer isOpen={isOpen} onExpired={onExpired} />
    </div>
  );
};