import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

interface PendingPayment {
  packageName: string;
  packagePrice: string;
  paymentType: "deposit" | "full";
  timestamp: number;
}

interface PaymentButtonProps {
  packageName: string;
  packagePrice: string;
  className?: string;
  onAuthRequired?: () => void;
}

const PENDING_PAYMENT_KEY = "pendingPayment";
const PAYMENT_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

const PaymentButton = ({ packageName, packagePrice, className, onAuthRequired }: PaymentButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const { user } = useAuth();

  // Check for pending payment after authentication
  useEffect(() => {
    const processPendingPayment = async () => {
      if (!user) return;

      const stored = localStorage.getItem(PENDING_PAYMENT_KEY);
      if (!stored) return;

      try {
        const pendingPayment: PendingPayment = JSON.parse(stored);
        
        // Check if payment is expired
        if (Date.now() - pendingPayment.timestamp > PAYMENT_EXPIRY_MS) {
          localStorage.removeItem(PENDING_PAYMENT_KEY);
          return;
        }

        // Only process if it matches this button's package
        if (pendingPayment.packageName !== packageName) return;

        // Clear pending payment first to prevent duplicate processing
        localStorage.removeItem(PENDING_PAYMENT_KEY);

        // Show loading and process payment
        setIsLoading(true);
        toast.info("Resuming your booking...");
        
        await executePayment(pendingPayment.paymentType);
      } catch (error) {
        console.error("Error processing pending payment:", error);
        localStorage.removeItem(PENDING_PAYMENT_KEY);
      }
    };

    processPendingPayment();
  }, [user, packageName]);

  const executePayment = async (paymentType: "deposit" | "full") => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          packageName,
          packagePrice,
          paymentType,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Open Stripe Checkout in new tab
        window.open(data.url, "_blank");
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initiate payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async (paymentType: "deposit" | "full") => {
    setIsLoading(true);
    setShowPaymentOptions(false);

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Store pending payment intent
      const pendingPayment: PendingPayment = {
        packageName,
        packagePrice,
        paymentType,
        timestamp: Date.now(),
      };
      localStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(pendingPayment));
      
      setIsLoading(false);
      
      // Trigger auth modal
      if (onAuthRequired) {
        onAuthRequired();
        toast.info("Please sign in to complete your booking");
      } else {
        toast.error("Please sign in to make a payment");
      }
      return;
    }

    await executePayment(paymentType);
  };

  return (
    <>
      <Button
        onClick={() => setShowPaymentOptions(true)}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <CreditCard className="w-5 h-5 mr-2" />
        )}
        {isLoading ? "Processing..." : "Secure Your Booking"}
      </Button>

      <Dialog open={showPaymentOptions} onOpenChange={setShowPaymentOptions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Payment Option</DialogTitle>
            <DialogDescription>
              Secure your {packageName} booking
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Button
              onClick={() => handlePayment("deposit")}
              disabled={isLoading}
              className="w-full h-14 bg-brand-gradient hover:opacity-90 text-white"
            >
              <div className="flex flex-col items-center">
                <span className="font-semibold">Pay $500 Deposit</span>
                <span className="text-xs opacity-90">Secure your date now</span>
              </div>
            </Button>

            <Button
              onClick={() => handlePayment("full")}
              disabled={isLoading}
              variant="outline"
              className="w-full h-14 border-2"
            >
              <div className="flex flex-col items-center">
                <span className="font-semibold">Pay Full Amount</span>
                <span className="text-xs text-muted-foreground">{packagePrice}</span>
              </div>
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Secure payment powered by Stripe. Your remaining balance will be due before the event.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PaymentButton;
