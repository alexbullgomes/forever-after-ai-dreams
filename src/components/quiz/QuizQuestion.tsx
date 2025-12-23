
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
    question: "How do you envision preserving your wedding memories?",
    answers: [
      { id: "a", text: "Beautiful photos to hang on our walls and share with family", category: "photo" as const, intensity: "mid" as const },
      { id: "b", text: "A cinematic film we can watch together on anniversaries", category: "video" as const, intensity: "mid" as const },
      { id: "c", text: "Both stunning photos and a movie-like film of our day", category: "both" as const, intensity: "mid" as const }
    ]
  },
  {
    id: 2,
    question: "What excites you most about your wedding day documentation?",
    answers: [
      { id: "a", text: "Capturing those candid, heartfelt moments in timeless photographs", category: "photo" as const, intensity: "mid" as const },
      { id: "b", text: "Having our love story told through moving images and sound", category: "video" as const, intensity: "mid" as const },
      { id: "c", text: "Creating a complete archive of our special day in every format", category: "both" as const, intensity: "premium" as const }
    ]
  },
  {
    id: 3,
    question: "How would you describe your ideal wedding celebration?",
    answers: [
      { id: "a", text: "An intimate gathering with our closest loved ones", category: "photo" as const, intensity: "essential" as const },
      { id: "b", text: "A classic celebration with meaningful traditions", category: "video" as const, intensity: "mid" as const },
      { id: "c", text: "A grand, unforgettable event with every detail perfect", category: "both" as const, intensity: "premium" as const }
    ]
  },
  {
    id: 4,
    question: "When you imagine your wedding coverage, what feels right?",
    answers: [
      { id: "a", text: "Quality essentials that capture the key moments beautifully", category: "photo" as const, intensity: "essential" as const },
      { id: "b", text: "Comprehensive coverage that tells our complete story", category: "video" as const, intensity: "mid" as const },
      { id: "c", text: "Premium, luxury experience with every moment documented", category: "both" as const, intensity: "premium" as const }
    ]
  },
  {
    id: 5,
    question: "What's most important to you in your wedding investment?",
    answers: [
      { id: "a", text: "Smart value that delivers beautiful results within our budget", category: "photo" as const, intensity: "essential" as const },
      { id: "b", text: "Balance between quality coverage and reasonable investment", category: "video" as const, intensity: "mid" as const },
      { id: "c", text: "This is our once-in-a-lifetime day - we want the absolute best", category: "both" as const, intensity: "premium" as const }
    ]
  },
  {
    id: 6,
    question: "How do you want to experience your wedding day?",
    answers: [
      { id: "a", text: "Relaxed and natural, focusing on authentic moments", category: "photo" as const, intensity: "essential" as const },
      { id: "b", text: "Beautifully orchestrated with cinematic moments", category: "video" as const, intensity: "premium" as const },
      { id: "c", text: "Like movie stars with full production value", category: "both" as const, intensity: "premium" as const }
    ]
  },
  {
    id: 7,
    question: "What matters most for your wedding memories?",
    answers: [
      { id: "a", text: "Having the edited highlights that tell our story perfectly", category: "photo" as const, intensity: "mid" as const },
      { id: "b", text: "Getting both polished content and raw footage for flexibility", category: "video" as const, intensity: "premium" as const },
      { id: "c", text: "Complete access to everything - we want it all!", category: "both" as const, intensity: "premium" as const }
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
                className="flex items-center text-muted-foreground hover:text-foreground p-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            ) : (
              <div></div>
            )}
            <span className="text-sm text-muted-foreground">Question {questionNumber} of {totalQuestions}</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="p-6 md:p-8 bg-card/80 backdrop-blur-sm shadow-xl">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-6 md:mb-8 text-center leading-tight">
            {currentQuestion.question}
          </h2>

          <div className="space-y-3 md:space-y-4">
            {currentQuestion.answers.map((answer) => (
              <Button
                key={answer.id}
                onClick={() => handleAnswer(answer.id, answer.category, answer.intensity)}
                variant="outline"
                className="w-full p-4 md:p-6 text-left justify-start text-base md:text-lg font-medium hover:bg-brand-light hover:border-brand-primary-from transition-all duration-300 min-h-[60px] md:min-h-[70px] h-auto whitespace-normal leading-relaxed"
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
