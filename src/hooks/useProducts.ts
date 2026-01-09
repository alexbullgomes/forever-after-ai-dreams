import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { slugify } from "@/utils/slugify";

export interface Product {
  id: string;
  title: string;
  slug: string | null;
  price: number;
  currency: string;
  price_unit: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  media_type: "image" | "video" | null;
  days: number;
  rating: number;
  coverage_text: string | null;
  deliverable_text: string | null;
  is_highlighted: boolean;
  highlight_label: string | null;
  cta_text: string;
  cta_link: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface UseProductsOptions {
  adminMode?: boolean;
}

export function useProducts(options: UseProductsOptions = {}) {
  const { adminMode = false } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // In admin mode, we rely on RLS to return all products for admins
      // In public mode, RLS only returns active products
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setProducts((data as Product[]) || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch products");
      setError(error);
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = async (data: Partial<Product>): Promise<Product | null> => {
    try {
      const slug = data.slug || slugify(data.title || "product");
      
      const { data: insertedData, error: insertError } = await supabase
        .from("products")
        .insert({
          ...data,
          slug,
          price: data.price || 0,
          title: data.title || "Untitled Product",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({ title: "Success", description: "Product created successfully" });
      await fetchProducts();
      return insertedData as Product;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to create product");
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    try {
      const { error: updateError } = await supabase
        .from("products")
        .update(data)
        .eq("id", id);

      if (updateError) throw updateError;

      toast({ title: "Success", description: "Product updated successfully" });
      await fetchProducts();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to update product");
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      toast({ title: "Success", description: "Product deleted successfully" });
      await fetchProducts();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to delete product");
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const duplicateProduct = async (product: Product) => {
    try {
      const newTitle = `${product.title} (Copy)`;
      const newSlug = slugify(newTitle);

      const { error: insertError } = await supabase
        .from("products")
        .insert({
          title: newTitle,
          slug: newSlug,
          price: product.price,
          currency: product.currency,
          price_unit: product.price_unit,
          description: product.description,
          image_url: product.image_url,
          video_url: product.video_url,
          media_type: product.media_type,
          days: product.days,
          rating: product.rating,
          coverage_text: product.coverage_text,
          deliverable_text: product.deliverable_text,
          is_highlighted: product.is_highlighted,
          highlight_label: product.highlight_label,
          cta_text: product.cta_text,
          cta_link: product.cta_link,
          is_active: false,
          sort_order: product.sort_order + 1,
        });

      if (insertError) throw insertError;

      toast({ title: "Success", description: "Product duplicated successfully" });
      await fetchProducts();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to duplicate product");
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const reorderProducts = async (updates: { id: string; sort_order: number }[]) => {
    try {
      for (const update of updates) {
        await supabase
          .from("products")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);
      }
      await fetchProducts();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to reorder products");
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    reorderProducts,
    refetch: fetchProducts,
  };
}
