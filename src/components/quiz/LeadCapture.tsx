
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Sparkles } from "lucide-react";
import { UserLead } from "@/pages/WeddingQuiz";

interface LeadCaptureProps {
  onSubmit: (lead: UserLead) => void;
}

const LeadCapture = ({ onSubmit }: LeadCaptureProps) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    weddingDate: ""
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        fullName: formData.fullName,
        email: formData.email,
        weddingDate: formData.weddingDate || undefined
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
      <div className="max-w-md mx-auto w-full">
        <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 p-3 rounded-full bg-gradient-to-r from-rose-500 to-purple-500">
              <Heart className="w-full h-full text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Almost There! 
            </h2>
            <p className="text-gray-600">
              Let's personalize your wedding package recommendation
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="fullName" className="text-base font-medium">
                Full Name *
              </Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                className="mt-1"
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="text-base font-medium">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="mt-1"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="weddingDate" className="text-base font-medium">
                Wedding Date (Optional)
              </Label>
              <Input
                id="weddingDate"
                type="date"
                value={formData.weddingDate}
                onChange={(e) => handleInputChange("weddingDate", e.target.value)}
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Get My Recommendation
            </Button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            We respect your privacy. No spam, ever.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default LeadCapture;
