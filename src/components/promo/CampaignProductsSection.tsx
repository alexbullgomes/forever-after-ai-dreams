import { useState, useEffect } from "react";
import { InteractiveProduct3DCard } from "@/components/ui/3d-product-card";
import { Product } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingFunnelModal } from "@/components/booking/BookingFunnelModal";
import { supabase } from "@/integrations/supabase/client";

interface CampaignProductsSectionProps {
  campaignId: string;
}

interface CampaignProductWithDetails {
  id: string;
  campaign_id: string;
  product_id: string;
  sort_order: number;
  is_active: boolean;
  product: Product;
}

export function CampaignProductsSection({ campaignId }: CampaignProductsSectionProps) {
  const [products, setProducts] = useState<CampaignProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingProduct, setBookingProduct] = useState<Product | null>(null);

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

        {/* Booking Funnel Modal */}
        {bookingProduct && (
          <BookingFunnelModal
            isOpen={!!bookingProduct}
            onClose={() => setBookingProduct(null)}
            productId={bookingProduct.id}
            productTitle={bookingProduct.title}
            productPrice={bookingProduct.price}
            currency={bookingProduct.currency || 'USD'}
          />
        )}
      </div>
    </section>
  );
}
