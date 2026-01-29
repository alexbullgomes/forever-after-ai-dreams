import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { BlogPost } from "./useBlogPosts";

export interface BlogPostInput {
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  cover_image_url?: string | null;
  author_name?: string | null;
  status?: string;
  published_at?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_image_url?: string | null;
  canonical_url?: string | null;
  reading_time_minutes?: number | null;
}

interface AdminBlogPostsOptions {
  status?: string;
}

export function useBlogPostsAdmin(options: AdminBlogPostsOptions = {}) {
  const { status } = options;

  return useQuery({
    queryKey: ["blog-posts", "admin", status],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching admin blog posts:", error);
        throw error;
      }

      return (data || []) as BlogPost[];
    },
  });
}

export function useBlogPostAdmin(id: string | undefined) {
  return useQuery({
    queryKey: ["blog-post", "admin", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching blog post:", error);
        throw error;
      }

      return data as BlogPost;
    },
    enabled: !!id,
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BlogPostInput) => {
      const { data, error } = await supabase
        .from("blog_posts")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as BlogPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast({
        title: "Post created",
        description: "The blog post has been created successfully.",
      });
    },
    onError: (error) => {
      console.error("Error creating blog post:", error);
      toast({
        title: "Error",
        description: "Failed to create blog post. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: BlogPostInput & { id: string }) => {
      const { data, error } = await supabase
        .from("blog_posts")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as BlogPost;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-post", data.slug] });
      queryClient.invalidateQueries({ queryKey: ["blog-post", "admin", data.id] });
      toast({
        title: "Post updated",
        description: "The blog post has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error updating blog post:", error);
      toast({
        title: "Error",
        description: "Failed to update blog post. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast({
        title: "Post deleted",
        description: "The blog post has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error("Error deleting blog post:", error);
      toast({
        title: "Error",
        description: "Failed to delete blog post. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useDuplicateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (post: BlogPost) => {
      const { id, created_at, updated_at, ...rest } = post;
      const newPost = {
        ...rest,
        title: `${rest.title} (Copy)`,
        slug: `${rest.slug}-copy-${Date.now()}`,
        status: "draft",
        published_at: null,
      };

      const { data, error } = await supabase
        .from("blog_posts")
        .insert(newPost)
        .select()
        .single();

      if (error) throw error;
      return data as BlogPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast({
        title: "Post duplicated",
        description: "The blog post has been duplicated as a draft.",
      });
    },
    onError: (error) => {
      console.error("Error duplicating blog post:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate blog post. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Helper to calculate reading time (strips HTML tags for accurate word count)
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  // Strip HTML tags for accurate word count
  const textContent = content.replace(/<[^>]*>/g, " ").trim();
  const wordCount = textContent.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}
