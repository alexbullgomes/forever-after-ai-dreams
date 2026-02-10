
import { useState } from "react";
import { validateConsultationForm, submitConsultationRequest } from "./utils/formValidation";
import ConsultationFormFields from "./ConsultationFormFields";
import ConsultationFormActions from "./ConsultationFormActions";
import { buildPhonePayload } from "@/components/ui/phone-number-field";

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
  const [cellphone, setCellphone] = useState("");
  const [dialCode, setDialCode] = useState("+1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = validateConsultationForm(userEmail || "", cellphone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);

    try {
      await submitConsultationRequest(userEmail || "", cellphone, packageInfo, buildPhonePayload(dialCode, cellphone));
      onClose();
      console.log('Consultation request submitted successfully');
      // Redirect to planner page with auto-open chat
      window.location.href = '/services?openChat=true';
    } catch (error) {
      console.error('Failed to submit consultation request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
      <ConsultationFormFields
        cellphone={cellphone}
        onCellphoneChange={setCellphone}
        dialCode={dialCode}
        onDialCodeChange={setDialCode}
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
