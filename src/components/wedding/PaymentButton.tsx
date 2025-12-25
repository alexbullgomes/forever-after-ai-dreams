import { useState } from "react";
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

interface PaymentButtonProps {
  packageName: string;
  packagePrice: string;
  className?: string;
}

const PaymentButton = ({ packageName, packagePrice, className }: PaymentButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  const handlePayment = async (paymentType: "deposit" | "full") => {
    setIsLoading(true);
    setShowPaymentOptions(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in to make a payment");
        setIsLoading(false);
        return;
      }

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
