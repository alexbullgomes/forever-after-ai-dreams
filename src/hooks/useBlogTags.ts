import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface BlogTagInput {
  name: string;
  slug: string;
}

export function useBlogTags() {
  return useQuery({
    queryKey: ["blog-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_tags")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching blog tags:", error);
        throw error;
      }

      return (data || []) as BlogTag[];
    },
  });
}

export function useCreateBlogTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BlogTagInput) => {
      const { data, error } = await supabase
        .from("blog_tags")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as BlogTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-tags"] });
      toast({
        title: "Tag created",
        description: "The tag has been created successfully.",
      });
    },
    onError: (error) => {
      console.error("Error creating tag:", error);
      toast({
        title: "Error",
        description: "Failed to create tag. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBlogTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: BlogTagInput & { id: string }) => {
      const { data, error } = await supabase
        .from("blog_tags")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as BlogTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-tags"] });
      toast({
        title: "Tag updated",
        description: "The tag has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error updating tag:", error);
      toast({
        title: "Error",
        description: "Failed to update tag. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBlogTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("blog_tags")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-tags"] });
      toast({
        title: "Tag deleted",
        description: "The tag has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error("Error deleting tag:", error);
      toast({
        title: "Error",
        description: "Failed to delete tag. Please try again.",
        variant: "destructive",
      });
    },
  });
}
