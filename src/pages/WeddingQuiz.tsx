
import { useState } from "react";
import QuizLanding from "@/components/quiz/QuizLanding";
import QuizQuestion from "@/components/quiz/QuizQuestion";
import LeadCapture from "@/components/quiz/LeadCapture";
import QuizResult from "@/components/quiz/QuizResult";

export type QuizAnswer = {
  questionId: number;
  answerId: string;
  category: 'photo' | 'video' | 'both';
  intensity: 'essential' | 'mid' | 'premium';
};

export type UserLead = {
  fullName: string;
  email: string;
  weddingDate?: string;
};

const WeddingQuiz = () => {
  const [currentStep, setCurrentStep] = useState<'landing' | 'quiz' | 'lead' | 'result'>('landing');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [userLead, setUserLead] = useState<UserLead | null>(null);

  const startQuiz = () => {
    setCurrentStep('quiz');
    setCurrentQuestion(0);
    setAnswers([]);
  };

  const handleQuestionAnswer = (answer: QuizAnswer) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (newAnswers.length === 7) {
      setCurrentStep('lead');
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleBackQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setAnswers(answers.slice(0, -1));
    } else {
      setCurrentStep('landing');
    }
  };

  const handleLeadSubmit = (lead: UserLead) => {
    setUserLead(lead);
    setCurrentStep('result');
  };

  const restartQuiz = () => {
    setCurrentStep('landing');
    setCurrentQuestion(0);
    setAnswers([]);
    setUserLead(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      {currentStep === 'landing' && <QuizLanding onStartQuiz={startQuiz} />}
      
      {currentStep === 'quiz' && (
        <QuizQuestion
          questionNumber={currentQuestion + 1}
          totalQuestions={7}
          onAnswer={handleQuestionAnswer}
          onBack={handleBackQuestion}
        />
      )}
      
      {currentStep === 'lead' && (
        <LeadCapture onSubmit={handleLeadSubmit} />
      )}
      
      {currentStep === 'result' && userLead && (
        <QuizResult
          answers={answers}
          userLead={userLead}
          onRestart={restartQuiz}
        />
      )}
    </div>
  );
};

export default WeddingQuiz;
