
import PhoneNumberField from "@/components/ui/phone-number-field";

interface ConsultationFormFieldsProps {
  cellphone: string;
  onCellphoneChange: (value: string) => void;
  dialCode: string;
  onDialCodeChange: (code: string) => void;
}

const ConsultationFormFields = ({
  cellphone,
  onCellphoneChange,
  dialCode,
  onDialCodeChange,
}: ConsultationFormFieldsProps) => {
  return (
    <>
      <div>
        <label htmlFor="consultation-cellphone" className="block text-sm font-medium text-gray-700 mb-1">
          Cellphone
        </label>
        <PhoneNumberField
          id="consultation-cellphone"
          value={cellphone}
          onChange={onCellphoneChange}
          dialCode={dialCode}
          onDialCodeChange={onDialCodeChange}
          required
          inputClassName="focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
        />
      </div>
    </>
  );
};

export default ConsultationFormFields;
