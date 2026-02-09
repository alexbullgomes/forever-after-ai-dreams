import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, User } from "lucide-react";
import { format } from "date-fns";

interface BlogCardProps {
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  authorName: string | null;
  publishedAt: string | null;
  readingTime: number | null;
}

const BlogCard = ({
  title,
  slug,
  excerpt,
  coverImageUrl,
  authorName,
  publishedAt,
  readingTime,
}: BlogCardProps) => {
  const formattedDate = publishedAt
    ? format(new Date(publishedAt), "MMM d, yyyy")
    : null;

  return (
    <Link to={`/blog/${slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden border-border/50 bg-card hover:shadow-lg transition-all duration-300 group-hover:border-brand-primary-from/30">
        {/* Cover Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-primary-from/10 to-brand-primary-to/10">
              <span className="text-4xl font-bold text-brand-primary-from/30">
                {title.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <CardContent className="p-5">
          {/* Title */}
          <h3 className="text-lg font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-brand-primary-from transition-colors">
            {title}
          </h3>

          {/* Excerpt */}
          {excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {authorName && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{authorName}</span>
              </div>
            )}
            {formattedDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formattedDate}</span>
              </div>
            )}
            {readingTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{readingTime} min read</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default BlogCard;
