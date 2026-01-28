import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface BlogCategoryInput {
  name: string;
  slug: string;
}

export function useBlogCategories() {
  return useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching blog categories:", error);
        throw error;
      }

      return (data || []) as BlogCategory[];
    },
  });
}

export function useCreateBlogCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BlogCategoryInput) => {
      const { data, error } = await supabase
        .from("blog_categories")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as BlogCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
      toast({
        title: "Category created",
        description: "The category has been created successfully.",
      });
    },
    onError: (error) => {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBlogCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: BlogCategoryInput & { id: string }) => {
      const { data, error } = await supabase
        .from("blog_categories")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as BlogCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
      toast({
        title: "Category updated",
        description: "The category has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error updating category:", error);
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBlogCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("blog_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      });
    },
  });
}
