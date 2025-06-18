
import { Heart } from "lucide-react";

interface QuizResultHeaderProps {
  userFullName: string;
}

const QuizResultHeader = ({ userFullName }: QuizResultHeaderProps) => {
  return (
    <div className="text-center mb-8">
      <div className="w-20 h-20 mx-auto mb-4 p-4 rounded-full bg-gradient-to-r from-rose-500 to-purple-500">
        <Heart className="w-full h-full text-white" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        Perfect Match Found! 
      </h2>
      <p className="text-gray-600">
        Hi {userFullName}, here's your personalized recommendation
      </p>
    </div>
  );
};

export default QuizResultHeader;
