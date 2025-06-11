
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { QuizAnswer } from "@/pages/WeddingQuiz";

interface QuizQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: QuizAnswer) => void;
  onBack?: () => void;
}

const questions = [
  {
    id: 1,
    question: "How would you describe your ideal wedding atmosphere?",
    answers: [
      { id: "a", text: "Intimate and romantic", category: "photo" as const, intensity: "essential" as const },
      { id: "b", text: "Cinematic and dramatic", category: "video" as const, intensity: "mid" as const },
      { id: "c", text: "Grand celebration with all the details", category: "both" as const, intensity: "premium" as const }
    ]
  },
  {
    id: 2,
    question: "What moments are most important to capture?",
    answers: [
      { id: "a", text: "Those quiet, candid moments", category: "photo" as const, intensity: "essential" as const },
      { id: "b", text: "The ceremony and emotional reactions", category: "video" as const, intensity: "mid" as const },
      { id: "c", text: "Every single detail from prep to exit", category: "both" as const, intensity: "premium" as const }
    ]
  },
  {
    id: 3,
    question: "How do you want to relive your wedding day?",
    answers: [
      { id: "a", text: "Beautiful photos on our walls", category: "photo" as const, intensity: "mid" as const },
      { id: "b", text: "A cinematic film to watch together", category: "video" as const, intensity: "premium" as const },
      { id: "c", text: "Both photos and videos for different occasions", category: "both" as const, intensity: "premium" as const }
    ]
  },
  {
    id: 4,
    question: "What's your wedding budget priority?",
    answers: [
      { id: "a", text: "Quality essentials that fit our budget", category: "photo" as const, intensity: "essential" as const },
      { id: "b", text: "Balanced coverage with good value", category: "video" as const, intensity: "mid" as const },
      { id: "c", text: "Premium experience, it's worth the investment", category: "both" as const, intensity: "premium" as const }
    ]
  },
  {
    id: 5,
    question: "How many guests will attend your wedding?",
    answers: [
      { id: "a", text: "50 or fewer (intimate ceremony)", category: "photo" as const, intensity: "essential" as const },
      { id: "b", text: "50-150 guests (classic wedding)", category: "video" as const, intensity: "mid" as const },
      { id: "c", text: "150+ guests (large celebration)", category: "both" as const, intensity: "premium" as const }
    ]
  },
  {
    id: 6,
    question: "What style appeals to you most?",
    answers: [
      { id: "a", text: "Timeless and classic", category: "photo" as const, intensity: "mid" as const },
      { id: "b", text: "Modern and cinematic", category: "video" as const, intensity: "premium" as const },
      { id: "c", text: "Artistic and editorial", category: "both" as const, intensity: "premium" as const }
    ]
  },
  {
    id: 7,
    question: "How important is having raw footage/files?",
    answers: [
      { id: "a", text: "Not important, edited photos are enough", category: "photo" as const, intensity: "essential" as const },
      { id: "b", text: "Somewhat important for special moments", category: "video" as const, intensity: "mid" as const },
      { id: "c", text: "Very important, I want everything", category: "both" as const, intensity: "premium" as const }
    ]
  }
];

const QuizQuestion = ({ questionNumber, totalQuestions, onAnswer, onBack }: QuizQuestionProps) => {
  const currentQuestion = questions[questionNumber - 1];
  const progress = (questionNumber / totalQuestions) * 100;

  const handleAnswer = (answerId: string, category: 'photo' | 'video' | 'both', intensity: 'essential' | 'mid' | 'premium') => {
    onAnswer({
      questionId: currentQuestion.id,
      answerId,
      category,
      intensity
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
      <div className="max-w-2xl mx-auto w-full">
        {/* Back Button and Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {questionNumber > 1 && onBack ? (
              <Button
                onClick={onBack}
                variant="ghost"
                className="flex items-center text-gray-600 hover:text-gray-800 p-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            ) : (
              <div></div>
            )}
            <span className="text-sm text-gray-600">Question {questionNumber} of {totalQuestions}</span>
            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="p-6 md:p-8 bg-white/80 backdrop-blur-sm shadow-xl">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-6 md:mb-8 text-center leading-tight">
            {currentQuestion.question}
          </h2>

          <div className="space-y-3 md:space-y-4">
            {currentQuestion.answers.map((answer) => (
              <Button
                key={answer.id}
                onClick={() => handleAnswer(answer.id, answer.category, answer.intensity)}
                variant="outline"
                className="w-full p-4 md:p-6 text-left justify-start text-base md:text-lg font-medium hover:bg-gradient-to-r hover:from-rose-50 hover:to-purple-50 hover:border-rose-300 transition-all duration-300 min-h-[60px] md:min-h-[70px] h-auto whitespace-normal leading-relaxed"
              >
                <span className="text-left break-words w-full">
                  {answer.text}
                </span>
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default QuizQuestion;
