import React from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const COUNTRIES = [
  { code: '+1', flag: '🇺🇸', label: 'US' },
  { code: '+1CA', flag: '🇨🇦', label: 'CA', dialCode: '+1' },
  { code: '+52', flag: '🇲🇽', label: 'MX' },
  { code: '+55', flag: '🇧🇷', label: 'BR' },
  { code: '+44', flag: '🇬🇧', label: 'GB' },
  { code: '+33', flag: '🇫🇷', label: 'FR' },
  { code: '+49', flag: '🇩🇪', label: 'DE' },
  { code: '+34', flag: '🇪🇸', label: 'ES' },
  { code: '+39', flag: '🇮🇹', label: 'IT' },
  { code: '+61', flag: '🇦🇺', label: 'AU' },
  { code: '+91', flag: '🇮🇳', label: 'IN' },
  { code: '+81', flag: '🇯🇵', label: 'JP' },
  { code: '+82', flag: '🇰🇷', label: 'KR' },
  { code: '+57', flag: '🇨🇴', label: 'CO' },
  { code: '+54', flag: '🇦🇷', label: 'AR' },
  { code: '+56', flag: '🇨🇱', label: 'CL' },
] as const;

/** Get the actual dial code (strips CA suffix) */
function getDialCode(code: string): string {
  const country = COUNTRIES.find((c) => c.code === code);
  if (country && 'dialCode' in country) return country.dialCode;
  return code;
}

export function formatUSPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export function stripNonDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function buildPhoneE164(dialCode: string, national: string): string {
  const digits = stripNonDigits(national);
  const dc = getDialCode(dialCode);
  return `${dc}${digits}`;
}

export function buildPhonePayload(dialCode: string, national: string) {
  return {
    phone_e164: buildPhoneE164(dialCode, national),
    phone_country_dial_code: getDialCode(dialCode),
    phone_national: national,
  };
}

export function isValidPhone(dialCode: string, national: string): boolean {
  const digits = stripNonDigits(national);
  const dc = getDialCode(dialCode);
  if (dc === '+1') return digits.length === 10;
  return digits.length >= 7 && digits.length <= 15;
}

interface PhoneNumberFieldProps {
  value: string;
  onChange: (value: string) => void;
  dialCode: string;
  onDialCodeChange: (code: string) => void;
  id?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
}

const PhoneNumberField: React.FC<PhoneNumberFieldProps> = ({
  value,
  onChange,
  dialCode,
  onDialCodeChange,
  id,
  placeholder,
  required,
  className = '',
  inputClassName = '',
  disabled,
}) => {
  const isUS = getDialCode(dialCode) === '+1';
  const defaultPlaceholder = isUS ? '(555) 123-4567' : 'Phone number';
  const maxLength = isUS ? 14 : 20;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (isUS) {
      onChange(formatUSPhone(raw));
    } else {
      // Allow digits, spaces, dashes only
      onChange(raw.replace(/[^\d\s\-]/g, ''));
    }
  };

  const selectedCountry = COUNTRIES.find((c) => c.code === dialCode);
  const displayCode = selectedCountry ? getDialCode(selectedCountry.code) : dialCode;

  return (
    <div className={`flex ${className}`}>
      <Select value={dialCode} onValueChange={onDialCodeChange} disabled={disabled}>
        <SelectTrigger
          className={`w-[85px] rounded-r-none border-r-0 shrink-0 focus:z-10 ${inputClassName}`}
          aria-label="Country dial code"
        >
          <SelectValue>
            {selectedCountry ? `${selectedCountry.flag} ${displayCode}` : displayCode}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[280px] bg-popover/95 backdrop-blur-md border-white/20 shadow-xl">
          {COUNTRIES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.flag} {c.label} {getDialCode(c.code)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={id}
        type="tel"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder ?? defaultPlaceholder}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        autoComplete="tel-national"
        className={`rounded-l-none ${inputClassName}`}
      />
    </div>
  );
};

export default PhoneNumberField;
