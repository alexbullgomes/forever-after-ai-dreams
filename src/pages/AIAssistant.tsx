import { AIAssistantSection } from "@/components/wedding/AIAssistantSection";
import { Sparkles } from "lucide-react";

const AIAssistant = () => {
  return (
    <div className="flex-1 p-6">
      {/* Header Section */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-brand-gradient rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            AI Assistant
          </h1>
        </div>
        <p className="text-muted-foreground ml-0 md:ml-[52px]">
          Get personalized recommendations for your ideal service—by text or voice. 
          Want a human? We'll connect you with a real assistant.
        </p>
      </div>

      {/* Chat Section */}
      <AIAssistantSection showHeader={false} />
    </div>
  );
};

export default AIAssistant;
