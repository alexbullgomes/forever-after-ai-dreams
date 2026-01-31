import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCampaignVendors, type CampaignVendor } from "@/hooks/useCampaignVendors";
import { Plus, Trash2, Eye, EyeOff, Edit, GripVertical, ExternalLink } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CampaignVendorsTabProps {
  campaignId: string | undefined;
  vendorsSectionEnabled: boolean;
  vendorsSectionHeadline: string;
  vendorsSectionDescription: string;
  onSectionEnabledChange: (enabled: boolean) => void;
  onHeadlineChange: (headline: string) => void;
  onDescriptionChange: (description: string) => void;
}

interface SortableVendorRowProps {
  vendor: CampaignVendor;
  onToggle: (id: string) => void;
  onEdit: (vendor: CampaignVendor) => void;
  onDelete: (id: string) => void;
}

function SortableVendorRow({ vendor, onToggle, onEdit, onDelete }: SortableVendorRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: vendor.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border bg-card ${
        !vendor.is_active ? "opacity-60" : ""
      }`}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Logo preview */}
      <div className="h-10 w-16 flex items-center justify-center bg-muted rounded overflow-hidden">
        {vendor.logo_url ? (
          <img
            src={vendor.logo_url}
            alt={vendor.name}
            className="max-h-8 max-w-14 object-contain"
          />
        ) : (
          <span className="text-xs text-muted-foreground">No logo</span>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{vendor.name}</p>
        {vendor.website_url && (
          <a
            href={vendor.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">{vendor.website_url}</span>
          </a>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onToggle(vendor.id)}
          title={vendor.is_active ? "Hide vendor" : "Show vendor"}
        >
          {vendor.is_active ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onEdit(vendor)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onDelete(vendor.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function CampaignVendorsTab({
  campaignId,
  vendorsSectionEnabled,
  vendorsSectionHeadline,
  vendorsSectionDescription,
  onSectionEnabledChange,
  onHeadlineChange,
  onDescriptionChange,
}: CampaignVendorsTabProps) {
  const {
    vendors,
    loading,
    createVendor,
    updateVendor,
    deleteVendor,
    toggleActive,
    reorderVendors,
  } = useCampaignVendors(campaignId);

  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<CampaignVendor | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<string | null>(null);
  const [vendorForm, setVendorForm] = useState({
    name: "",
    logo_url: "",
    website_url: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = vendors.findIndex((v) => v.id === active.id);
        const newIndex = vendors.findIndex((v) => v.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(vendors, oldIndex, newIndex);
          const updates = reordered.map((v, index) => ({
            id: v.id,
            sort_order: index,
          }));
          await reorderVendors(updates);
        }
      }
    },
    [vendors, reorderVendors]
  );

  const handleAddVendor = () => {
    setEditingVendor(null);
    setVendorForm({ name: "", logo_url: "", website_url: "" });
    setIsVendorDialogOpen(true);
  };

  const handleEditVendor = (vendor: CampaignVendor) => {
    setEditingVendor(vendor);
    setVendorForm({
      name: vendor.name,
      logo_url: vendor.logo_url || "",
      website_url: vendor.website_url || "",
    });
    setIsVendorDialogOpen(true);
  };

  const handleSaveVendor = async () => {
    if (!vendorForm.name.trim()) return;

    if (editingVendor) {
      await updateVendor(editingVendor.id, {
        name: vendorForm.name.trim(),
        logo_url: vendorForm.logo_url.trim() || null,
        website_url: vendorForm.website_url.trim() || null,
      });
    } else {
      await createVendor({
        name: vendorForm.name.trim(),
        logo_url: vendorForm.logo_url.trim() || undefined,
        website_url: vendorForm.website_url.trim() || undefined,
      });
    }

    setIsVendorDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (vendorToDelete) {
      await deleteVendor(vendorToDelete);
      setVendorToDelete(null);
    }
  };

  if (!campaignId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Save the campaign first to manage vendors.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="vendors_section_enabled" className="text-base font-medium">
                Enable Vendor Section
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Show vendor logos on the campaign landing page
              </p>
            </div>
            <Switch
              id="vendors_section_enabled"
              checked={vendorsSectionEnabled}
              onCheckedChange={onSectionEnabledChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section Text */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Section Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="vendors_headline">Headline</Label>
            <Input
              id="vendors_headline"
              value={vendorsSectionHeadline}
              onChange={(e) => onHeadlineChange(e.target.value)}
              placeholder="Our Partners"
            />
          </div>
          <div>
            <Label htmlFor="vendors_description">Description (optional)</Label>
            <Textarea
              id="vendors_description"
              value={vendorsSectionDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="We work with the best vendors in the industry..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Vendors List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Vendors</CardTitle>
          <Button type="button" size="sm" onClick={handleAddVendor}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading vendors...
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No vendors added yet. Click "Add Vendor" to get started.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={vendors.map((v) => v.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {vendors.map((vendor) => (
                    <SortableVendorRow
                      key={vendor.id}
                      vendor={vendor}
                      onToggle={toggleActive}
                      onEdit={handleEditVendor}
                      onDelete={setVendorToDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Vendor Dialog */}
      <Dialog open={isVendorDialogOpen} onOpenChange={setIsVendorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVendor ? "Edit Vendor" : "Add Vendor"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="vendor_name">Vendor Name *</Label>
              <Input
                id="vendor_name"
                value={vendorForm.name}
                onChange={(e) =>
                  setVendorForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Company Name"
              />
            </div>
            <div>
              <Label htmlFor="vendor_logo">Logo URL</Label>
              <Input
                id="vendor_logo"
                value={vendorForm.logo_url}
                onChange={(e) =>
                  setVendorForm((prev) => ({ ...prev, logo_url: e.target.value }))
                }
                placeholder="https://example.com/logo.svg"
              />
              <p className="text-xs text-muted-foreground mt-1">
                SVG format recommended for best quality
              </p>
            </div>
            <div>
              <Label htmlFor="vendor_website">Website URL (optional)</Label>
              <Input
                id="vendor_website"
                value={vendorForm.website_url}
                onChange={(e) =>
                  setVendorForm((prev) => ({ ...prev, website_url: e.target.value }))
                }
                placeholder="https://example.com"
              />
            </div>
            {vendorForm.logo_url && (
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Logo Preview
                </Label>
                <div className="flex justify-center">
                  <img
                    src={vendorForm.logo_url}
                    alt="Logo preview"
                    className="max-h-16 max-w-32 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "";
                      (e.target as HTMLImageElement).alt = "Failed to load";
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsVendorDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveVendor}
              disabled={!vendorForm.name.trim()}
            >
              {editingVendor ? "Save Changes" : "Add Vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!vendorToDelete}
        onOpenChange={() => setVendorToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this vendor from the campaign.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
