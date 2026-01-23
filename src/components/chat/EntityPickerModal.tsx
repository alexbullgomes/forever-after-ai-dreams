import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Package, Megaphone, Check } from "lucide-react";
import { useProducts, Product } from "@/hooks/useProducts";
import { useActiveCampaigns, ActiveCampaign } from "@/hooks/useActiveCampaigns";
import { CardMessageData } from "@/types/chat";
import { ChatCardMessage } from "./ChatCardMessage";
import { cn } from "@/lib/utils";

interface EntityPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendCard: (cardData: CardMessageData) => void;
}

export const EntityPickerModal = ({ open, onOpenChange, onSendCard }: EntityPickerModalProps) => {
  const [activeTab, setActiveTab] = useState<'products' | 'campaigns'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<ActiveCampaign | null>(null);
  
  const { products, loading: productsLoading } = useProducts({ adminMode: true });
  const { campaigns, loading: campaignsLoading } = useActiveCampaigns();
  
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [products, searchQuery]);
  
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [campaigns, searchQuery]);

  const selectedItem = activeTab === 'products' ? selectedProduct : selectedCampaign;
  
  const previewCardData: CardMessageData | null = useMemo(() => {
    if (activeTab === 'products' && selectedProduct) {
      return {
        entityType: 'product',
        entityId: selectedProduct.id,
        title: selectedProduct.title,
        description: selectedProduct.description || null,
        priceLabel: selectedProduct.price ? `$${selectedProduct.price.toLocaleString()}` : null,
        imageUrl: selectedProduct.image_url || null,
        ctaLabel: 'View Details',
        ctaUrl: `/services#product-${selectedProduct.id}`
      };
    }
    
    if (activeTab === 'campaigns' && selectedCampaign) {
      return {
        entityType: 'campaign',
        entityId: selectedCampaign.id,
        title: selectedCampaign.title,
        description: selectedCampaign.subtitle || null,
        priceLabel: null,
        imageUrl: selectedCampaign.imageUrl || null,
        ctaLabel: 'View Offer',
        ctaUrl: selectedCampaign.href
      };
    }
    
    return null;
  }, [activeTab, selectedProduct, selectedCampaign]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'products' | 'campaigns');
    setSearchQuery('');
  };

  const handleSend = () => {
    if (!previewCardData) return;
    onSendCard(previewCardData);
    handleClose();
  };

  const handleClose = () => {
    setSelectedProduct(null);
    setSelectedCampaign(null);
    setSearchQuery('');
    setActiveTab('products');
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-brand-primary-from" />
            Send a Card
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
          </TabsList>
          
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <TabsContent value="products" className="flex-1 mt-4 min-h-0">
            <ScrollArea className="h-[180px] pr-3">
              {productsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary-from" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No products found
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map(product => (
                    <ProductListItem
                      key={product.id}
                      product={product}
                      selected={selectedProduct?.id === product.id}
                      onSelect={() => setSelectedProduct(product)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="campaigns" className="flex-1 mt-4 min-h-0">
            <ScrollArea className="h-[180px] pr-3">
              {campaignsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary-from" />
                </div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No active campaigns found
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCampaigns.map(campaign => (
                    <CampaignListItem
                      key={campaign.id}
                      campaign={campaign}
                      selected={selectedCampaign?.id === campaign.id}
                      onSelect={() => setSelectedCampaign(campaign)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        {/* Preview */}
        {previewCardData && (
          <div className="border rounded-lg p-3 bg-muted/30 mt-4">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Preview:</p>
            <ChatCardMessage data={previewCardData} variant="received" />
          </div>
        )}
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={!selectedItem}
            className="bg-brand-gradient hover:opacity-90"
          >
            Send Card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ProductListItemProps {
  product: Product;
  selected: boolean;
  onSelect: () => void;
}

const ProductListItem = ({ product, selected, onSelect }: ProductListItemProps) => {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border",
        selected 
          ? "bg-brand-light border-brand-primary-from ring-1 ring-brand-primary-from" 
          : "bg-card hover:bg-muted/50 border-transparent"
      )}
    >
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        {product.image_url ? (
          <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{product.title}</p>
        <p className="text-xs text-muted-foreground truncate">{product.description || 'No description'}</p>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        {product.price && (
          <span className="text-sm font-semibold text-foreground">
            ${product.price.toLocaleString()}
          </span>
        )}
        {selected && (
          <div className="w-5 h-5 rounded-full bg-brand-gradient flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

interface CampaignListItemProps {
  campaign: ActiveCampaign;
  selected: boolean;
  onSelect: () => void;
}

const CampaignListItem = ({ campaign, selected, onSelect }: CampaignListItemProps) => {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border",
        selected 
          ? "bg-brand-light border-brand-primary-from ring-1 ring-brand-primary-from" 
          : "bg-card hover:bg-muted/50 border-transparent"
      )}
    >
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        {campaign.imageUrl ? (
          <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{campaign.title}</p>
        <p className="text-xs text-muted-foreground truncate">{campaign.subtitle}</p>
      </div>
      
      {selected && (
        <div className="w-5 h-5 rounded-full bg-brand-gradient flex items-center justify-center shrink-0">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
};
