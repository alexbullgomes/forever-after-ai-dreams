import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarDays, MessageSquare, Megaphone } from 'lucide-react';
import { format } from 'date-fns';

interface UserReferral {
  id: string;
  deal_status: string | null;
  admin_notes: string | null;
  created_at: string;
  campaign_source: string | null;
}

interface ReferralsListProps {
  referrals: UserReferral[];
}

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case 'deal_closed':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Deal Closed</Badge>;
    case 'negotiating':
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">Negotiating</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">Registered</Badge>;
  }
};

const ReferralsList = ({ referrals }: ReferralsListProps) => {
  if (referrals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Referrals</CardTitle>
          <CardDescription>Track the progress of your referrals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No referrals yet. Share your link to get started!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Referrals</CardTitle>
        <CardDescription>Track the progress of your referrals</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[400px]">
          <div className="divide-y">
            {referrals.map((referral) => (
              <div key={referral.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {getStatusBadge(referral.deal_status)}
                  {referral.campaign_source && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Megaphone className="w-3 h-3" />
                      <span>{referral.campaign_source}</span>
                    </div>
                  )}
                </div>

                {referral.admin_notes && (
                  <div className="flex items-start gap-2 mt-2 p-3 bg-muted/50 rounded-lg">
                    <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">{referral.admin_notes}</p>
                  </div>
                )}

                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <CalendarDays className="w-3 h-3" />
                  <span>Referred: {format(new Date(referral.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ReferralsList;
