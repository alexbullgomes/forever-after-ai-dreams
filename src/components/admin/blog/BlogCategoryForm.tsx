import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { slugify } from "@/utils/slugify";
import type { BlogCategory } from "@/hooks/useBlogCategories";

interface BlogCategoryFormData {
  name: string;
  slug: string;
}

interface BlogCategoryFormProps {
  category?: BlogCategory | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BlogCategoryFormData) => void;
  isLoading?: boolean;
}

const BlogCategoryForm = ({
  category,
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: BlogCategoryFormProps) => {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<BlogCategoryFormData>({
    defaultValues: {
      name: category?.name || "",
      slug: category?.slug || "",
    },
  });

  const name = watch("name");

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setValue("name", newName);
    if (!category) {
      setValue("slug", slugify(newName));
    }
  };

  const onFormSubmit = (data: BlogCategoryFormData) => {
    onSubmit(data);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit Category" : "Create Category"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register("name", { required: "Name is required" })}
              onChange={handleNameChange}
              placeholder="Category name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              {...register("slug", { required: "Slug is required" })}
              placeholder="category-slug"
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : category ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BlogCategoryForm;
