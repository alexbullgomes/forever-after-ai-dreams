
import { Clock } from "lucide-react";
import { formatTime } from "./utils/countdownTimer";

interface CountdownTimerProps {
  timeLeft: number;
}

const CountdownTimer = ({ timeLeft }: CountdownTimerProps) => {
  return (
    <div className="mt-6 mx-auto max-w-xs">
      <div className="bg-card text-brand-primary-from px-6 py-4 rounded-xl shadow-lg">
        <div className="flex items-center justify-center mb-2">
          <Clock className="w-5 h-5 mr-2 text-brand-primary-from" />
          <span className="text-sm font-semibold">Your 30% OFF offer expires in:</span>
        </div>
        <div className="text-2xl font-bold text-brand-primary-from font-mono">
          {formatTime(timeLeft)}
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
