import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, MessageCircle, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface BookingInfo {
  packageName: string;
  eventDate: string | null;
  amountPaid: number | null;
}

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const fallbackName = searchParams.get("package") || "Your Package";
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(!!sessionId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    let attempts = 0;
    const maxAttempts = 6;

    const fetchBooking = async () => {
      // Query bookings by stripe_checkout_session_id
      const { data, error } = await supabase
        .from('bookings')
        .select('id, event_date, amount_paid, product_id, package_id')
        .filter('stripe_checkout_session_id', 'eq', sessionId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching booking:', error);
      }

      if (data) {
        let name = fallbackName;
        if (data.product_id) {
          const { data: prod } = await supabase.from('products').select('title').eq('id', data.product_id).maybeSingle();
          if (prod?.title) name = prod.title;
        } else if (data.package_id) {
          const { data: pkg } = await supabase.from('campaign_packages').select('title').eq('id', data.package_id).maybeSingle();
          if (pkg?.title) name = pkg.title;
        }
        setBooking({
          packageName: name,
          eventDate: data.event_date,
          amountPaid: data.amount_paid as number | null,
        });
        setLoading(false);
        return;
      }

      attempts++;
      if (attempts < maxAttempts) {
        // Retry — webhook may still be processing
        setTimeout(fetchBooking, 2000);
      } else {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [sessionId, fallbackName]);

  const displayName = booking?.packageName || fallbackName;
  const displayDate = booking?.eventDate
    ? new Date(booking.eventDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;
  const displayAmount = booking?.amountPaid != null
    ? `$${(booking.amountPaid / 100).toFixed(2)}`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </motion.div>
            <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
              Payment Successful!
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Thank you for booking with EverAfter
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-rose-50 rounded-lg p-4 text-center">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-1">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading booking details...</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Package Selected</p>
                  <p className="text-lg font-semibold text-foreground">{displayName}</p>
                  {displayDate && (
                    <p className="text-sm text-muted-foreground mt-1">Event Date: {displayDate}</p>
                  )}
                  {displayAmount && (
                    <p className="text-sm text-muted-foreground">Amount Paid: {displayAmount}</p>
                  )}
                </>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">What happens next?</h3>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-brand-gradient rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Confirmation Email</p>
                  <p className="text-sm text-muted-foreground">
                    You'll receive a confirmation email with your receipt and booking details.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-brand-gradient rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Personal Consultation</p>
                  <p className="text-sm text-muted-foreground">
                    Our team will contact you within 24 hours to schedule your consultation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-brand-gradient rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Plan Your Vision</p>
                  <p className="text-sm text-muted-foreground">
                    We'll work together to customize your package and capture your perfect day.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Button
                onClick={() => navigate("/user-dashboard/ai-assistant")}
                className="w-full h-12 bg-brand-gradient hover:opacity-90 text-white font-semibold"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Chat with Our Planner
              </Button>
              
              <Button
                onClick={() => navigate("/user-dashboard/service-tracking")}
                variant="outline"
                className="w-full h-12"
              >
                View Your Booking
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
