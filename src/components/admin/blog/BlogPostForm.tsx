import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Save, Eye } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { slugify } from "@/utils/slugify";
import { calculateReadingTime } from "@/hooks/useBlogPostsAdmin";
import type { BlogPost } from "@/hooks/useBlogPosts";

interface BlogPostFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  author_name: string;
  status: string;
  published_at: string | null;
  seo_title: string;
  seo_description: string;
  seo_image_url: string;
  canonical_url: string;
  reading_time_minutes: number;
}

interface BlogPostFormProps {
  post?: BlogPost | null;
  onSubmit: (data: BlogPostFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const BlogPostForm = ({ post, onSubmit, onCancel, isLoading }: BlogPostFormProps) => {
  const [publishDate, setPublishDate] = useState<Date | undefined>(
    post?.published_at ? new Date(post.published_at) : undefined
  );

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BlogPostFormData>({
    defaultValues: {
      title: post?.title || "",
      slug: post?.slug || "",
      excerpt: post?.excerpt || "",
      content: post?.content || "",
      cover_image_url: post?.cover_image_url || "",
      author_name: post?.author_name || "EverAfter Team",
      status: post?.status || "draft",
      published_at: post?.published_at || null,
      seo_title: post?.seo_title || "",
      seo_description: post?.seo_description || "",
      seo_image_url: post?.seo_image_url || "",
      canonical_url: post?.canonical_url || "",
      reading_time_minutes: post?.reading_time_minutes || 5,
    },
  });

  const title = watch("title");
  const content = watch("content");
  const seoTitle = watch("seo_title");
  const seoDescription = watch("seo_description");
  const status = watch("status");

  // Auto-generate slug from title
  useEffect(() => {
    if (!post && title) {
      setValue("slug", slugify(title));
    }
  }, [title, post, setValue]);

  // Auto-calculate reading time
  useEffect(() => {
    if (content) {
      setValue("reading_time_minutes", calculateReadingTime(content));
    }
  }, [content, setValue]);

  // Update published_at when date changes
  useEffect(() => {
    if (publishDate) {
      setValue("published_at", publishDate.toISOString());
    }
  }, [publishDate, setValue]);

  const onFormSubmit = (data: BlogPostFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register("title", { required: "Title is required" })}
                placeholder="Enter post title"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                {...register("slug", { required: "Slug is required" })}
                placeholder="post-url-slug"
              />
              {errors.slug && (
                <p className="text-sm text-destructive">{errors.slug.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="excerpt">
                Excerpt
                <span className="text-muted-foreground text-xs ml-2">
                  (Recommended: 150-200 characters)
                </span>
              </Label>
              <Textarea
                id="excerpt"
                {...register("excerpt")}
                placeholder="Brief summary for cards and previews"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                {...register("content")}
                placeholder="Write your blog post content here... (Markdown supported)"
                rows={15}
                className="font-mono"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cover_image_url">Cover Image URL</Label>
              <Input
                id="cover_image_url"
                {...register("cover_image_url")}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="author_name">Author Name</Label>
              <Input
                id="author_name"
                {...register("author_name")}
                placeholder="EverAfter Team"
              />
            </div>
          </div>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Google Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-4 rounded border">
                <div className="text-blue-600 text-lg hover:underline cursor-pointer truncate">
                  {seoTitle || title || "Post Title"} | EverAfter Blog
                </div>
                <div className="text-green-700 text-sm">
                  everafter-studio.lovable.app/blog/...
                </div>
                <div className="text-gray-600 text-sm line-clamp-2">
                  {seoDescription || "Meta description will appear here..."}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="seo_title">
                SEO Title
                <span className="text-muted-foreground text-xs ml-2">
                  ({(seoTitle || "").length}/60)
                </span>
              </Label>
              <Input
                id="seo_title"
                {...register("seo_title")}
                placeholder="Custom title for search engines"
                maxLength={60}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="seo_description">
                Meta Description
                <span className="text-muted-foreground text-xs ml-2">
                  ({(seoDescription || "").length}/160)
                </span>
              </Label>
              <Textarea
                id="seo_description"
                {...register("seo_description")}
                placeholder="Description for search results"
                rows={3}
                maxLength={160}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="seo_image_url">OG Image URL</Label>
              <Input
                id="seo_image_url"
                {...register("seo_image_url")}
                placeholder="Custom image for social sharing"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="canonical_url">Canonical URL</Label>
              <Input
                id="canonical_url"
                {...register("canonical_url")}
                placeholder="https://example.com/original-post"
              />
            </div>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Publish Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !publishDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {publishDate ? format(publishDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={publishDate}
                    onSelect={setPublishDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reading_time_minutes">Reading Time (minutes)</Label>
              <Input
                id="reading_time_minutes"
                type="number"
                min={1}
                {...register("reading_time_minutes", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Auto-calculated from content
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        {post && (
          <Button
            type="button"
            variant="outline"
            onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Saving..." : post ? "Update Post" : "Create Post"}
        </Button>
      </div>
    </form>
  );
};

export default BlogPostForm;
