
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Heart, Sparkles, Clock, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface QuizConsultationFormProps {
  isOpen: boolean;
  onClose: () => void;
  packageName: string;
  packagePrice: string;
}

const QuizConsultationForm = ({ 
  isOpen, 
  onClose, 
  packageName, 
  packagePrice 
}: QuizConsultationFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60 * 1000); // 24 hours in milliseconds
  const [formData, setFormData] = useState({
    email: user?.email || '',
    phone: '',
    city: '',
    weddingDate: undefined as Date | undefined,
    budgetRange: '',
  });

  // Initialize countdown timer
  useEffect(() => {
    const timerKey = 'quiz_consultation_timer';
    const startTime = localStorage.getItem(timerKey);
    
    if (!startTime && isOpen) {
      // First time opening, start the timer
      const now = Date.now();
      localStorage.setItem(timerKey, now.toString());
      setTimeLeft(24 * 60 * 60 * 1000);
    } else if (startTime) {
      // Calculate remaining time
      const elapsed = Date.now() - parseInt(startTime);
      const remaining = Math.max(0, 24 * 60 * 60 * 1000 - elapsed);
      setTimeLeft(remaining);
    }
  }, [isOpen]);

  // Update countdown every second
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, timeLeft]);

  const formatTimeLeft = () => {
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.phone || !formData.city || !formData.weddingDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields to build your personalized package.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        userId: user?.id || null,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        weddingDate: format(formData.weddingDate, 'yyyy-MM-dd'),
        budgetRange: formData.budgetRange,
        packageName: packageName,
        packagePrice: packagePrice,
        discountOffer: '30% OFF',
        timeRemaining: formatTimeLeft(),
        timestamp: new Date().toISOString(),
        source: 'quiz_consultation_form_with_discount'
      };

      console.log('Sending quiz consultation request with discount offer:', payload);

      const response = await fetch('https://automation.agcreationmkt.com/webhook/bb88400e-5a7e-47a4-89a1-d8f7171f3238', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "Success! 🎉",
          description: `Your personalized ${packageName} package is being prepared! We'll contact you within 2 hours to secure your 30% discount.`,
        });
        
        // Reset form and close
        setFormData({
          email: user?.email || '',
          phone: '',
          city: '',
          weddingDate: undefined,
          budgetRange: '',
        });
        onClose();
      } else {
        throw new Error('Failed to submit consultation request');
      }
    } catch (error) {
      console.error('Error submitting consultation:', error);
      toast({
        title: "Submission Error",
        description: "There was an issue processing your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-4">
          {/* Heart Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          
          {/* Title */}
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
            Customize Your Dream Package — and Unlock up to 30% OFF
          </DialogTitle>

          {/* Countdown Timer */}
          {timeLeft > 0 && (
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg">
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-semibold">Your 30% OFF offer expires in: {formatTimeLeft()}</span>
              </div>
            </div>
          )}

          {/* Discount Badge */}
          <div className="flex justify-center gap-2">
            <Badge className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-3 py-1">
              <Zap className="w-3 h-3 mr-1" />
              UP TO 30% OFF
            </Badge>
            <Badge variant="outline" className="border-rose-300 text-rose-600">
              {packageName} - {packagePrice}
            </Badge>
          </div>

          {/* Subtext */}
          <p className="text-gray-600 text-sm leading-relaxed">
            Tell us a bit about your wedding so we can tailor the perfect Photo & Video bundle for you.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Confirm Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Cellphone *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 123-4567"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Los Angeles, CA"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Wedding Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.weddingDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.weddingDate ? (
                    format(formData.weddingDate, "PPP")
                  ) : (
                    <span>Pick your special date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.weddingDate}
                  onSelect={(date) => setFormData({ ...formData, weddingDate: date })}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget Range (Optional)</Label>
            <Select value={formData.budgetRange} onValueChange={(value) => setFormData({ ...formData, budgetRange: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select your budget range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2000-4000">$2,000 - $4,000</SelectItem>
                <SelectItem value="4000-6000">$4,000 - $6,000</SelectItem>
                <SelectItem value="6000-8000">$6,000 - $8,000</SelectItem>
                <SelectItem value="8000+">$8,000+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Maybe Later
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Build My Personalized Package
                </div>
              )}
            </Button>
          </div>

          {/* Copy under CTA */}
          <p className="text-center text-xs text-red-600 font-medium mt-2">
            Offer expires soon. Lock in your savings today.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuizConsultationForm;
