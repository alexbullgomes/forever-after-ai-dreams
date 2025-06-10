
import { Send } from "lucide-react";

interface SendButtonProps {
  isLoading: boolean;
  inputValue: string;
  attachedFiles: File[];
  onSend: () => void;
}

export const SendButton = ({ isLoading, inputValue, attachedFiles, onSend }: SendButtonProps) => {
  const isDisabled = isLoading || (!inputValue.trim() && attachedFiles.length === 0);
  
  return (
    <button
      className={`flex items-center gap-1 bg-black hover:bg-zinc-700 text-white p-3 rounded-full font-medium justify-center transition ${
        isLoading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      title="Send"
      type="button"
      tabIndex={-1}
      onClick={onSend}
      disabled={isDisabled}
    >
      <Send size={18} />
    </button>
  );
};
