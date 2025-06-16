import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EstimatedPriceBadge } from "@/components/ui/estimated-price-badge";
import { Camera, Video, Sparkles, Heart, ArrowRight, RotateCcw } from "lucide-react";
import { QuizAnswer, UserLead } from "@/pages/WeddingQuiz";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { sendQuizWebhook } from "@/utils/quizWebhook";
import QuizConsultationForm from "./QuizConsultationForm";

interface QuizResultProps {
  answers: QuizAnswer[];
  userLead: UserLead;
  onRestart: () => void;
}
const QuizResult = ({
  answers,
  userLead,
  onRestart
}: QuizResultProps) => {
  const navigate = useNavigate();
  const [isConsultationFormOpen, setIsConsultationFormOpen] = useState(false);

  // Calculate the recommended package based on quiz answers
  const calculateRecommendation = () => {
    const categoryCount = answers.reduce((acc, answer) => {
      acc[answer.category] = (acc[answer.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const intensityCount = answers.reduce((acc, answer) => {
      acc[answer.intensity] = (acc[answer.intensity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const dominantCategory = Object.entries(categoryCount).reduce((a, b) => categoryCount[a[0]] > categoryCount[b[0]] ? a : b)[0] as 'photo' | 'video' | 'both';
    const dominantIntensity = Object.entries(intensityCount).reduce((a, b) => intensityCount[a[0]] > intensityCount[b[0]] ? a : b)[0] as 'essential' | 'mid' | 'premium';
    return {
      category: dominantCategory,
      intensity: dominantIntensity
    };
  };
  const recommendation = calculateRecommendation();

  // Package mapping based on recommendation
  const getPackageInfo = () => {
    if (recommendation.category === 'photo') {
      if (recommendation.intensity === 'essential') return {
        name: "The Intimate Moments Collection",
        price: "$1,800",
        type: "Photography Package",
        icon: Camera,
        color: "rose"
      };
      if (recommendation.intensity === 'mid') return {
        name: "The Ever After Collection",
        price: "$2,600",
        type: "Photography Package",
        icon: Camera,
        color: "rose"
      };
      return {
        name: "The Forever Yours Experience",
        price: "$3,900",
        type: "Photography Package",
        icon: Camera,
        color: "rose"
      };
    }
    if (recommendation.category === 'video') {
      if (recommendation.intensity === 'essential') return {
        name: "The Highlight Reel",
        price: "$2,500",
        type: "Videography Package",
        icon: Video,
        color: "blue"
      };
      if (recommendation.intensity === 'mid') return {
        name: "The Legacy Film",
        price: "$3,500",
        type: "Videography Package",
        icon: Video,
        color: "blue"
      };
      return {
        name: "The Cinematic Love Story",
        price: "$5,000",
        type: "Videography Package",
        icon: Video,
        color: "blue"
      };
    }

    // Both category
    if (recommendation.intensity === 'essential') return {
      name: "Essential Love",
      price: "$2,999",
      type: "Photo + Video Package",
      icon: Sparkles,
      color: "purple"
    };
    if (recommendation.intensity === 'mid') return {
      name: "Dream Wedding",
      price: "$4,999",
      type: "Photo + Video Package",
      icon: Sparkles,
      color: "purple"
    };
    return {
      name: "Luxury Experience",
      price: "$8,999",
      type: "Photo + Video Package",
      icon: Sparkles,
      color: "purple"
    };
  };
  const packageInfo = getPackageInfo();
  const IconComponent = packageInfo.icon;

  // Send webhook when component mounts
  useEffect(() => {
    const sendWebhook = async () => {
      await sendQuizWebhook(userLead, answers, {
        category: recommendation.category,
        intensity: recommendation.intensity,
        packageName: packageInfo.name,
        packagePrice: packageInfo.price,
        packageType: packageInfo.type
      });
    };
    sendWebhook();
  }, [answers, userLead, recommendation, packageInfo]);

  const handleViewPackages = () => {
    navigate('/wedding-packages');
  };

  const handleBookConsultation = () => {
    setIsConsultationFormOpen(true);
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
        <div className="max-w-2xl mx-auto w-full">
          <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 p-4 rounded-full bg-gradient-to-r from-rose-500 to-purple-500">
                <Heart className="w-full h-full text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Perfect Match Found! 
              </h2>
              <p className="text-gray-600">
                Hi {userLead.fullName}, here's your personalized recommendation
              </p>
            </div>

            {/* Recommended Package */}
            <div className="bg-gradient-to-r from-rose-50 to-purple-50 rounded-xl p-8 mb-8">
              <div className="text-center">
                {/* Icon */}
                <div className={`w-20 h-20 mx-auto mb-4 p-4 rounded-full bg-${packageInfo.color}-100`}>
                  <IconComponent className={`w-full h-full text-${packageInfo.color}-500`} />
                </div>
                
                {/* Package Type Badge */}
                <Badge variant="secondary" className="mb-4">
                  {packageInfo.type}
                </Badge>
                
                {/* Package Name */}
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  {packageInfo.name}
                </h3>
                
                {/* Price */}
                <p className="text-4xl font-bold text-rose-600 mb-2">
                  {packageInfo.price}
                </p>
                
                {/* Estimated Price Badge */}
                <div className="mb-6">
                  <EstimatedPriceBadge />
                </div>
                
                {/* Description */}
                <p className="text-gray-700 leading-relaxed max-w-md mx-auto">
                  Based on your answers, this package perfectly captures your vision for intimate, 
                  authentic moments while fitting your style and budget preferences.
                </p>
              </div>
            </div>

            {/* Call to Actions */}
            <div className="space-y-4">
              <Button onClick={handleViewPackages} className="w-full bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white font-semibold py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                View Package Details
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              {/* Descriptive text above consultation button */}
              <p className="text-center text-gray-600 text-sm">
                Tailor your dream package to fit your budget.
              </p>

              <Button 
                onClick={handleBookConsultation}
                variant="outline" 
                className="w-full py-4 font-semibold border-2 hover:bg-rose-50"
              >
                Book a Free Consultation
              </Button>

              <Button onClick={onRestart} variant="ghost" className="w-full py-4 text-gray-600 hover:text-gray-800">
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake Quiz
              </Button>
            </div>

            {/* Additional Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 text-center">
                💡 <strong>Next Steps:</strong> Our team will reach out within 24 hours to discuss your vision and answer any questions about your recommended package.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Quiz Consultation Form */}
      <QuizConsultationForm
        isOpen={isConsultationFormOpen}
        onClose={() => setIsConsultationFormOpen(false)}
        packageName={packageInfo.name}
        packagePrice={packageInfo.price}
      />
    </>
  );
};

export default QuizResult;
