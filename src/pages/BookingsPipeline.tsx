import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAvailabilityComputation, SlotAvailability } from '@/hooks/useAvailabilityComputation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { CalendarIcon, Eye, RefreshCw, UserCheck, XCircle, User } from 'lucide-react';
import { UserProfileModal } from '@/components/dashboard/UserProfileModal';
import { AvailabilityOverrideModal } from '@/components/availability/AvailabilityOverrideModal';
import { AvailabilityStatusBadge, AvailabilityStatus } from '@/components/availability/AvailabilityStatusBadge';
import { cn } from '@/lib/utils';

interface BookingRequest {
  id: string;
  created_at: string;
  updated_at: string;
  product_id: string;
  user_id: string | null;
  visitor_id: string | null;
  event_date: string;
  timezone: string;
  stage: string;
  offer_expires_at: string;
  availability_version: string;
  selected_time: string | null;
  last_seen_at: string;
  stripe_checkout_session_id: string | null;
  campaign_id: string | null;
  package_id: string | null;
  products?: { title: string; price: number } | null;
  campaign_packages?: { title: string; minimum_deposit_cents: number } | null;
}

const STAGE_OPTIONS = [
  { value: 'all', label: 'All Stages' },
  { value: 'date_selected', label: 'Date Selected' },
  { value: 'time_selected', label: 'Time Selected' },
  { value: 'checkout_started', label: 'Checkout Started' },
  { value: 'paid', label: 'Paid' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STAGE_COLORS: Record<string, string> = {
  date_selected: 'bg-blue-100 text-blue-800',
  time_selected: 'bg-indigo-100 text-indigo-800',
  checkout_started: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  contacted: 'bg-purple-100 text-purple-800',
  expired: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function BookingsPipeline() {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, SlotAvailability>>({});
  const [overrideModalBooking, setOverrideModalBooking] = useState<BookingRequest | null>(null);
  const { toast } = useToast();
  const { getSlotAvailability } = useAvailabilityComputation();

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('booking_requests')
        .select(`
          *,
          products:product_id (title, price),
          campaign_packages:package_id (title, minimum_deposit_cents)
        `)
        .order('created_at', { ascending: false });

      if (stageFilter !== 'all') {
        query = query.eq('stage', stageFilter);
      }

      if (dateRange.from) {
        query = query.gte('event_date', format(dateRange.from, 'yyyy-MM-dd'));
      }
      if (dateRange.to) {
        query = query.lte('event_date', format(dateRange.to, 'yyyy-MM-dd'));
      }

      const { data, error } = await query;

      if (error) throw error;
      setBookings(data || []);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch booking requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [stageFilter, dateRange]);

  // Compute availability for each booking
  const computeAvailabilities = useCallback(async (bookingList: BookingRequest[]) => {
    const newMap: Record<string, SlotAvailability> = {};
    
    for (const booking of bookingList) {
      if (!booking.product_id) {
        newMap[booking.id] = {
          status: 'needs_review',
          reason: 'Missing product_id',
          capacity: 0,
          used: 0,
          override_applied: false,
        };
        continue;
      }

      if (booking.selected_time) {
        const [hours, minutes] = booking.selected_time.split(':').map(Number);
        const slotStart = new Date(booking.event_date);
        slotStart.setHours(hours, minutes, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(slotEnd.getHours() + 1);

        const availability = await getSlotAvailability(booking.product_id, slotStart, slotEnd);
        newMap[booking.id] = availability;
      } else {
        // No time selected - check day availability
        newMap[booking.id] = {
          status: 'needs_review',
          reason: 'No time selected',
          capacity: 0,
          used: 0,
          override_applied: false,
        };
      }
    }

    setAvailabilityMap(newMap);
  }, [getSlotAvailability]);

  useEffect(() => {
    if (bookings.length > 0) {
      computeAvailabilities(bookings);
    }
  }, [bookings, computeAvailabilities]);

  const updateStage = async (id: string, newStage: string) => {
    try {
      const { error } = await supabase
        .from('booking_requests')
        .update({ stage: newStage })
        .eq('id', id);

      if (error) throw error;

      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, stage: newStage } : b))
      );

      toast({ title: 'Stage updated' });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const releaseHold = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('booking_slot_holds')
        .update({ status: 'released' })
        .eq('booking_request_id', bookingId)
        .eq('status', 'active');

      if (error) throw error;

      toast({ title: 'Hold released' });
      fetchBookings();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      b.visitor_id?.toLowerCase().includes(query) ||
      b.user_id?.toLowerCase().includes(query) ||
      b.products?.title?.toLowerCase().includes(query) ||
      b.campaign_packages?.title?.toLowerCase().includes(query)
    );
  });

  const formatTime = (time: string | null) => {
    if (!time) return '-';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bookings Pipeline</h1>
        <Button onClick={fetchBookings} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search by visitor/user ID or product..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />

        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by stage" />
          </SelectTrigger>
          <SelectContent>
            {STAGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'LLL dd')} - {format(dateRange.to, 'LLL dd')}
                  </>
                ) : (
                  format(dateRange.from, 'LLL dd, y')
                )
              ) : (
                'Filter by event date'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
              initialFocus
            />
            {(dateRange.from || dateRange.to) && (
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                >
                  Clear dates
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No booking requests found
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                <TableCell className="font-medium">
                    {(() => {
                      const [year, month, day] = booking.event_date.split('-').map(Number);
                      return format(new Date(year, month - 1, day), 'MMM d, yyyy');
                    })()}
                  </TableCell>
                  <TableCell>{formatTime(booking.selected_time)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {booking.products?.title || booking.campaign_packages?.title || 'Unknown'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.products?.price
                          ? `$${booking.products.price.toLocaleString()}`
                          : booking.campaign_packages?.minimum_deposit_cents
                            ? `$${(booking.campaign_packages.minimum_deposit_cents / 100).toLocaleString()}`
                            : '$-'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {booking.user_id ? (
                        <button
                          onClick={() => setSelectedUserId(booking.user_id)}
                          className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:underline cursor-pointer"
                        >
                          <User className="h-3 w-3" />
                          User
                        </button>
                      ) : (
                        <span className="text-muted-foreground">Guest</span>
                      )}
                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {booking.user_id || booking.visitor_id}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('font-normal', STAGE_COLORS[booking.stage])}>
                      {booking.stage.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const availability = availabilityMap[booking.id];
                      const status = (availability?.status || 'needs_review') as AvailabilityStatus;
                      const reason = availability?.reason || 'Computing...';
                      
                      return (
                        <AvailabilityStatusBadge
                          status={status}
                          reason={reason}
                          onClick={() => {
                            if (booking.product_id) {
                              setOverrideModalBooking(booking);
                            } else {
                              toast({
                                title: 'Cannot manage availability',
                                description: 'This booking has no product assigned',
                                variant: 'destructive',
                              });
                            }
                          }}
                        />
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(booking.created_at), 'MMM d, HH:mm')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateStage(booking.id, 'contacted')}
                        title="Mark as contacted"
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      {booking.stage === 'checkout_started' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => releaseHold(booking.id)}
                          title="Release hold"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking Request Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Event Date</p>
                  <p className="font-medium">
                    {(() => {
                      const [year, month, day] = selectedBooking.event_date.split('-').map(Number);
                      return format(new Date(year, month - 1, day), 'MMMM d, yyyy');
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Selected Time</p>
                  <p className="font-medium">{formatTime(selectedBooking.selected_time)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Product</p>
                  <p className="font-medium">
                    {selectedBooking.products?.title || selectedBooking.campaign_packages?.title || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Price</p>
                  <p className="font-medium">
                    {selectedBooking.products?.price
                      ? `$${selectedBooking.products.price.toLocaleString()}`
                      : selectedBooking.campaign_packages?.minimum_deposit_cents
                        ? `$${(selectedBooking.campaign_packages.minimum_deposit_cents / 100).toLocaleString()}`
                        : '$-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Timezone</p>
                  <p className="font-medium">{selectedBooking.timezone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Availability</p>
                  {(() => {
                    const availability = availabilityMap[selectedBooking.id];
                    const status = (availability?.status || 'needs_review') as AvailabilityStatus;
                    return (
                      <AvailabilityStatusBadge
                        status={status}
                        reason={availability?.reason}
                      />
                    );
                  })()}
                </div>
                <div>
                  <p className="text-muted-foreground">Customer Type</p>
                  <p className="font-medium">{selectedBooking.user_id ? 'Registered User' : 'Guest'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Customer ID</p>
                  <p className="font-medium text-xs break-all">
                    {selectedBooking.user_id || selectedBooking.visitor_id}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Offer Expires</p>
                  <p className="font-medium">
                    {format(new Date(selectedBooking.offer_expires_at), 'MMM d, HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Seen</p>
                  <p className="font-medium">
                    {format(new Date(selectedBooking.last_seen_at), 'MMM d, HH:mm')}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-muted-foreground text-sm mb-2">Update Stage</p>
                <Select
                  value={selectedBooking.stage}
                  onValueChange={(val) => {
                    updateStage(selectedBooking.id, val);
                    setSelectedBooking({ ...selectedBooking, stage: val });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_OPTIONS.filter((o) => o.value !== 'all').map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        customerId={selectedUserId || ''}
      />

      {/* Availability Override Modal */}
      {overrideModalBooking && overrideModalBooking.product_id && (
        <AvailabilityOverrideModal
          isOpen={!!overrideModalBooking}
          onClose={() => setOverrideModalBooking(null)}
          productId={overrideModalBooking.product_id}
          date={new Date(overrideModalBooking.event_date)}
          onSaved={() => {
            computeAvailabilities(bookings);
          }}
        />
      )}
    </div>
  );
}
