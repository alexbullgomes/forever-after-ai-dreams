import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAffiliate } from "@/hooks/useAffiliate";
import { useAuth } from "@/contexts/AuthContext";
import { Copy, ExternalLink, Users, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const AffiliatePortal = () => {
  const { user } = useAuth();
  const { affiliate, loading, createAffiliateAccount, getReferralUrl } = useAffiliate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Affiliate Program</CardTitle>
          <CardDescription>
            Please log in to access the affiliate program.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const copyReferralUrl = async () => {
    const url = getReferralUrl();
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral URL copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL to clipboard.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!affiliate) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Join Our Affiliate Program</CardTitle>
          <CardDescription>
            Start earning commissions by referring customers to our photography and videography services.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-rose-500" />
                <h3 className="font-semibold">Refer Customers</h3>
                <p className="text-sm text-gray-600">Share your unique referral link</p>
              </div>
              <div className="text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-rose-500" />
                <h3 className="font-semibold">Earn Commissions</h3>
                <p className="text-sm text-gray-600">Get paid for successful referrals</p>
              </div>
              <div className="text-center">
                <ExternalLink className="w-8 h-8 mx-auto mb-2 text-rose-500" />
                <h3 className="font-semibold">Track Progress</h3>
                <p className="text-sm text-gray-600">Monitor your referral stats</p>
              </div>
            </div>
            
            <Button 
              onClick={createAffiliateAccount}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
            >
              Create Affiliate Account
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Affiliate Dashboard
            <Badge variant={affiliate.is_active ? "default" : "secondary"}>
              {affiliate.is_active ? "Active" : "Inactive"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Track your referrals and manage your affiliate account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Your Referral Code</h3>
              <Badge variant="outline" className="text-lg px-3 py-1 font-mono">
                {affiliate.referral_code}
              </Badge>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Total Referrals</h3>
              <div className="text-3xl font-bold text-rose-500">
                {affiliate.total_referrals}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>
            Share this link to start earning commissions from referrals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={getReferralUrl()}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              onClick={copyReferralUrl}
              variant="outline"
              className={copied ? "text-green-600" : ""}
            >
              <Copy className="w-4 h-4" />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            When someone visits this link and fills out a form or registers, you'll earn a commission.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AffiliatePortal;