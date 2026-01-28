import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Pencil, Eye, Copy, Trash2, FileText, Tag, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import BlogPostForm from "@/components/admin/blog/BlogPostForm";
import BlogCategoryForm from "@/components/admin/blog/BlogCategoryForm";
import BlogTagForm from "@/components/admin/blog/BlogTagForm";
import {
  useBlogPostsAdmin,
  useCreateBlogPost,
  useUpdateBlogPost,
  useDeleteBlogPost,
  useDuplicateBlogPost,
} from "@/hooks/useBlogPostsAdmin";
import {
  useBlogCategories,
  useCreateBlogCategory,
  useUpdateBlogCategory,
  useDeleteBlogCategory,
} from "@/hooks/useBlogCategories";
import {
  useBlogTags,
  useCreateBlogTag,
  useUpdateBlogTag,
  useDeleteBlogTag,
} from "@/hooks/useBlogTags";
import type { BlogPost } from "@/hooks/useBlogPosts";
import type { BlogCategory } from "@/hooks/useBlogCategories";
import type { BlogTag } from "@/hooks/useBlogTags";

const BlogAdmin = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPostFormOpen, setIsPostFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  const [isTagFormOpen, setIsTagFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<BlogTag | null>(null);
  const [deleteTagId, setDeleteTagId] = useState<string | null>(null);

  // Posts hooks
  const { data: posts, isLoading: postsLoading } = useBlogPostsAdmin({ status: statusFilter });
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const deletePost = useDeleteBlogPost();
  const duplicatePost = useDuplicateBlogPost();

  // Categories hooks
  const { data: categories, isLoading: categoriesLoading } = useBlogCategories();
  const createCategory = useCreateBlogCategory();
  const updateCategory = useUpdateBlogCategory();
  const deleteCategory = useDeleteBlogCategory();

  // Tags hooks
  const { data: tags, isLoading: tagsLoading } = useBlogTags();
  const createTag = useCreateBlogTag();
  const updateTag = useUpdateBlogTag();
  const deleteTag = useDeleteBlogTag();

  // Post handlers
  const handleCreatePost = () => {
    setEditingPost(null);
    setIsPostFormOpen(true);
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setIsPostFormOpen(true);
  };

  const handlePostSubmit = async (data: any) => {
    if (editingPost) {
      await updatePost.mutateAsync({ id: editingPost.id, ...data });
    } else {
      await createPost.mutateAsync(data);
    }
    setIsPostFormOpen(false);
    setEditingPost(null);
  };

  const handleDuplicatePost = async (post: BlogPost) => {
    await duplicatePost.mutateAsync(post);
  };

  const handleDeletePost = async () => {
    if (deletePostId) {
      await deletePost.mutateAsync(deletePostId);
      setDeletePostId(null);
    }
  };

  // Category handlers
  const handleCategorySubmit = async (data: { name: string; slug: string }) => {
    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, ...data });
    } else {
      await createCategory.mutateAsync(data);
    }
    setIsCategoryFormOpen(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = async () => {
    if (deleteCategoryId) {
      await deleteCategory.mutateAsync(deleteCategoryId);
      setDeleteCategoryId(null);
    }
  };

  // Tag handlers
  const handleTagSubmit = async (data: { name: string; slug: string }) => {
    if (editingTag) {
      await updateTag.mutateAsync({ id: editingTag.id, ...data });
    } else {
      await createTag.mutateAsync(data);
    }
    setIsTagFormOpen(false);
    setEditingTag(null);
  };

  const handleDeleteTag = async () => {
    if (deleteTagId) {
      await deleteTag.mutateAsync(deleteTagId);
      setDeleteTagId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-500/10 text-green-600 border-green-200">Published</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Scheduled</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Blog Management</h1>
        <p className="text-muted-foreground">Create and manage blog posts, categories, and tags.</p>
      </div>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="posts" className="gap-2">
            <FileText className="h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts">
          <div className="flex items-center justify-between mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleCreatePost}>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {postsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : posts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No posts yet. Create your first post!
                    </TableCell>
                  </TableRow>
                ) : (
                  posts?.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>{getStatusBadge(post.status)}</TableCell>
                      <TableCell>
                        {post.published_at
                          ? format(new Date(post.published_at), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditPost(post)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {post.status === "published" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDuplicatePost(post)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletePostId(post.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <div className="flex justify-end mb-4">
            <Button onClick={() => {
              setEditingCategory(null);
              setIsCategoryFormOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              New Category
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoriesLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : categories?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No categories yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories?.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingCategory(category);
                              setIsCategoryFormOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteCategoryId(category.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags">
          <div className="flex justify-end mb-4">
            <Button onClick={() => {
              setEditingTag(null);
              setIsTagFormOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              New Tag
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tagsLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : tags?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No tags yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  tags?.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell className="font-medium">{tag.name}</TableCell>
                      <TableCell className="text-muted-foreground">{tag.slug}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingTag(tag);
                              setIsTagFormOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTagId(tag.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Post Form Dialog */}
      <Dialog open={isPostFormOpen} onOpenChange={setIsPostFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingPost ? "Edit Post" : "Create New Post"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-100px)]">
            <div className="pr-4">
              <BlogPostForm
                post={editingPost}
                onSubmit={handlePostSubmit}
                onCancel={() => {
                  setIsPostFormOpen(false);
                  setEditingPost(null);
                }}
                isLoading={createPost.isPending || updatePost.isPending}
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Category Form */}
      <BlogCategoryForm
        category={editingCategory}
        isOpen={isCategoryFormOpen}
        onClose={() => {
          setIsCategoryFormOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleCategorySubmit}
        isLoading={createCategory.isPending || updateCategory.isPending}
      />

      {/* Tag Form */}
      <BlogTagForm
        tag={editingTag}
        isOpen={isTagFormOpen}
        onClose={() => {
          setIsTagFormOpen(false);
          setEditingTag(null);
        }}
        onSubmit={handleTagSubmit}
        isLoading={createTag.isPending || updateTag.isPending}
      />

      {/* Delete Post Confirmation */}
      <AlertDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Tag Confirmation */}
      <AlertDialog open={!!deleteTagId} onOpenChange={() => setDeleteTagId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tag? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTag} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BlogAdmin;
