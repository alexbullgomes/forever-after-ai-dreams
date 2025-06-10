
import { AnimatedPlaceholder } from "../animated-placeholder";
import { PLACEHOLDERS } from "./constants";

interface TextInputProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onFocus: () => void;
  isLoading: boolean;
  placeholderIndex: number;
  showPlaceholder: boolean;
  isActive: boolean;
}

export const TextInput = ({
  inputValue,
  onInputChange,
  onKeyPress,
  onFocus,
  isLoading,
  placeholderIndex,
  showPlaceholder,
  isActive,
}: TextInputProps) => {
  return (
    <div className="relative flex-1">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyPress={onKeyPress}
        className="flex-1 border-0 outline-0 rounded-md py-2 text-base bg-transparent w-full font-normal"
        style={{ position: "relative", zIndex: 1 }}
        onFocus={onFocus}
        disabled={isLoading}
      />
      <AnimatedPlaceholder
        placeholders={PLACEHOLDERS}
        currentIndex={placeholderIndex}
        showPlaceholder={showPlaceholder}
        isActive={isActive}
        inputValue={inputValue}
      />
    </div>
  );
};
