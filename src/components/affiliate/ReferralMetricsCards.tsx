import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageCircle, CheckCircle2 } from 'lucide-react';

interface ReferralStats {
  totalReferrals: number;
  negotiating: number;
  dealsClosed: number;
}

interface ReferralMetricsCardsProps {
  stats: ReferralStats;
}

const ReferralMetricsCards = ({ stats }: ReferralMetricsCardsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalReferrals}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Total Referrals</div>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30">
            <MessageCircle className="w-6 h-6 mx-auto mb-2 text-amber-600 dark:text-amber-400" />
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.negotiating}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Negotiating</div>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.dealsClosed}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Deals Closed</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralMetricsCards;
