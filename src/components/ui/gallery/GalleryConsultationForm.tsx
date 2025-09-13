import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, MapPin, Phone } from 'lucide-react';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MediaItemType } from './types';

interface GalleryConsultationFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: MediaItemType;
}

const GalleryConsultationForm: React.FC<GalleryConsultationFormProps> = ({
  isOpen,
  onClose,
  selectedItem
}) => {
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      return [match[1], match[2], match[3]].filter(Boolean).join('-');
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const resetForm = () => {
    setPhone('');
    setCity('');
    setEventDate(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim() || !user) {
      toast({
        title: "Error",
        description: "Phone number is required and you must be logged in.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update user profile with form data
      const updateData: any = {
        user_number: phone,
        gallery_event: selectedItem.title
      };

      if (city.trim()) {
        updateData.event_city = city;
      }

      if (eventDate) {
        updateData.event_date = format(eventDate, 'yyyy-MM-dd');
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Send webhook notification
      const webhookUrl = 'https://agcreationmkt.cloud/webhook/8e26e595-d079-4d4b-8c15-a31824f98aed';
      
      const payload = {
        user_id: user.id,
        user_email: user.email,
        user_name: user.user_metadata?.full_name || user.email || 'Anonymous',
        event: 'gallery_consultation_request',
        gallery_item_title: selectedItem.title,
        gallery_item_type: selectedItem.type,
        phone_number: phone,
        city: city || 'Not provided',
        event_date: eventDate ? format(eventDate, 'yyyy-MM-dd') : 'Not provided',
        timestamp: new Date().toISOString(),
        source: 'Gallery Like Button'
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      toast({
        title: "Request Submitted!",
        description: "Thank you! We'll contact you soon to discuss your event.",
      });

      resetForm();
      onClose();
    } catch (error) {
      console.error('Error submitting consultation request:', error);
      toast({
        title: "Error",
        description: "Failed to submit your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
      <DialogContent className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full max-w-md p-0 bg-white rounded-2xl shadow-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 pr-8">
              {selectedItem.title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Request a Quotation or Book a Free Consultation.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline w-4 h-4 mr-1" />
                Phone Number *
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="123-456-7890"
                required
                className="w-full focus:ring-2 focus:ring-rose-500 focus:border-rose-500 rounded-lg"
                autoComplete="tel"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline w-4 h-4 mr-1" />
                City (Optional)
              </label>
              <Input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter your city"
                className="w-full focus:ring-2 focus:ring-rose-500 focus:border-rose-500 rounded-lg"
              />
            </div>

            {/* Event Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Event Date (Optional)
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal rounded-lg hover:bg-gray-50"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {eventDate ? format(eventDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={eventDate}
                    onSelect={setEventDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || !phone.trim()}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  'Request Quotation'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default GalleryConsultationForm;