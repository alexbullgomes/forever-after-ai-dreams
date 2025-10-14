import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { usePromotionalPopupAdmin } from '@/hooks/usePromotionalPopupAdmin';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Database } from '@/integrations/supabase/types';

type PromotionalPopup = Database['public']['Tables']['promotional_popups']['Row'];

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  discount_label: z.string().min(1, 'Discount label is required'),
  cta_label: z.string().min(1, 'CTA label is required'),
  phone_required: z.boolean(),
  legal_note: z.string().optional(),
  icon: z.string().min(1, 'Icon is required'),
  bg_gradient: z.string().min(1, 'Background gradient is required'),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
  show_once_per_session: z.boolean(),
  countdown_hours: z.coerce.number().min(1).max(72),
  delay_seconds: z.coerce.number().min(0).max(300),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface PromotionalPopupFormProps {
  isOpen: boolean;
  onClose: () => void;
  popup?: PromotionalPopup | null;
}

const iconOptions = [
  { value: 'gift', label: 'Gift' },
  { value: 'heart', label: 'Heart' },
  { value: 'star', label: 'Star' },
  { value: 'zap', label: 'Zap' },
  { value: 'sparkles', label: 'Sparkles' },
  { value: 'tag', label: 'Tag' },
];

const gradientOptions = [
  { value: 'from-rose-500 to-pink-500', label: 'Rose to Pink' },
  { value: 'from-purple-500 to-pink-500', label: 'Purple to Pink' },
  { value: 'from-blue-500 to-purple-500', label: 'Blue to Purple' },
  { value: 'from-green-500 to-emerald-500', label: 'Green to Emerald' },
  { value: 'from-orange-500 to-red-500', label: 'Orange to Red' },
];

const PromotionalPopupForm = ({ isOpen, onClose, popup }: PromotionalPopupFormProps) => {
  const { createPopup, updatePopup } = usePromotionalPopupAdmin();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      discount_label: '20% OFF',
      cta_label: 'Claim My Discount',
      phone_required: true,
      legal_note: '',
      icon: 'gift',
      bg_gradient: 'from-rose-500 to-pink-500',
      start_at: '',
      end_at: '',
      show_once_per_session: true,
      countdown_hours: 12,
      delay_seconds: 30,
      is_active: false,
    },
  });

  useEffect(() => {
    if (popup) {
      form.reset({
        title: popup.title,
        subtitle: popup.subtitle || '',
        discount_label: popup.discount_label,
        cta_label: popup.cta_label,
        phone_required: popup.phone_required,
        legal_note: popup.legal_note || '',
        icon: popup.icon,
        bg_gradient: popup.bg_gradient,
        start_at: popup.start_at ? new Date(popup.start_at).toISOString().slice(0, 16) : '',
        end_at: popup.end_at ? new Date(popup.end_at).toISOString().slice(0, 16) : '',
        show_once_per_session: popup.show_once_per_session,
        countdown_hours: popup.countdown_hours,
        delay_seconds: popup.delay_seconds,
        is_active: popup.is_active,
      });
    } else {
      form.reset({
        title: '',
        subtitle: '',
        discount_label: '20% OFF',
        cta_label: 'Claim My Discount',
        phone_required: true,
        legal_note: '',
        icon: 'gift',
        bg_gradient: 'from-rose-500 to-pink-500',
        start_at: '',
        end_at: '',
        show_once_per_session: true,
        countdown_hours: 12,
        delay_seconds: 30,
        is_active: false,
      });
    }
  }, [popup, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const data: any = {
        title: values.title,
        subtitle: values.subtitle || null,
        discount_label: values.discount_label,
        cta_label: values.cta_label,
        phone_required: values.phone_required,
        legal_note: values.legal_note || null,
        icon: values.icon,
        bg_gradient: values.bg_gradient,
        show_once_per_session: values.show_once_per_session,
        countdown_hours: values.countdown_hours,
        delay_seconds: values.delay_seconds,
        is_active: values.is_active,
        start_at: values.start_at ? new Date(values.start_at).toISOString() : null,
        end_at: values.end_at ? new Date(values.end_at).toISOString() : null,
      };

      if (popup) {
        await updatePopup(popup.id, data);
      } else {
        await createPopup(data);
      }
      onClose();
    } catch (error) {
      console.error('Error saving popup:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{popup ? 'Edit' : 'Create'} Promotional Pop-Up</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Special Offer Just For You!" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtitle</FormLabel>
                  <FormControl>
                    <Input placeholder="Don't miss out on this exclusive deal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discount_label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Label *</FormLabel>
                    <FormControl>
                      <Input placeholder="20% OFF" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cta_label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CTA Button Text *</FormLabel>
                    <FormControl>
                      <Input placeholder="Claim My Discount" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="legal_note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Legal Note</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Valid on first purchase only. Offer expires in 24 hours." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {iconOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bg_gradient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Background Gradient *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {gradientOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="delay_seconds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delay (seconds) *</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="300" {...field} />
                    </FormControl>
                    <FormDescription>How long to wait before showing popup</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="countdown_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Countdown (hours) *</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="72" {...field} />
                    </FormControl>
                    <FormDescription>Countdown timer duration</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="phone_required"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Require Phone Number</FormLabel>
                      <FormDescription>Ask users for their phone number</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="show_once_per_session"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Show Once Per Session</FormLabel>
                      <FormDescription>Only show popup once per browser session</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>Enable this popup on your website</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-rose-500 to-pink-500">
                {isSubmitting ? 'Saving...' : popup ? 'Update' : 'Create'} Pop-Up
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionalPopupForm;
