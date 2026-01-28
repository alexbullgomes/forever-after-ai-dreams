import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import AuthModal from "@/components/AuthModal";
import SEO from "@/components/SEO";
import BlogCard from "@/components/blog/BlogCard";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Blog = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const { data, isLoading } = useBlogPosts({ page: currentPage, perPage: 8 });
  const posts = data?.posts || [];
  const totalPages = data?.totalPages || 0;

  const handlePageChange = (page: number) => {
    setSearchParams({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Blog | EverAfter Studio"
        description="Wedding photography tips, behind-the-scenes stories, and inspiration from EverAfter Studio in California. Discover insights for your special day."
        canonical="/blog"
      />
      
      <Header onLoginClick={() => setIsAuthModalOpen(true)} />

      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Our Blog
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Stories, tips, and inspiration from the world of visual storytelling.
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-muted animate-pulse aspect-[3/4]"
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && posts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                No blog posts yet. Check back soon!
              </p>
            </div>
          )}

          {/* Blog Grid */}
          {!isLoading && posts.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "ghost"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className={
                            page === currentPage
                              ? "bg-brand-primary-from hover:bg-brand-primary-from/90"
                              : ""
                          }
                        >
                          {page}
                        </Button>
                      )
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default Blog;
