import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAffiliateAnalytics } from '@/hooks/useAffiliateAnalytics';
import { useToast } from '@/hooks/use-toast';
import { Users, DollarSign, TrendingUp, CheckCircle2, Clock, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const AffiliateAnalytics = () => {
  const { 
    affiliates, 
    referrals, 
    stats, 
    loading, 
    refetch,
    updateReferralStatus,
    markCommissionPaid 
  } = useAffiliateAnalytics();
  const { toast } = useToast();
  
  const [selectedReferral, setSelectedReferral] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    deal_status: 'registered',
    commission_amount: 0,
    admin_notes: ''
  });

  const handleEditReferral = (referral: any) => {
    setSelectedReferral(referral.id);
    setEditData({
      deal_status: referral.deal_status || 'registered',
      commission_amount: referral.commission_amount || 0,
      admin_notes: referral.admin_notes || ''
    });
    setEditDialogOpen(true);
  };

  const handleSaveReferral = async () => {
    if (!selectedReferral) return;

    const success = await updateReferralStatus(selectedReferral, {
      deal_status: editData.deal_status,
      commission_amount: editData.commission_amount,
      admin_notes: editData.admin_notes
    });

    if (success) {
      toast({
        title: 'Referral Updated',
        description: 'The referral has been updated successfully.',
      });
      setEditDialogOpen(false);
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update referral.',
        variant: 'destructive'
      });
    }
  };

  const handleMarkPaid = async (referralId: string) => {
    const success = await markCommissionPaid(referralId);
    if (success) {
      toast({
        title: 'Commission Marked as Paid',
        description: 'The commission has been marked as paid.',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to mark commission as paid.',
        variant: 'destructive'
      });
    }
  };

  const getDealStatusBadge = (status: string | null) => {
    switch (status) {
      case 'deal_closed':
        return <Badge className="bg-green-100 text-green-800">Deal Closed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Registered</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Affiliate Analytics</h1>
          <p className="text-muted-foreground">Monitor affiliate performance and manage commissions</p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAffiliates}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeAffiliates} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.dealsClosed} deals closed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Commissions</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.pendingCommissions.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid Commissions</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.paidCommissions.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Affiliates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Affiliates</CardTitle>
          <CardDescription>All registered affiliates and their performance</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Affiliate</TableHead>
                <TableHead>Referral Code</TableHead>
                <TableHead className="text-center">Total Referrals</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {affiliates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No affiliates found
                  </TableCell>
                </TableRow>
              ) : (
                affiliates.map((affiliate) => (
                  <TableRow key={affiliate.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{affiliate.profile?.name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{affiliate.profile?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {affiliate.referral_code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {affiliate.total_referrals}
                    </TableCell>
                    <TableCell>
                      <Badge variant={affiliate.is_active ? 'default' : 'secondary'}>
                        {affiliate.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(affiliate.created_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Referrals</CardTitle>
          <CardDescription>All referral conversions and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referred User</TableHead>
                <TableHead>Affiliate</TableHead>
                <TableHead>Campaign Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No referrals found
                  </TableCell>
                </TableRow>
              ) : (
                referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {referral.referred_user?.name || 'Anonymous'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {referral.referred_user?.email || referral.visitor_id?.slice(0, 8) + '...'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {referral.affiliate?.profile?.name || 'Unknown'}
                        </div>
                        <Badge variant="outline" className="font-mono text-xs">
                          {referral.referral_code}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {referral.campaign_source || 'homepage'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getDealStatusBadge(referral.deal_status)}
                    </TableCell>
                    <TableCell>
                      {referral.commission_amount ? (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">${referral.commission_amount}</span>
                          {referral.commission_paid_at ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(referral.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditReferral(referral)}
                        >
                          Edit
                        </Button>
                        {referral.deal_status === 'deal_closed' && 
                         referral.commission_amount && 
                         !referral.commission_paid_at && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkPaid(referral.id)}
                          >
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Referral</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Deal Status</label>
              <Select 
                value={editData.deal_status} 
                onValueChange={(value) => setEditData({ ...editData, deal_status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="registered">Registered</SelectItem>
                  <SelectItem value="deal_closed">Deal Closed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Commission Amount ($)</label>
              <Input
                type="number"
                value={editData.commission_amount}
                onChange={(e) => setEditData({ 
                  ...editData, 
                  commission_amount: parseFloat(e.target.value) || 0 
                })}
                min={0}
                step={0.01}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Admin Notes</label>
              <Textarea
                value={editData.admin_notes}
                onChange={(e) => setEditData({ ...editData, admin_notes: e.target.value })}
                placeholder="Add notes about this referral..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveReferral}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AffiliateAnalytics;
