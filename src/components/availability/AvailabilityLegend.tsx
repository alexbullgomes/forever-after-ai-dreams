import React from 'react';
import { Check, Clock, XCircle, HelpCircle } from 'lucide-react';

const LEGEND_ITEMS = [
  { status: 'available', label: 'Available', color: 'bg-green-500', icon: Check },
  { status: 'limited', label: 'Limited', color: 'bg-yellow-500', icon: Clock },
  { status: 'full', label: 'Full', color: 'bg-red-500', icon: XCircle },
  { status: 'blocked', label: 'Blocked', color: 'bg-gray-400', icon: XCircle },
  { status: 'needs_review', label: 'Needs Review', color: 'bg-orange-500', icon: HelpCircle },
];

export const AvailabilityLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      {LEGEND_ITEMS.map((item) => (
        <div key={item.status} className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${item.color}`} />
          <span className="text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
};
