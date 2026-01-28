import { BookOpen, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BlogCard from "./BlogCard";
import { useBlogPosts } from "@/hooks/useBlogPosts";

const BlogSection = () => {
  const { data, isLoading } = useBlogPosts({ limit: 4 });
  const posts = data?.posts || [];

  // Don't render section if no posts
  if (!isLoading && posts.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge
            variant="outline"
            className="mb-4 px-4 py-1.5 text-sm font-medium border-brand-primary-from/30 text-brand-primary-from"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Latest Stories
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Insights & Inspiration
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tips, behind-the-scenes stories, and inspiration from our team at EverAfter Studio.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg bg-muted animate-pulse aspect-[3/4]"
              />
            ))}
          </div>
        )}

        {/* Blog Cards Grid */}
        {!isLoading && posts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {posts.map((post) => (
              <BlogCard
                key={post.id}
                title={post.title}
                slug={post.slug}
                excerpt={post.excerpt}
                coverImageUrl={post.cover_image_url}
                authorName={post.author_name}
                publishedAt={post.published_at}
                readingTime={post.reading_time_minutes}
              />
            ))}
          </div>
        )}

        {/* View All Button */}
        {!isLoading && posts.length > 0 && (
          <div className="text-center mt-10">
            <Button asChild variant="outline" size="lg" className="group">
              <Link to="/blog">
                View all articles
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogSection;
