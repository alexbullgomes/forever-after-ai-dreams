
import { Button } from "@/components/ui/button";
import { ArrowRight, RotateCcw } from "lucide-react";

interface QuizResultActionsProps {
  onBookConsultation: () => void;
  onViewPackages: () => void;
  onRestart: () => void;
}

const QuizResultActions = ({ 
  onBookConsultation, 
  onViewPackages, 
  onRestart 
}: QuizResultActionsProps) => {
  return (
    <div className="space-y-4">
      {/* Descriptive text above consultation button */}
      <p className="text-center text-gray-600 text-sm">
        Tailor your dream package to fit your budget.
      </p>

      <Button 
        onClick={onBookConsultation} 
        className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
      >
        Book a Free Consultation
      </Button>

      <Button onClick={onViewPackages} variant="outline" className="w-full py-4 font-semibold border-2 hover:bg-rose-50">
        View Package Details
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>

      <Button onClick={onRestart} variant="ghost" className="w-full py-4 text-gray-600 hover:text-gray-800">
        <RotateCcw className="w-4 h-4 mr-2" />
        Retake Quiz
      </Button>
    </div>
  );
};

export default QuizResultActions;
