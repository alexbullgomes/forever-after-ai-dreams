import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Calendar, MessageCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const packageName = searchParams.get("package") || "Wedding Package";

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

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
              <p className="text-sm text-muted-foreground">Package Selected</p>
              <p className="text-lg font-semibold text-foreground">{packageName}</p>
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
                onClick={() => navigate("/services")}
                className="w-full h-12 bg-brand-gradient hover:opacity-90 text-white font-semibold"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Chat with Our Planner
              </Button>
              
              <Button
                onClick={() => navigate("/wedding-packages")}
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
