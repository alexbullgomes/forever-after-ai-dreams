
import { useState } from "react";
import { validateConsultationForm, submitConsultationRequest } from "./utils/formValidation";
import ConsultationFormFields from "./ConsultationFormFields";
import ConsultationFormActions from "./ConsultationFormActions";

interface PackageInfo {
  name: string;
  price: string;
  type: string;
}

interface ConsultationFormProps {
  userEmail?: string;
  packageInfo: PackageInfo;
  onClose: () => void;
}

const ConsultationForm = ({ userEmail, packageInfo, onClose }: ConsultationFormProps) => {
  const [email, setEmail] = useState(userEmail || "");
  const [cellphone, setCellphone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = validateConsultationForm(email, cellphone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);

    try {
      await submitConsultationRequest(email, cellphone, packageInfo);
      onClose();
      console.log('Consultation request submitted successfully');
      // Redirect to planner page with auto-open chat
      window.location.href = '/planner?openChat=true';
    } catch (error) {
      console.error('Failed to submit consultation request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
      <ConsultationFormFields
        email={email}
        cellphone={cellphone}
        onEmailChange={setEmail}
        onCellphoneChange={setCellphone}
      />

      <ConsultationFormActions
        isSubmitting={isSubmitting}
        isFormValid={isFormValid}
        onClose={onClose}
      />
    </form>
  );
};

export default ConsultationForm;
