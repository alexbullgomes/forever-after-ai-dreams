
import { Button } from "@/components/ui/button";

interface ConsultationFormActionsProps {
  isSubmitting: boolean;
  isFormValid: boolean;
  onClose: () => void;
}

const ConsultationFormActions = ({
  isSubmitting,
  isFormValid,
  onClose
}: ConsultationFormActionsProps) => {
  return (
    <div className="space-y-3 pt-2">
      <Button
        type="submit"
        disabled={isSubmitting || !isFormValid}
        className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
      >
        {isSubmitting ? "Submitting..." : "📞 Book Free Consultation"}
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={onClose}
        className="w-full text-gray-600 hover:text-gray-800 py-2 hover:bg-gray-50"
      >
        Maybe Later
      </Button>

      <p className="text-center text-xs text-gray-500 mt-3">
        Offer expires soon. Lock in your savings today.
      </p>
    </div>
  );
};

export default ConsultationFormActions;
