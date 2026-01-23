import { cn } from "@/lib/utils";
import { Package, Megaphone, ExternalLink } from "lucide-react";
import { CardMessageData } from "@/types/chat";

interface ChatCardMessageProps {
  data: CardMessageData;
  variant?: 'sent' | 'received';
}

export const ChatCardMessage = ({ data, variant = 'received' }: ChatCardMessageProps) => {
  const isSent = variant === 'sent';
  
  const IconComponent = data.entityType === 'product' ? Package : Megaphone;
  
  return (
    <div className={cn(
      "flex gap-3 p-3 rounded-lg min-w-[220px] max-w-[300px]",
      isSent 
        ? "bg-white/10 border border-white/20" 
        : "bg-muted/70 border border-border"
    )}>
      {/* Image */}
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        {data.imageUrl ? (
          <img 
            src={data.imageUrl} 
            alt={data.title} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className={cn(
            "w-full h-full flex items-center justify-center",
            isSent ? "bg-white/10" : "bg-muted"
          )}>
            <IconComponent className={cn(
              "w-6 h-6",
              isSent ? "text-white/60" : "text-muted-foreground"
            )} />
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <h4 className={cn(
          "font-semibold text-sm truncate",
          isSent ? "text-white" : "text-foreground"
        )}>
          {data.title}
        </h4>
        
        {data.description && (
          <p className={cn(
            "text-xs line-clamp-2 mt-0.5 leading-relaxed",
            isSent ? "text-white/70" : "text-muted-foreground"
          )}>
            {data.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-auto pt-2 gap-2">
          {data.priceLabel && (
            <span className={cn(
              "font-bold text-sm",
              isSent ? "text-white" : "text-foreground"
            )}>
              {data.priceLabel}
            </span>
          )}
          
          {data.ctaUrl && (
            <a
              href={data.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "text-xs px-2.5 py-1 rounded-md font-medium inline-flex items-center gap-1 transition-colors",
                isSent 
                  ? "bg-white/20 text-white hover:bg-white/30" 
                  : "bg-brand-gradient text-white hover:opacity-90"
              )}
            >
              {data.ctaLabel || 'View'}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
