import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Circle, Clock, CreditCard, CalendarDays, Package } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type PipelineStatus = 
  | 'New Lead & Negotiation'
  | 'Closed Deal & Pre-Production'
  | 'Production'
  | 'Post-Production (Editing)'
  | 'Delivery & Finalization';

interface ProfileData {
  pipeline_profile: string | null;
  pipeline_status: string | null;
  updated_at: string;
}

interface Step {
  id: number;
  title: string;
  status: PipelineStatus;
}

const STEPS: Step[] = [
  { id: 1, title: 'Negotiation', status: 'New Lead & Negotiation' },
  { id: 2, title: 'Pre-Production', status: 'Closed Deal & Pre-Production' },
  { id: 3, title: 'Production', status: 'Production' },
  { id: 4, title: 'Post-Production', status: 'Post-Production (Editing)' },
  { id: 5, title: 'Delivered & Finalized', status: 'Delivery & Finalization' },
];

interface BookingDetails {
  id: string;
  event_date: string;
  amount_paid: number | null;
  status: string;
  stripe_payment_intent: string | null;
  product_title: string | null;
  package_title: string | null;
}

const ServiceTracking = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch profile and latest booking in parallel
        const [profileRes, bookingRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('pipeline_profile, pipeline_status, updated_at')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('bookings')
            .select('id, event_date, amount_paid, status, stripe_payment_intent, product_id, package_id')
            .eq('user_id', user.id)
            .eq('status', 'confirmed')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (profileRes.error) throw profileRes.error;
        setProfile(profileRes.data);

        if (bookingRes.data) {
          const b = bookingRes.data;
          let product_title: string | null = null;
          let package_title: string | null = null;

          if (b.product_id) {
            const { data: prod } = await supabase.from('products').select('title').eq('id', b.product_id).maybeSingle();
            product_title = prod?.title || null;
          }
          if (b.package_id) {
            const { data: pkg } = await supabase.from('campaign_packages').select('title').eq('id', b.package_id).maybeSingle();
            package_title = pkg?.title || null;
          }

          setBookingDetails({
            id: b.id,
            event_date: b.event_date,
            amount_paid: b.amount_paid as number | null,
            status: b.status,
            stripe_payment_intent: b.stripe_payment_intent,
            product_title,
            package_title,
          });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load tracking data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to real-time profile updates
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          setProfile(payload.new as ProfileData);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const getCurrentStepIndex = (): number => {
    if (!profile?.pipeline_status) return 0;
    const index = STEPS.findIndex(step => step.status === profile.pipeline_status);
    return index >= 0 ? index : 0;
  };

  const getStepState = (stepIndex: number): 'completed' | 'current' | 'pending' => {
    const currentIndex = getCurrentStepIndex();
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getProgressPercentage = (): number => {
    const currentIndex = getCurrentStepIndex();
    return ((currentIndex + 1) / STEPS.length) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary-from"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-error-light border border-error/20 rounded-lg p-6">
          <p className="text-error-text">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile || profile.pipeline_profile !== 'Enable') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-section-subtle border border-brand-primary-from/20 rounded-lg p-8 text-center">
          <Clock className="h-12 w-12 text-brand-primary-from/60 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-brand-gradient mb-2">
            Service Tracking Coming Soon
          </h2>
          <p className="text-foreground/80 mb-4">
            Tracking will appear here once your project is enabled.
          </p>
          <p className="text-sm text-muted-foreground">
            If you have questions, please contact our support team.
          </p>
        </div>
      </div>
    );
  }

  const serviceName = bookingDetails?.product_title || bookingDetails?.package_title || null;
  const formattedDate = bookingDetails?.event_date
    ? new Date(bookingDetails.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;
  const formattedAmount = bookingDetails?.amount_paid != null
    ? `$${(bookingDetails.amount_paid / 100).toFixed(2)}`
    : null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-gradient mb-2">
          Service Tracking
        </h1>
        <p className="text-muted-foreground">Track your project progress in real-time</p>
      </div>

      {/* Booked Service Card */}
      {bookingDetails && (
        <Card className="mb-6 border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-brand-primary-from" />
              <h2 className="text-lg font-semibold text-foreground">Your Booked Service</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {serviceName && (
                <div>
                  <p className="text-xs text-muted-foreground">Service</p>
                  <p className="font-medium text-foreground">{serviceName}</p>
                </div>
              )}
              {formattedDate && (
                <div className="flex items-start gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Event Date</p>
                    <p className="font-medium text-foreground">{formattedDate}</p>
                  </div>
                </div>
              )}
              {formattedAmount && (
                <div className="flex items-start gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Amount Paid</p>
                    <p className="font-medium text-foreground">{formattedAmount}</p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant="outline" className="mt-0.5 capitalize">{bookingDetails.status}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Booking ID</p>
                <p className="font-mono text-xs text-muted-foreground">{bookingDetails.id.slice(0, 8)}...</p>
              </div>
              {bookingDetails.stripe_payment_intent && (
                <div>
                  <p className="text-xs text-muted-foreground">Payment Reference</p>
                  <p className="font-mono text-xs text-muted-foreground">{bookingDetails.stripe_payment_intent}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-card rounded-lg border border-border p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={getProgressPercentage()} className="h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {STEPS.map((step, index) => {
            const state = getStepState(index);
            return (
              <div
                key={step.id}
                className={`flex items-start gap-4 p-4 rounded-lg transition-all ${
                  state === 'current'
                    ? 'bg-section-subtle border-2 border-brand-primary-from/50'
                    : state === 'completed'
                    ? 'bg-muted border border-border'
                    : 'bg-card border border-border'
                }`}
              >
                <div className="flex-shrink-0">
                  {state === 'completed' ? (
                    <CheckCircle className="h-8 w-8 text-rose-500" />
                  ) : state === 'current' ? (
                    <div className="relative">
                      <Circle className="h-8 w-8 text-rose-500 fill-rose-100" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-3 w-3 bg-rose-500 rounded-full animate-pulse" />
                      </div>
                    </div>
                  ) : (
                    <Circle className="h-8 w-8 text-gray-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-lg font-semibold mb-1 ${
                      state === 'current'
                        ? 'text-brand-gradient'
                        : state === 'completed'
                        ? 'text-foreground/80'
                        : 'text-neutral-400'
                    }`}
                  >
                    {step.id}. {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {state === 'completed' ? (
                      <span className="text-success font-medium">✓ Completed</span>
                    ) : state === 'current' ? (
                      <span className="text-brand-primary-from font-medium">In Progress</span>
                    ) : (
                      <span className="text-neutral-400">Pending</span>
                    )}
                  </p>
                  {state === 'current' && profile.updated_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last updated: {new Date(profile.updated_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            Your project status updates automatically. Contact us if you have any questions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServiceTracking;
