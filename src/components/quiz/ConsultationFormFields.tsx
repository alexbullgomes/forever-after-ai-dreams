
import { Input } from "@/components/ui/input";

interface ConsultationFormFieldsProps {
  email: string;
  cellphone: string;
  onEmailChange: (value: string) => void;
  onCellphoneChange: (value: string) => void;
}

const ConsultationFormFields = ({
  email,
  cellphone,
  onEmailChange,
  onCellphoneChange
}: ConsultationFormFieldsProps) => {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Email
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="your@email.com"
          required
          className="w-full focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          autoComplete="email"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cellphone
        </label>
        <Input
          type="tel"
          value={cellphone}
          onChange={(e) => onCellphoneChange(e.target.value)}
          placeholder="(555) 123-4567"
          required
          className="w-full focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          autoComplete="tel"
        />
      </div>
    </>
  );
};

export default ConsultationFormFields;
