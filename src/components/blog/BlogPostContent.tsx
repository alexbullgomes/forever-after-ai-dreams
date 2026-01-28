import { Calendar, Clock, User, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import type { BlogPost } from "@/hooks/useBlogPosts";

interface BlogPostContentProps {
  post: BlogPost;
}

const BlogPostContent = ({ post }: BlogPostContentProps) => {
  const formattedDate = post.published_at
    ? format(new Date(post.published_at), "MMMM d, yyyy")
    : null;

  // Simple Markdown-like rendering for paragraphs
  const renderContent = (content: string | null) => {
    if (!content) return null;
    
    return content.split("\n\n").map((paragraph, index) => {
      // Handle headings
      if (paragraph.startsWith("## ")) {
        return (
          <h2
            key={index}
            className="text-2xl font-bold text-foreground mt-8 mb-4"
          >
            {paragraph.replace("## ", "")}
          </h2>
        );
      }
      if (paragraph.startsWith("### ")) {
        return (
          <h3
            key={index}
            className="text-xl font-semibold text-foreground mt-6 mb-3"
          >
            {paragraph.replace("### ", "")}
          </h3>
        );
      }
      // Regular paragraph
      return (
        <p key={index} className="text-foreground/90 leading-relaxed mb-4">
          {paragraph}
        </p>
      );
    });
  };

  return (
    <article className="max-w-4xl mx-auto">
      {/* Back Link */}
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="group">
          <Link to="/blog">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Blog
          </Link>
        </Button>
      </div>

      {/* Cover Image */}
      {post.cover_image_url && (
        <div className="aspect-[2/1] overflow-hidden rounded-xl mb-8">
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {post.author_name && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{post.author_name}</span>
            </div>
          )}
          {formattedDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
          )}
          {post.reading_time_minutes && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{post.reading_time_minutes} min read</span>
            </div>
          )}
        </div>
      </header>

      {/* Excerpt as lead */}
      {post.excerpt && (
        <p className="text-xl text-muted-foreground leading-relaxed mb-8 border-l-4 border-brand-primary-from/50 pl-6">
          {post.excerpt}
        </p>
      )}

      {/* Content */}
      <div className="prose prose-lg max-w-none">
        {renderContent(post.content)}
      </div>

      {/* Footer CTA */}
      <div className="mt-12 pt-8 border-t border-border">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Ready to capture your special moments?
          </p>
          <Button asChild size="lg" className="bg-brand-gradient hover:opacity-90">
            <Link to="/services">Explore Our Services</Link>
          </Button>
        </div>
      </div>
    </article>
  );
};

export default BlogPostContent;
