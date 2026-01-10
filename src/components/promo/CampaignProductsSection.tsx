import { useState, useEffect, useCallback } from "react";
import { InteractiveProduct3DCard } from "@/components/ui/3d-product-card";
import { Product } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingFunnelModal } from "@/components/booking/BookingFunnelModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";

const PENDING_CAMPAIGN_PRODUCT_DATE_KEY = 'pendingCampaignProductDateSelection';

interface CampaignProductsSectionProps {
  campaignId: string;
  campaignSlug: string;
}

interface CampaignProductWithDetails {
  id: string;
  campaign_id: string;
  product_id: string;
  sort_order: number;
  is_active: boolean;
  product: Product;
}

interface PendingProductResume {
  product: Product;
  date: Date;
  timezone: string;
}

export function CampaignProductsSection({ campaignId, campaignSlug }: CampaignProductsSectionProps) {
  const [products, setProducts] = useState<CampaignProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingProduct, setBookingProduct] = useState<Product | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingProductResume, setPendingProductResume] = useState<PendingProductResume | null>(null);
  
  const { user } = useAuth();

  // Check for pending product booking after user logs in
  useEffect(() => {
    if (!user) return;
    
    const storedData = localStorage.getItem(PENDING_CAMPAIGN_PRODUCT_DATE_KEY);
    if (!storedData) return;
    
    try {
      const parsed = JSON.parse(storedData);
      
      // Validate it's for this campaign
      if (parsed.campaignId !== campaignId) return;
      
      // Check if not expired (30 min max)
      if (Date.now() - parsed.timestamp > 30 * 60 * 1000) {
        localStorage.removeItem(PENDING_CAMPAIGN_PRODUCT_DATE_KEY);
        return;
      }
      
      // Find the product in our list
      const matchingCampaignProduct = products.find(cp => cp.product.id === parsed.productId);
      if (!matchingCampaignProduct) {
        // Products might not be loaded yet, wait for them
        return;
      }
      
      // Clear storage and set resume state
      localStorage.removeItem(PENDING_CAMPAIGN_PRODUCT_DATE_KEY);
      localStorage.removeItem('postLoginReturnTo');
      localStorage.removeItem('postLoginAction');
      
      setPendingProductResume({
        product: matchingCampaignProduct.product,
        date: new Date(parsed.selectedDate),
        timezone: parsed.timezone,
      });
      setBookingProduct(matchingCampaignProduct.product);
      
    } catch (err) {
      console.error('Error parsing pending campaign product booking:', err);
      localStorage.removeItem(PENDING_CAMPAIGN_PRODUCT_DATE_KEY);
    }
  }, [user, campaignId, products]);

  useEffect(() => {
    const fetchCampaignProducts = async () => {
      try {
        setLoading(true);

        // Fetch active campaign products
        const { data: cpData, error: cpError } = await supabase
          .from('promotional_campaign_products')
          .select('*')
          .eq('campaign_id', campaignId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (cpError) throw cpError;

        if (!cpData || cpData.length === 0) {
          setProducts([]);
          return;
        }

        // Fetch product details for linked products
        const productIds = cpData.map(cp => cp.product_id);
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds)
          .eq('is_active', true);

        if (productsError) throw productsError;

        // Map products to campaign products
        const productsMap = new Map((productsData || []).map(p => [p.id, p]));
        const enrichedProducts = cpData
          .map(cp => ({
            ...cp,
            product: productsMap.get(cp.product_id) as Product,
          }))
          .filter(cp => cp.product); // Only include products that exist and are active

        setProducts(enrichedProducts);
      } catch (err) {
        console.error('Error fetching campaign products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      fetchCampaignProducts();
    }
  }, [campaignId]);

  const handleProductClick = (product: Product) => {
    setBookingProduct(product);
  };

  const handleAuthRequired = useCallback(() => {
    setIsAuthModalOpen(true);
  }, []);

  const handleBookingClose = useCallback(() => {
    setBookingProduct(null);
    setPendingProductResume(null);
  }, []);

  const handleAuthModalClose = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  if (loading) {
    return (
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-2">Our Products</h2>
            <p className="text-muted-foreground">
              Explore our exclusive packages and experiences
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-full max-w-sm">
                <Skeleton className="aspect-[4/3] w-full rounded-t-2xl" />
                <div className="p-5 space-y-3 bg-card rounded-b-2xl border border-t-0 border-border">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-3">
                    <Skeleton className="h-10 flex-1 rounded-xl" />
                    <Skeleton className="h-10 flex-1 rounded-xl" />
                  </div>
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Don't render section if no products
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">Our Products</h2>
          <p className="text-muted-foreground">
            Explore our exclusive packages and experiences
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          {products.map(({ product }) => (
            <InteractiveProduct3DCard
              key={product.id}
              title={product.title}
              price={product.price}
              currency={product.currency}
              priceUnit={product.price_unit}
              description={product.description || ""}
              imageUrl={product.image_url || "/placeholder.svg"}
              videoUrl={product.video_url || undefined}
              mediaType={product.media_type}
              coverageText={product.coverage_text || ""}
              deliverableText={product.deliverable_text || ""}
              isHighlighted={product.is_highlighted}
              highlightLabel={product.highlight_label || "Special Deal"}
              actionText={product.cta_text}
              onActionClick={() => handleProductClick(product)}
            />
          ))}
        </div>

        {/* Booking Funnel Modal with Campaign Product Mode */}
        {bookingProduct && (
          <BookingFunnelModal
            isOpen={!!bookingProduct}
            onClose={handleBookingClose}
            productId={bookingProduct.id}
            productTitle={bookingProduct.title}
            productPrice={bookingProduct.price}
            currency={bookingProduct.currency || 'USD'}
            // Campaign product mode props
            campaignProductMode={true}
            campaignId={campaignId}
            campaignSlug={campaignSlug}
            onAuthRequired={handleAuthRequired}
            resumeFromDate={
              pendingProductResume && pendingProductResume.product.id === bookingProduct.id
                ? { date: pendingProductResume.date, timezone: pendingProductResume.timezone }
                : undefined
            }
          />
        )}

        {/* Auth Modal for inline login */}
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={handleAuthModalClose} 
        />
      </div>
    </section>
  );
}