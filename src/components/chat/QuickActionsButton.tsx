import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QuickActionsButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const QuickActionsButton = ({ onClick, disabled }: QuickActionsButtonProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className="shrink-0 hover:bg-brand-gradient hover:text-white hover:border-transparent transition-colors"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Send product or campaign card</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
