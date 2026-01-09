import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCampaignProducts } from "@/hooks/useCampaignProducts";
import { useProducts, Product } from "@/hooks/useProducts";
import { ProductForm } from "@/components/admin/ProductForm";
import { 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  GripVertical, 
  Package, 
  Edit2,
  ChevronDown,
  ChevronUp 
} from "lucide-react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface CampaignProductsTabProps {
  campaignId: string | undefined;
  productsSectionEnabled: boolean;
  onToggleProductsSection: (enabled: boolean) => void;
}

interface SortableProductItemProps {
  campaignProduct: {
    id: string;
    product_id: string;
    is_active: boolean;
    product?: Product;
  };
  onToggleActive: (productId: string) => void;
  onUnlink: (productId: string) => void;
  onEdit: (product: Product) => void;
}

function SortableProductItem({ 
  campaignProduct, 
  onToggleActive, 
  onUnlink,
  onEdit 
}: SortableProductItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: campaignProduct.product_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const product = campaignProduct.product;
  if (!product) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 border rounded-lg bg-card",
        isDragging && "opacity-50 shadow-lg",
        !campaignProduct.is_active && "opacity-60"
      )}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>

      {product.image_url && (
        <img
          src={product.image_url}
          alt={product.title}
          className="h-12 w-12 rounded-lg object-cover"
        />
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{product.title}</p>
        <p className="text-sm text-muted-foreground">
          ${product.price} {product.currency || 'USD'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleActive(campaignProduct.product_id)}
          title={campaignProduct.is_active ? "Hide from campaign" : "Show on campaign"}
        >
          {campaignProduct.is_active ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onEdit(product)}
          title="Edit product"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onUnlink(campaignProduct.product_id)}
          className="text-destructive hover:text-destructive"
          title="Remove from campaign"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function CampaignProductsTab({
  campaignId,
  productsSectionEnabled,
  onToggleProductsSection,
}: CampaignProductsTabProps) {
  const {
    campaignProducts,
    availableProducts,
    loading,
    linkProduct,
    unlinkProduct,
    toggleProductActive,
    reorderProducts,
    refetch,
  } = useCampaignProducts(campaignId);

  const { createProduct, updateProduct } = useProducts({ adminMode: true });

  const [showAvailable, setShowAvailable] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = campaignProducts.findIndex(cp => cp.product_id === active.id);
      const newIndex = campaignProducts.findIndex(cp => cp.product_id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Calculate new sort orders
        const updates = campaignProducts.map((cp, idx) => {
          let newSortOrder = idx;
          if (idx === oldIndex) {
            newSortOrder = newIndex;
          } else if (oldIndex < newIndex && idx > oldIndex && idx <= newIndex) {
            newSortOrder = idx - 1;
          } else if (oldIndex > newIndex && idx >= newIndex && idx < oldIndex) {
            newSortOrder = idx + 1;
          }
          return { product_id: cp.product_id, sort_order: newSortOrder };
        });

        reorderProducts(updates);
      }
    }
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setIsProductFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductFormOpen(true);
  };

  const handleProductFormSubmit = async (data: Partial<Product>) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
      } else {
        const newProduct = await createProduct(data);
        // Auto-link newly created product to campaign
        if (newProduct && campaignId) {
          await linkProduct(newProduct.id);
        }
      }
    } finally {
      setIsProductFormOpen(false);
      setEditingProduct(null);
      refetch();
    }
  };

  if (!campaignId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Save the campaign first to manage products</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Toggle */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
        <div className="space-y-1">
          <Label htmlFor="products_section_enabled" className="text-base font-medium">
            Enable Products Section
          </Label>
          <p className="text-sm text-muted-foreground">
            Show product cards on the campaign landing page
          </p>
        </div>
        <Switch
          id="products_section_enabled"
          checked={productsSectionEnabled}
          onCheckedChange={onToggleProductsSection}
        />
      </div>

      {/* Linked Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Linked Products</CardTitle>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAvailable(!showAvailable)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Existing
              {showAvailable ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </Button>
            <Button type="button" size="sm" onClick={handleCreateProduct}>
              <Plus className="h-4 w-4 mr-1" />
              Create New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : campaignProducts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No products linked to this campaign</p>
              <Button type="button" variant="outline" onClick={() => setShowAvailable(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Products
              </Button>
            </div>
          ) : (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={campaignProducts.map(cp => cp.product_id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {campaignProducts.map(cp => (
                    <SortableProductItem
                      key={cp.product_id}
                      campaignProduct={cp}
                      onToggleActive={toggleProductActive}
                      onUnlink={unlinkProduct}
                      onEdit={handleEditProduct}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Available Products Dropdown */}
      {showAvailable && availableProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {availableProducts.map(product => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.title}</p>
                    <p className="text-sm text-muted-foreground">
                      ${product.price} {product.currency || 'USD'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => linkProduct(product.id)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showAvailable && availableProducts.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            All products are already linked to this campaign
          </CardContent>
        </Card>
      )}

      {/* Product Form Modal */}
      <ProductForm
        open={isProductFormOpen}
        onOpenChange={(open) => {
          setIsProductFormOpen(open);
          if (!open) setEditingProduct(null);
        }}
        product={editingProduct}
        onSubmit={handleProductFormSubmit}
      />
    </div>
  );
}
