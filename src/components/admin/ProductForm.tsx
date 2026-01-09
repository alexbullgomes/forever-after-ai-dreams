import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { slugify } from "@/utils/slugify";
import type { Product } from "@/hooks/useProducts";

const productSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  currency: z.string().default("USD"),
  price_unit: z.string().default("per night"),
  description: z.string().optional(),
  image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  video_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  coverage_text: z.string().optional(),
  deliverable_text: z.string().optional(),
  is_highlighted: z.boolean().default(false),
  highlight_label: z.string().optional(),
  cta_text: z.string().default("Reserve"),
  cta_link: z.string().optional(),
  is_active: z.boolean().default(true),
  show_in_our_products: z.boolean().default(true),
  sort_order: z.coerce.number().default(0),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSubmit: (data: Partial<Product>) => Promise<void>;
}

export function ProductForm({ open, onOpenChange, product, onSubmit }: ProductFormProps) {
  const isEditing = !!product;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      slug: "",
      price: 0,
      currency: "USD",
      price_unit: "per night",
      description: "",
      image_url: "",
      video_url: "",
      coverage_text: "",
      deliverable_text: "",
      is_highlighted: false,
      highlight_label: "",
      cta_text: "Reserve",
      cta_link: "",
      is_active: true,
      show_in_our_products: true,
      sort_order: 0,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        title: product.title,
        slug: product.slug || "",
        price: product.price,
        currency: product.currency,
        price_unit: product.price_unit,
        description: product.description || "",
        image_url: product.image_url || "",
        video_url: product.video_url || "",
        coverage_text: product.coverage_text || "",
        deliverable_text: product.deliverable_text || "",
        is_highlighted: product.is_highlighted,
        highlight_label: product.highlight_label || "",
        cta_text: product.cta_text,
        cta_link: product.cta_link || "",
        is_active: product.is_active,
        show_in_our_products: product.show_in_our_products,
        sort_order: product.sort_order,
      });
    } else {
      form.reset({
        title: "",
        slug: "",
        price: 0,
        currency: "USD",
        price_unit: "per night",
        description: "",
        image_url: "",
        video_url: "",
        coverage_text: "",
        deliverable_text: "",
        is_highlighted: false,
        highlight_label: "",
        cta_text: "Reserve",
        cta_link: "",
        is_active: true,
        show_in_our_products: true,
        sort_order: 0,
      });
    }
  }, [product, form]);

  const handleSubmit = async (values: ProductFormValues) => {
    const slug = values.slug || slugify(values.title);
    await onSubmit({
      ...values,
      slug,
      image_url: values.image_url || null,
      video_url: values.video_url || null,
      description: values.description || null,
      coverage_text: values.coverage_text || null,
      deliverable_text: values.deliverable_text || null,
      highlight_label: values.highlight_label || null,
      cta_link: values.cta_link || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Product" : "Create Product"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Iceland Cabin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug (auto-generated if empty)</FormLabel>
                    <FormControl>
                      <Input placeholder="iceland-cabin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="680" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input placeholder="USD" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="per night" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your product..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="video_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video URL (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://...mp4 or .webm" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    If provided, video will play instead of image. Supports MP4 and WebM.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="coverage_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coverage</FormLabel>
                    <FormControl>
                      <Input placeholder="40min / 2hrs / Half Day" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deliverable_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deliverable</FormLabel>
                    <FormControl>
                      <Input placeholder="25 Photos / 1-min video" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Highlight Section */}
            <div className="rounded-lg border p-4 space-y-4">
              <FormField
                control={form.control}
                name="is_highlighted"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel className="text-base font-medium">Highlight this product</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("is_highlighted") && (
                <FormField
                  control={form.control}
                  name="highlight_label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Highlight Label</FormLabel>
                      <FormControl>
                        <Input placeholder="Special Deal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cta_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CTA Button Text</FormLabel>
                    <FormControl>
                      <Input placeholder="Reserve" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cta_link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CTA Link (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="/booking or https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort Order</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="show_in_our_products"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="text-base">Show in Our Products</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{isEditing ? "Save Changes" : "Create Product"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
