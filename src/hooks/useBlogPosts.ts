import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  author_name: string | null;
  status: string;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_image_url: string | null;
  canonical_url: string | null;
  reading_time_minutes: number | null;
  created_at: string;
  updated_at: string;
}

interface UseBlogPostsOptions {
  limit?: number;
  page?: number;
  perPage?: number;
}

export function useBlogPosts(options: UseBlogPostsOptions = {}) {
  const { limit, page = 1, perPage = 8 } = options;
  
  const queryKey = limit 
    ? ["blog-posts", "public", limit] 
    : ["blog-posts", "public", page, perPage];

  return useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*", { count: "exact" })
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      } else {
        const from = (page - 1) * perPage;
        const to = from + perPage - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching blog posts:", error);
        throw error;
      }

      return {
        posts: (data || []) as BlogPost[],
        totalCount: count || 0,
        totalPages: count ? Math.ceil(count / perPage) : 0,
        currentPage: page,
      };
    },
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Not found
        }
        console.error("Error fetching blog post:", error);
        throw error;
      }

      return data as BlogPost;
    },
    enabled: !!slug,
  });
}
