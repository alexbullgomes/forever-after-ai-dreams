
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { useState } from "react";
import ConsultationForm from "../ConsultationForm";

const CTASection = () => {
  const [isConsultationFormOpen, setIsConsultationFormOpen] = useState(false);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <Video className="w-16 h-16 text-rose-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to Capture Your Love Story?
        </h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Let's schedule a consultation to discuss your vision and customize the perfect 
          package for your special day. Our team is excited to work with you!
        </p>
        <Button 
          size="lg" 
          onClick={() => setIsConsultationFormOpen(true)}
          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl hover:shadow-rose-500/25 transition-all duration-300"
        >
          Schedule Free Consultation
        </Button>
      </div>

      <ConsultationForm 
        isOpen={isConsultationFormOpen}
        onClose={() => setIsConsultationFormOpen(false)}
      />
    </>
  );
};

export { CTASection };
