
import { Heart } from "lucide-react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CountdownTimer from "./CountdownTimer";

interface ConsultationPopupHeaderProps {
  timeLeft: number;
}

const ConsultationPopupHeader = ({ timeLeft }: ConsultationPopupHeaderProps) => {
  return (
    <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-center py-6 px-6">
      <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
        <Heart className="w-8 h-8 text-white" />
      </div>
      
      <DialogHeader>
        <DialogTitle className="text-xl font-bold text-white text-center leading-tight">
          Personalize your Video & Photo Package<br />
          Unlock up to 30% OFF
        </DialogTitle>
      </DialogHeader>
      
      <p className="text-rose-100 text-sm mt-2">
        Tell us a bit about your wedding so we can tailor the perfect Photo & Video bundle for you.
      </p>

      <CountdownTimer timeLeft={timeLeft} />
    </div>
  );
};

export default ConsultationPopupHeader;
