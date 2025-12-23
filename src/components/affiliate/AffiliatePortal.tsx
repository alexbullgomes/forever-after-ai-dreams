import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAffiliate } from "@/hooks/useAffiliate";
import { useAuth } from "@/contexts/AuthContext";
import { Copy, ExternalLink, Users, DollarSign, Edit, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AffiliatePortal = () => {
  const { user } = useAuth();
  const { affiliate, loading, createAffiliateAccount, getReferralUrl, updateReferralCode } = useAffiliate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [editedCode, setEditedCode] = useState("");

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

  const handleEditCode = () => {
    setEditedCode(affiliate?.referral_code || "");
    setIsEditingCode(true);
  };

  const handleSaveCode = async () => {
    const trimmedCode = editedCode.trim().toUpperCase();
    if (!trimmedCode) {
      toast({
        title: "Invalid code",
        description: "Referral code cannot be empty.",
        variant: "destructive"
      });
      return;
    }

    const success = await updateReferralCode(trimmedCode);
    if (success) {
      setIsEditingCode(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingCode(false);
    setEditedCode("");
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
                <Users className="w-8 h-8 mx-auto mb-2 text-brand-primary-from" />
                <h3 className="font-semibold">Refer Customers</h3>
                <p className="text-sm text-muted-foreground">Share your unique referral link</p>
              </div>
              <div className="text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-brand-primary-from" />
                <h3 className="font-semibold">Earn Commissions</h3>
                <p className="text-sm text-muted-foreground">Get paid for successful referrals</p>
              </div>
              <div className="text-center">
                <ExternalLink className="w-8 h-8 mx-auto mb-2 text-brand-primary-from" />
                <h3 className="font-semibold">Track Progress</h3>
                <p className="text-sm text-muted-foreground">Monitor your referral stats</p>
              </div>
            </div>
            
            <Button 
              onClick={createAffiliateAccount}
              className="w-full bg-brand-gradient hover:bg-brand-gradient-hover"
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
              {!isEditingCode ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-lg px-3 py-1 font-mono">
                    {affiliate.referral_code}
                  </Badge>
                  <Button
                    onClick={handleEditCode}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedCode}
                    onChange={(e) => setEditedCode(e.target.value.toUpperCase())}
                    placeholder="Enter new code"
                    className="font-mono max-w-[200px]"
                    maxLength={20}
                  />
                  <Button
                    onClick={handleSaveCode}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-success hover:text-success/80"
                    disabled={loading}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-error hover:text-error/80"
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2">Total Referrals</h3>
              <div className="text-3xl font-bold text-brand-primary-from">
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
              className={copied ? "text-success" : ""}
            >
              <Copy className="w-4 h-4" />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            When someone visits this link and fills out a form or registers, you'll earn a commission.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AffiliatePortal;