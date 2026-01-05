import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AlertCircle, Check, Clock, XCircle, HelpCircle } from 'lucide-react';

export type AvailabilityStatus = 'available' | 'limited' | 'full' | 'blocked' | 'needs_review';

interface AvailabilityStatusBadgeProps {
  status: AvailabilityStatus;
  reason?: string;
  onClick?: () => void;
  className?: string;
}

const STATUS_CONFIG: Record<AvailabilityStatus, {
  label: string;
  className: string;
  icon: React.ElementType;
}> = {
  available: {
    label: 'Available',
    className: 'bg-green-100 text-green-800 hover:bg-green-200',
    icon: Check,
  },
  limited: {
    label: 'Limited',
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    icon: Clock,
  },
  full: {
    label: 'Full',
    className: 'bg-red-100 text-red-800 hover:bg-red-200',
    icon: XCircle,
  },
  blocked: {
    label: 'Blocked',
    className: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    icon: XCircle,
  },
  needs_review: {
    label: 'Needs Review',
    className: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
    icon: HelpCircle,
  },
};

export const AvailabilityStatusBadge: React.FC<AvailabilityStatusBadgeProps> = ({
  status,
  reason,
  onClick,
  className,
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.needs_review;
  const Icon = config.icon;

  const badge = (
    <Badge
      className={cn(
        'font-normal cursor-pointer transition-colors flex items-center gap-1',
        config.className,
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );

  if (reason) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{reason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
};
