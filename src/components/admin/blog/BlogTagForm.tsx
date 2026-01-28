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
import type { BlogTag } from "@/hooks/useBlogTags";

interface BlogTagFormData {
  name: string;
  slug: string;
}

interface BlogTagFormProps {
  tag?: BlogTag | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BlogTagFormData) => void;
  isLoading?: boolean;
}

const BlogTagForm = ({
  tag,
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: BlogTagFormProps) => {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<BlogTagFormData>({
    defaultValues: {
      name: tag?.name || "",
      slug: tag?.slug || "",
    },
  });

  const name = watch("name");

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setValue("name", newName);
    if (!tag) {
      setValue("slug", slugify(newName));
    }
  };

  const onFormSubmit = (data: BlogTagFormData) => {
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
            {tag ? "Edit Tag" : "Create Tag"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register("name", { required: "Name is required" })}
              onChange={handleNameChange}
              placeholder="Tag name"
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
              placeholder="tag-slug"
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
              {isLoading ? "Saving..." : tag ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BlogTagForm;
