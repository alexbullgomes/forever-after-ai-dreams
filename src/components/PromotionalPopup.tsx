import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Sun } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface PromotionalPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const PromotionalPopup = ({ isOpen, onClose }: PromotionalPopupProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number to claim the offer",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch("https://agcreationmkt.cloud/webhook-test/0fe48135-df84-4d58-8998-11a3aafb23b7", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          userEmail: user?.email,
          userId: user?.id,
          offer: "30% off summer photo & video packages",
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Your 30% discount offer has been claimed! We'll contact you soon.",
        });
        onClose();
      } else {
        throw new Error("Failed to submit offer");
      }
    } catch (error) {
      console.error("Error submitting offer:", error);
      toast({
        title: "Error",
        description: "Failed to claim offer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0">
        <div className="bg-gradient-to-br from-rose-500 to-pink-500 p-6 text-white">
          <DialogHeader>
            <div className="flex items-center justify-center mb-2">
              <div className="flex items-center space-x-2">
                <Sun className="w-8 h-8 text-white" />
                <Heart className="w-6 h-6 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl font-bold">
              ☀️ Summer Special — 30% Off!
            </DialogTitle>
            <p className="text-center text-rose-100 text-sm">
              Get 30% off all summer photo & video bookings.
              <br />
              Just enter your phone number to claim the offer:
            </p>
          </DialogHeader>
        </div>

        <div className="p-6">
          <Card className="border-0 shadow-none">
            <CardContent className="space-y-6 p-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    📱 Phone Number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full"
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-3 rounded-lg transition-all duration-200"
                >
                  {loading ? "Claiming..." : "Get My 30% Off"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionalPopup;