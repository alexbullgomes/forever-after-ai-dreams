import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Edit, Trash2, Check, X, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface GalleryItem {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  order_index: number;
  thumb_mp4_url?: string;
  thumb_image_url?: string;
  full_video_url?: string;
}

interface CampaignGalleryItemCardProps {
  card: GalleryItem;
  onUpdate: (id: string, updates: Partial<GalleryItem>) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
}

export const CampaignGalleryItemCard = ({
  card,
  onUpdate,
  onDelete,
}: CampaignGalleryItemCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: card.title,
    subtitle: card.subtitle || "",
    category: card.category,
    thumb_mp4_url: card.thumb_mp4_url || "",
    thumb_image_url: card.thumb_image_url || "",
    full_video_url: card.full_video_url || "",
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleStartEdit = () => {
    setEditFormData({
      title: card.title,
      subtitle: card.subtitle || "",
      category: card.category,
      thumb_mp4_url: card.thumb_mp4_url || "",
      thumb_image_url: card.thumb_image_url || "",
      full_video_url: card.full_video_url || "",
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      await onUpdate(card.id, {
        title: editFormData.title,
        subtitle: editFormData.subtitle || undefined,
        category: editFormData.category,
        thumb_mp4_url: editFormData.thumb_mp4_url || undefined,
        thumb_image_url: editFormData.thumb_image_url || undefined,
        full_video_url: editFormData.full_video_url || undefined,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const clearField = (field: keyof typeof editFormData) => {
    setEditFormData((prev) => ({ ...prev, [field]: "" }));
  };

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="border rounded-md p-3 space-y-3 bg-muted/30"
      >
        <div className="space-y-2">
          <div>
            <Label htmlFor={`edit-title-${card.id}`} className="text-xs">
              Title *
            </Label>
            <Input
              id={`edit-title-${card.id}`}
              value={editFormData.title}
              onChange={(e) =>
                setEditFormData({ ...editFormData, title: e.target.value })
              }
              className="h-8 text-sm"
            />
          </div>

          <div>
            <Label htmlFor={`edit-subtitle-${card.id}`} className="text-xs">
              Subtitle
            </Label>
            <Input
              id={`edit-subtitle-${card.id}`}
              value={editFormData.subtitle}
              onChange={(e) =>
                setEditFormData({ ...editFormData, subtitle: e.target.value })
              }
              className="h-8 text-sm"
            />
          </div>

          <div>
            <Label htmlFor={`edit-category-${card.id}`} className="text-xs">
              Category
            </Label>
            <Input
              id={`edit-category-${card.id}`}
              value={editFormData.category}
              onChange={(e) =>
                setEditFormData({ ...editFormData, category: e.target.value })
              }
              className="h-8 text-sm"
            />
          </div>

          <div>
            <Label htmlFor={`edit-thumb_mp4-${card.id}`} className="text-xs">
              Thumbnail MP4 URL
            </Label>
            <div className="flex gap-1">
              <Input
                id={`edit-thumb_mp4-${card.id}`}
                value={editFormData.thumb_mp4_url}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    thumb_mp4_url: e.target.value,
                  })
                }
                className="h-8 text-sm"
                placeholder="https://..."
              />
              {editFormData.thumb_mp4_url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => clearField("thumb_mp4_url")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor={`edit-thumb_image-${card.id}`} className="text-xs">
              Thumbnail Image URL
            </Label>
            <div className="flex gap-1">
              <Input
                id={`edit-thumb_image-${card.id}`}
                value={editFormData.thumb_image_url}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    thumb_image_url: e.target.value,
                  })
                }
                className="h-8 text-sm"
                placeholder="https://..."
              />
              {editFormData.thumb_image_url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => clearField("thumb_image_url")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor={`edit-full_video-${card.id}`} className="text-xs">
              Full Video URL
            </Label>
            <div className="flex gap-1">
              <Input
                id={`edit-full_video-${card.id}`}
                value={editFormData.full_video_url}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    full_video_url: e.target.value,
                  })
                }
                className="h-8 text-sm"
                placeholder="https://..."
              />
              {editFormData.full_video_url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => clearField("full_video_url")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancelEdit}
            disabled={isSaving}
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSaveEdit}
            disabled={isSaving || !editFormData.title.trim()}
          >
            <Check className="h-3 w-3 mr-1" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded-md p-2 bg-background"
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-1 cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold truncate">{card.title}</h4>
          <p className="text-xs text-muted-foreground truncate">{card.subtitle}</p>
        </div>
      </div>
      <div className="flex justify-between items-center mt-2 gap-1">
        <Button variant="outline" size="sm" className="h-7 px-2">
          <Eye className="h-3 w-3 mr-1" />
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2"
          onClick={handleStartEdit}
        >
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="h-7 px-2"
          onClick={() => onDelete(card.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
