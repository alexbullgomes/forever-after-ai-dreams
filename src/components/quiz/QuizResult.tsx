
import { Card } from "@/components/ui/card";
import { QuizAnswer, UserLead } from "@/pages/WeddingQuiz";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { sendQuizWebhook } from "@/utils/quizWebhook";
import ConsultationPopup from "./ConsultationPopup";
import QuizResultHeader from "./QuizResultHeader";
import PackageRecommendation from "./PackageRecommendation";
import QuizResultActions from "./QuizResultActions";
import { calculateRecommendation, getPackageInfo } from "./utils/packageCalculator";

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
  const [showConsultationPopup, setShowConsultationPopup] = useState(false);

  // Calculate the recommended package based on quiz answers
  const recommendation = calculateRecommendation(answers);
  const packageInfo = getPackageInfo(recommendation);

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

  // Auto-open consultation popup after 30 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConsultationPopup(true);
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleViewPackages = () => {
    navigate('/wedding-packages');
  };

  const handleBookConsultation = () => {
    setShowConsultationPopup(true);
  };

  const handleCloseConsultation = () => {
    setShowConsultationPopup(false);
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
        <div className="max-w-2xl mx-auto w-full">
          <Card className="p-8 bg-card/90 backdrop-blur-sm shadow-xl">
            {/* Header */}
            <QuizResultHeader userFullName={userLead.fullName} />

            {/* Recommended Package */}
            <PackageRecommendation 
              packageInfo={packageInfo}
              userFullName={userLead.fullName}
            />

            {/* Call to Actions */}
            <QuizResultActions
              onBookConsultation={handleBookConsultation}
              onViewPackages={handleViewPackages}
              onRestart={onRestart}
            />

            {/* Additional Info */}
            <div className="mt-6 p-4 bg-info-light rounded-lg">
              <p className="text-sm text-info-text text-center">
                💡 <strong>Next Steps:</strong> Our team will reach out within 24 hours to discuss your vision and answer any questions about your recommended package.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Consultation Popup */}
      <ConsultationPopup
        isOpen={showConsultationPopup}
        onClose={handleCloseConsultation}
        userEmail={userLead.email}
        packageInfo={{
          name: packageInfo.name,
          price: packageInfo.price,
          type: packageInfo.type
        }}
      />
    </>
  );
};

export default QuizResult;
