import { useEffect, useState } from "react";
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
import { isSupabaseLocalUrl } from "@/utils/productThumbnail";
import { AlertTriangle } from "lucide-react";
import type { Product } from "@/hooks/useProducts";

const productSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  currency: z.string().default("USD"),
  price_unit: z.string().default("per night"),
  description: z.string().optional(),
  thumb_image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  thumb_mp4_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  thumb_webm_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
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

function UrlWarning({ url }: { url: string }) {
  if (!url || isSupabaseLocalUrl(url)) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-amber-600 mt-1">
      <AlertTriangle className="h-3 w-3" />
      URL is not from Supabase Local Storage
    </p>
  );
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
      thumb_image_url: "",
      thumb_mp4_url: "",
      thumb_webm_url: "",
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
        thumb_image_url: product.thumb_image_url || product.image_url || "",
        thumb_mp4_url: product.thumb_mp4_url || "",
        thumb_webm_url: product.thumb_webm_url || "",
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
        thumb_image_url: "",
        thumb_mp4_url: "",
        thumb_webm_url: "",
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

  const watchThumbImage = form.watch("thumb_image_url");
  const watchThumbMp4 = form.watch("thumb_mp4_url");
  const watchThumbWebm = form.watch("thumb_webm_url");

  // Determine preview media
  const previewVideoUrl = watchThumbMp4 || watchThumbWebm || undefined;
  const previewImageUrl = watchThumbImage || "/placeholder.svg";
  const isVideoUrl = (url: string) => /\.(mp4|webm)$/i.test(url);
  const showVideoPreview = previewVideoUrl && isVideoUrl(previewVideoUrl);

  // Validation: at least one media URL must be present
  const hasAnyMedia = !!(watchThumbImage || watchThumbMp4 || watchThumbWebm);

  const handleSubmit = async (values: ProductFormValues) => {
    const slug = values.slug || slugify(values.title);
    
    // Auto-map thumb fields to legacy fields for backward compatibility
    const thumbImage = values.thumb_image_url || null;
    const thumbMp4 = values.thumb_mp4_url || null;
    const thumbWebm = values.thumb_webm_url || null;
    
    await onSubmit({
      ...values,
      slug,
      // New thumb fields
      thumb_image_url: thumbImage,
      thumb_mp4_url: thumbMp4,
      thumb_webm_url: thumbWebm,
      // Legacy fields mapped from thumb for backward compatibility
      image_url: thumbImage,
      video_url: thumbMp4 || thumbWebm || null,
      media_type: (thumbMp4 || thumbWebm) ? "video" : "image",
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

            {/* Product Media Section */}
            <div className="rounded-lg border p-4 space-y-4">
              <h3 className="font-medium text-sm text-foreground">Product Media</h3>
              <p className="text-xs text-muted-foreground">
                Provide media URLs from Supabase Local Storage. At least one field is required.
              </p>

              <FormField
                control={form.control}
                name="thumb_webm_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video WEBM URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://supabasestudio.agcreationmkt.cloud/storage/v1/object/public/..." {...field} />
                    </FormControl>
                    <UrlWarning url={field.value || ""} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="thumb_mp4_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video MP4 URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://supabasestudio.agcreationmkt.cloud/storage/v1/object/public/..." {...field} />
                    </FormControl>
                    <UrlWarning url={field.value || ""} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="thumb_image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (Fallback)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://supabasestudio.agcreationmkt.cloud/storage/v1/object/public/..." {...field} />
                    </FormControl>
                    <UrlWarning url={field.value || ""} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!hasAnyMedia && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  At least one media URL is required
                </p>
              )}

              {/* Live Preview */}
              {(watchThumbImage || watchThumbMp4 || watchThumbWebm) && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Preview:</p>
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                    {showVideoPreview ? (
                      <video
                        key={previewVideoUrl}
                        src={previewVideoUrl}
                        poster={watchThumbImage || undefined}
                        muted
                        autoPlay
                        loop
                        playsInline
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img
                        src={previewImageUrl}
                        alt="Product preview"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

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
