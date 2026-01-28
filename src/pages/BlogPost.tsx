import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import Header from "@/components/Header";
import AuthModal from "@/components/AuthModal";
import SEO from "@/components/SEO";
import BlogPostContent from "@/components/blog/BlogPostContent";
import { useBlogPost } from "@/hooks/useBlogPosts";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { data: post, isLoading, error } = useBlogPost(slug || "");

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header onLoginClick={() => setIsAuthModalOpen(true)} />
        <main className="pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-24 mb-8" />
              <div className="aspect-[2/1] bg-muted rounded-xl mb-8" />
              <div className="h-12 bg-muted rounded w-3/4 mb-6" />
              <div className="h-4 bg-muted rounded w-1/2 mb-8" />
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Not found
  if (!post || error) {
    return <Navigate to="/blog" replace />;
  }

  // Build structured data
  const blogPostSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    image: post.cover_image_url || "https://everafter-studio.lovable.app/og-image.jpg",
    author: {
      "@type": "Person",
      name: post.author_name || "EverAfter Team",
    },
    publisher: {
      "@type": "Organization",
      name: "EverAfter Studio",
      logo: {
        "@type": "ImageObject",
        url: "https://everafter-studio.lovable.app/og-image.jpg",
      },
    },
    datePublished: post.published_at,
    dateModified: post.updated_at,
    description: post.seo_description || post.excerpt || "",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://everafter-studio.lovable.app/blog/${post.slug}`,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={post.seo_title || `${post.title} | EverAfter Blog`}
        description={post.seo_description || post.excerpt || ""}
        canonical={`/blog/${post.slug}`}
        ogImage={post.seo_image_url || post.cover_image_url || undefined}
        ogType="article"
        schema={blogPostSchema}
      />

      <Header onLoginClick={() => setIsAuthModalOpen(true)} />

      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BlogPostContent post={post} />
        </div>
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default BlogPost;
